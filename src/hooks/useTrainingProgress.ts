import { useState, useEffect, useRef } from 'react';
import type { CareerRouteId, CareerWeek, HorseCoatColor, TrainingCourse, UserProgress } from '../types';
import { calculateNextProgressAfterCompletion } from '../lib/dailyRotation';
import {
  getDayOfWeek,
  getDaysUntilWeekend,
  getAppMode,
  isWeekend,
  type DayOfWeek,
  type AppMode,
} from '../lib/dayMode';
import {
  MAX_WEEKLY_TRAINING_DAYS,
  getConditionFromDays,
  calculateRaceFeedback,
} from '../lib/conditionBonus';
import {
  getLogicalDateString,
  calculateNextStreakOnCompletion,
  getLogicalWeekMonday,
  isWeeklyRaceCompletedForWeek,
  getDateStringForDayOfWeek,
} from '../lib/logicalDate';
import {
  calculateCarrotsFromRemainingReserves,
} from '../lib/carrotBonus';
import {
  createDefaultCareerHorse,
  updateCareerHorseAfterTraining,
  advanceCareerHorseAfterRace,
  generateRandomHorseName,
  rollHorseCoatColor,
  rerollHorseIdentity,
  changeHorseNameIfUnlocked,
  changeHorseRouteIfUnlocked,
  retireAndSpawnNextGeneration,
  getCurrentWeekRaceInfo,
} from '../lib/careerCycle';
import { calculateRacePlacement } from '../lib/raceMode';
import { INITIAL_PHRASES } from '../data/phrases';
import { createSampleHallOfFameHorses } from '../lib/hallOfFame';
import { recordNewPhrasePartners } from '../lib/phrasePartner';
import {
  logTrainingCompleted,
  logRaceCompleted,
  logHorseRetired,
  logPhraseBookmarked,
} from '../lib/analytics.ts';
import {
  fetchUserProgressFromFirestore,
  saveUserProgressToFirestore,
  subscribeUserProgressFromFirestore,
  normalizeUserProgress,
  shouldSkipCloudSave,
  type CloudProgressResult,
} from '../lib/firestoreSync.ts';

const STORAGE_KEY = 'turftalk_user_progress_v1';

const DEFAULT_PROGRESS: UserProgress = {
  lastTrainingDate: null,
  streakDays: 0, // 新規利用時の初期値0日
  condition: 'heavy',
  horseName: 'ターフスター',
  horseWeight: 500,
  completedToday: false,
  learnedPhraseIds: [],
  lapCount: 1,
  todayPhraseIds: [],
  todayWoodchipPhraseIds: [],
  completedCoursesToday: [],
  weekdayTrainingDays: 0, // 新規利用時の初期値0日（太め残り）
  carrotCount: 1, // 初期所持数1個（お試し・安心設計）
  lastCarrotUsedDate: null,
  currentWeekMonday: null,
  lastRaceWeekMonday: null,
  hasCompletedWeeklyRace: false,
  careerHorse: createDefaultCareerHorse(),
  hallOfFame: [],
  bookmarkedPhraseIds: [],
  phrasePartners: {},
};

// 曜日連動の調教日数シミュレーション用テーブル（月: 0日, 火: 1日, 水: 2日, 木: 3日, 金: 4日, 土: 5日, 日: 5日）
const SIMULATED_WEEKDAY_DAYS_BY_DAY: Record<DayOfWeek, number> = {
  1: 0,
  2: 1,
  3: 2,
  4: 3,
  5: 4,
  6: 5,
  0: 5,
};

export function useTrainingProgress(userId?: string | null) {
  const [progress, setProgress] = useState<UserProgress>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return normalizeUserProgress(parsed, DEFAULT_PROGRESS);
      }
    } catch {
      // LocalStorage読み取り失敗時のフォールバック
    }
    return {
      ...DEFAULT_PROGRESS,
      currentWeekMonday: getLogicalWeekMonday(getLogicalDateString()),
    };
  });

  const [debugDayOfWeek, setDebugDayOfWeek] = useState<DayOfWeek | null>(null);
  const [debugWeekdayDays, setDebugWeekdayDays] = useState<number | null>(null);
  const [debugCarrotCount, setDebugCarrotCount] = useState<number | null>(null);
  const [debugCareerWeek, setDebugCareerWeek] = useState<CareerWeek | null>(null);
  const [debugRaceCompleted, setDebugRaceCompleted] = useState<boolean | null>(null);

  const syncedUserIdRef = useRef<string | null>(null);
  const lastSyncedSerializedRef = useRef<string | null>(null);
  const latestProgressRef = useRef<UserProgress>(progress);

  // Firestore クラウドデータ同期（onSnapshot リアルタイム購読 + visibilitychange / focus 時の再同期）
  useEffect(() => {
    if (!userId) {
      syncedUserIdRef.current = null;
      lastSyncedSerializedRef.current = null;
      return;
    }

    let isMounted = true;
    let unsubscribeSnapshot: (() => void) | null = null;

    const applyCloudResult = (result: CloudProgressResult) => {
      if (!isMounted) return;

      if (result.isDeleted) {
        syncedUserIdRef.current = userId;
        lastSyncedSerializedRef.current = JSON.stringify(latestProgressRef.current);
        return;
      }

      if (result.progress) {
        const normalizedCloud = normalizeUserProgress(result.progress, DEFAULT_PROGRESS);
        const serializedCloud = JSON.stringify(normalizedCloud);
        lastSyncedSerializedRef.current = serializedCloud;
        syncedUserIdRef.current = userId;
        setProgress((prev) => (JSON.stringify(prev) === serializedCloud ? prev : normalizedCloud));
        return;
      }

      if (result.exists === false) {
        // クラウド上にまだドキュメントが存在しない新規ユーザー／初連携時は、現在のローカル状態を初期保存する
        syncedUserIdRef.current = userId;
        const currentProgress = latestProgressRef.current;
        const serializedCurrent = JSON.stringify(currentProgress);
        lastSyncedSerializedRef.current = serializedCurrent;
        saveUserProgressToFirestore(userId, currentProgress).catch((err) => {
          console.warn('[useTrainingProgress] Initial cloud document creation failed:', err);
        });
      }
    };

    const syncFromCloudOnce = async () => {
      try {
        const result = await fetchUserProgressFromFirestore(userId);
        applyCloudResult(result);
      } catch (err) {
        console.warn('[useTrainingProgress] Cloud fetch failed:', err);
      }
    };

    const startSubscription = () => {
      if (unsubscribeSnapshot) return;
      unsubscribeSnapshot = subscribeUserProgressFromFirestore(userId, applyCloudResult);
    };

    const stopSubscription = () => {
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }
    };

    if (typeof document === 'undefined' || document.visibilityState !== 'hidden') {
      startSubscription();
    }
    void syncFromCloudOnce();

    const handleVisibilityChange = () => {
      if (typeof document === 'undefined') return;
      if (document.visibilityState === 'hidden') {
        stopSubscription();
      } else if (document.visibilityState === 'visible') {
        startSubscription();
        void syncFromCloudOnce();
      }
    };

    const handleWindowFocus = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      startSubscription();
      void syncFromCloudOnce();
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleWindowFocus);
    }

    return () => {
      isMounted = false;
      stopSubscription();
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleWindowFocus);
      }
    };
  }, [userId]);

  useEffect(() => {
    latestProgressRef.current = progress;
    const serialized = JSON.stringify(progress);
    try {
      localStorage.setItem(STORAGE_KEY, serialized);
    } catch {
      // 保存エラーは無視
    }
    if (
      !userId ||
      shouldSkipCloudSave({
        userId,
        syncedUserId: syncedUserIdRef.current,
        currentSerialized: serialized,
        lastSyncedSerialized: lastSyncedSerializedRef.current,
      })
    ) {
      return;
    }
    lastSyncedSerializedRef.current = serialized;
    saveUserProgressToFirestore(userId, progress).catch((err) => {
      console.warn('[useTrainingProgress] Background cloud sync failed:', err);
    });
  }, [progress, userId]);

  const actualTodayStr = getLogicalDateString();
  const currentMonday = getLogicalWeekMonday(actualTodayStr);
  const actualDayOfWeek = getDayOfWeek(actualTodayStr);
  const effectiveDayOfWeek: DayOfWeek = debugDayOfWeek !== null ? debugDayOfWeek : actualDayOfWeek;
  const effectiveTodayString: string =
    debugDayOfWeek !== null
      ? getDateStringForDayOfWeek(currentMonday, debugDayOfWeek)
      : actualTodayStr;
  const appMode: AppMode = getAppMode(effectiveDayOfWeek);
  const daysUntilWeekend: number = getDaysUntilWeekend(effectiveDayOfWeek);
  const isWeekendDay: boolean = isWeekend(effectiveDayOfWeek);

  // 週間調教日数の実効値と、それに基づくコンディション・馬体重・ヒント数
  // 手動で debugWeekdayDays が設定されている場合はそれを最優先。
  // debugDayOfWeek のみが指定されている場合は、曜日に応じた調教消化日数を自動シミュレート。
  const effectiveWeekdayDays =
    debugWeekdayDays !== null
      ? debugWeekdayDays
      : debugDayOfWeek !== null
        ? SIMULATED_WEEKDAY_DAYS_BY_DAY[debugDayOfWeek]
        : progress.weekdayTrainingDays;
  const conditionTier = getConditionFromDays(effectiveWeekdayDays);

  const effectiveCarrots =
    debugCarrotCount !== null ? debugCarrotCount : progress.carrotCount;

  const effectiveCareerWeek: CareerWeek =
    debugCareerWeek !== null ? debugCareerWeek : progress.careerHorse.currentWeek;

  const actualRaceCompleted = isWeeklyRaceCompletedForWeek(
    progress.lastRaceWeekMonday,
    effectiveTodayString
  );
  const effectiveRaceCompleted: boolean =
    debugRaceCompleted !== null ? debugRaceCompleted : actualRaceCompleted;

  // 仮想日・当日における調教完了状態
  const isCompletedOnEffectiveDate = progress.lastTrainingDate === effectiveTodayString;
  const effectiveCompletedCoursesToday = isCompletedOnEffectiveDate
    ? (progress.completedCoursesToday ?? [])
    : [];

  const recordTodayPhrases = (phraseIds: string[], course: TrainingCourse = 'uphill') => {
    setProgress((prev) => {
      if (course === 'woodchip') {
        const currentWoodchip = prev.todayWoodchipPhraseIds ?? [];
        if (currentWoodchip.length > 0 && currentWoodchip.join(',') === phraseIds.join(',')) {
          return prev;
        }
        return {
          ...prev,
          todayWoodchipPhraseIds: phraseIds,
        };
      }

      if (prev.todayPhraseIds.length > 0 && prev.todayPhraseIds.join(',') === phraseIds.join(',')) {
        return prev;
      }
      return {
        ...prev,
        todayPhraseIds: phraseIds,
      };
    });
  };

  const markTrainingCompleted = (
    _score: number,
    correctPhraseIds: string[] = [],
    sessionPhraseIds: string[] = [],
    course: TrainingCourse = 'uphill',
    totalPhrasesCount?: number
  ) => {
    const today = effectiveTodayString;
    const todayMonday = getLogicalWeekMonday(today);
    setProgress((prev) => {
      const isAlreadyCompletedToday = prev.lastTrainingDate === today;
      const nextStreak = isAlreadyCompletedToday
        ? prev.streakDays
        : calculateNextStreakOnCompletion(prev.streakDays, prev.lastTrainingDate, today);

      const isSameWeek = !prev.currentWeekMonday || prev.currentWeekMonday === todayMonday;
      const baseWeeklyDays = isSameWeek ? prev.weekdayTrainingDays : 0;

      const nextWeekdayDays = isAlreadyCompletedToday
        ? baseWeeklyDays
        : Math.min(MAX_WEEKLY_TRAINING_DAYS, baseWeeklyDays + 1);

      // 調教日数に応じたコンディションを算出
      const tier = getConditionFromDays(nextWeekdayDays);

      const { nextLearnedIds, nextLapCount } = calculateNextProgressAfterCompletion(
        prev.learnedPhraseIds,
        prev.lapCount,
        correctPhraseIds,
        totalPhrasesCount ?? INITIAL_PHRASES.length
      );

      const nextTodayPhraseIds =
        course === 'uphill'
          ? (prev.todayPhraseIds.length > 0 ? prev.todayPhraseIds : sessionPhraseIds)
          : prev.todayPhraseIds;

      const nextTodayWoodchipPhraseIds =
        course === 'woodchip'
          ? ((prev.todayWoodchipPhraseIds && prev.todayWoodchipPhraseIds.length > 0)
              ? prev.todayWoodchipPhraseIds
              : sessionPhraseIds)
          : (prev.todayWoodchipPhraseIds ?? []);

      const nextCompletedCourses = Array.from(
        new Set([...(prev.completedCoursesToday ?? []), course])
      );

      const nextCareerHorse = updateCareerHorseAfterTraining(
        prev.careerHorse,
        correctPhraseIds,
        tier.baseWeight
      );

      const nextPhrasePartners = recordNewPhrasePartners(
        prev.phrasePartners,
        correctPhraseIds,
        prev.careerHorse
      );

      return {
        ...prev,
        lastTrainingDate: today,
        streakDays: nextStreak,
        condition: tier.condition,
        horseWeight: tier.baseWeight,
        completedToday: true,
        learnedPhraseIds: nextLearnedIds,
        lapCount: nextLapCount,
        todayPhraseIds: nextTodayPhraseIds,
        todayWoodchipPhraseIds: nextTodayWoodchipPhraseIds,
        completedCoursesToday: nextCompletedCourses,
        weekdayTrainingDays: nextWeekdayDays,
        currentWeekMonday: todayMonday,
        hasCompletedWeeklyRace: isWeeklyRaceCompletedForWeek(prev.lastRaceWeekMonday, today),
        careerHorse: nextCareerHorse,
        phrasePartners: nextPhrasePartners,
      };
    });
    logTrainingCompleted({
      course,
      score: _score,
      learnedCount: correctPhraseIds.length,
    });
  };

  /**
   * レース完了時のステータス変動、余力温存にんじんボーナス、次週へのキャリア進行、および当該週末の出走済記録
   */
  const markRaceCompleted = (score: number, remainingReserves: number = 0) => {
    const today = effectiveTodayString;
    const todayMonday = getLogicalWeekMonday(today);
    const activeWeek: CareerWeek =
      debugCareerWeek !== null ? debugCareerWeek : progress.careerHorse.currentWeek;
    const feedback = calculateRaceFeedback(score, progress.horseWeight, progress.condition);
    const carrotBonus = calculateCarrotsFromRemainingReserves(progress.carrotCount, remainingReserves);
    const placement = calculateRacePlacement(score, activeWeek);

    const horseForRace = {
      ...progress.careerHorse,
      currentWeek: activeWeek,
    };

    const careerAdvance = advanceCareerHorseAfterRace(
      horseForRace,
      score,
      placement.rankText,
      feedback.nextWeight
    );

    setProgress((prev) => ({
      ...prev,
      horseWeight: feedback.nextWeight,
      condition: feedback.nextCondition,
      carrotCount: carrotBonus.nextCarrots,
      currentWeekMonday: todayMonday,
      lastRaceWeekMonday: todayMonday,
      hasCompletedWeeklyRace: true,
      careerHorse: careerAdvance.nextHorse,
    }));

    if (debugCareerWeek !== null && careerAdvance.steppedUp) {
      setDebugCareerWeek(careerAdvance.nextWeek);
    }
    if (debugRaceCompleted !== null) {
      setDebugRaceCompleted(true);
    }

    const raceInfo = getCurrentWeekRaceInfo(horseForRace.routeId, activeWeek);
    const placementNumber = score === 5 ? 1 : score === 4 ? 2 : score >= 2 ? 6 - score : 6;
    logRaceCompleted({
      grade: raceInfo.grade,
      raceName: raceInfo.raceName,
      placement: placementNumber,
      placementText: placement.rankText,
      horseName: horseForRace.name,
      routeId: horseForRace.routeId,
      score,
    });

    return {
      feedback,
      carrotBonus,
      careerAdvance,
    };
  };

  /**
   * 未調教（ロック前）の場合のみ馬名を安全にサニタイズして更新する
   */
  const updateHorseName = (newName: string) => {
    setProgress((prev) => {
      const nextHorse = changeHorseNameIfUnlocked(prev.careerHorse, newName);
      return {
        ...prev,
        horseName: nextHorse.name,
        careerHorse: nextHorse,
      };
    });
  };

  /**
   * 「🎲 命名」実行時、未調教（ロック前）であれば馬名と毛色を同時にランダム再抽選して更新する
   */
  const regenerateHorseName = (): string => {
    const nextHorse = rerollHorseIdentity(progress.careerHorse);
    setProgress((prev) => {
      if (prev.careerHorse.hasTrained) return prev;
      return {
        ...prev,
        horseName: nextHorse.name,
        careerHorse: {
          ...prev.careerHorse,
          name: nextHorse.name,
          color: nextHorse.color,
        },
      };
    });
    return nextHorse.name;
  };

  /**
   * 未調教（ロック前）の場合のみキャリア路線（8大路線）を変更する
   */
  const updateCareerRoute = (routeId: CareerRouteId) => {
    setProgress((prev) => ({
      ...prev,
      careerHorse: changeHorseRouteIfUnlocked(prev.careerHorse, routeId),
    }));
  };

  /**
   * 毛色を重み付き抽選で再設定する（デバッグ用）
   */
  const rerollHorseCoatColor = (): HorseCoatColor => {
    const nextColor = rollHorseCoatColor();
    setProgress((prev) => ({
      ...prev,
      careerHorse: {
        ...prev.careerHorse,
        color: nextColor,
      },
    }));
    return nextColor;
  };

  /**
   * フレーズのお気に入り・要復習ブックマークをトグルする
   */
  const toggleBookmarkPhrase = (phraseId: string) => {
    setProgress((prev) => {
      const current = prev.bookmarkedPhraseIds ?? [];
      const willBookmark = !current.includes(phraseId);
      logPhraseBookmarked({ phraseId, isBookmarked: willBookmark });
      const next = current.includes(phraseId)
        ? current.filter((id) => id !== phraseId)
        : [...current, phraseId];
      return {
        ...prev,
        bookmarkedPhraseIds: next,
      };
    });
  };

  /**
   * 現在の愛馬を引退させて殿堂入り記録へ追加し、次世代（generation + 1）の新馬へ世代交代する。
   * ユーザー全体の連続学習ストリーク（streakDays）、にんじん所持数、習得フレーズ（learnedPhraseIds / lapCount）はそのまま引き継ぐ。
   */
  const retireCurrentHorse = (nextOverrides?: {
    name?: string;
    color?: HorseCoatColor;
    routeId?: CareerRouteId;
  }) => {
    const today = effectiveTodayString;
    const todayMonday = getLogicalWeekMonday(today);

    setProgress((prev) => {
      const { retiredRecord, nextHorse } = retireAndSpawnNextGeneration(
        prev.careerHorse,
        today,
        nextOverrides
      );
      const existingHoF = Array.isArray(prev.hallOfFame) ? prev.hallOfFame : [];
      const epithet = retiredRecord.titles && retiredRecord.titles.length > 0 ? retiredRecord.titles[0] : '';
      logHorseRetired({
        generation: prev.careerHorse.generation,
        totalWins: retiredRecord.wins,
        hallOfFame: retiredRecord.wins >= 2,
        epithet,
        careerWeeks: prev.careerHorse.currentWeek,
      });

      return {
        ...prev,
        horseName: nextHorse.name,
        horseWeight: 500,
        condition: 'heavy',
        weekdayTrainingDays: 0,
        currentWeekMonday: todayMonday,
        lastRaceWeekMonday: prev.lastRaceWeekMonday ?? null,
        hasCompletedWeeklyRace: prev.hasCompletedWeeklyRace ?? false,
        careerHorse: nextHorse,
        hallOfFame: [retiredRecord, ...existingHoF],
      };
    });

    setDebugCareerWeek(null);
    setDebugWeekdayDays(null);
    setDebugRaceCompleted(null);
  };

  const addSampleHallOfFameForDemo = () => {
    const samples = createSampleHallOfFameHorses();
    setProgress((prev) => {
      const currentHoF = Array.isArray(prev.hallOfFame) ? prev.hallOfFame : [];
      const existingIds = new Set(currentHoF.map((h) => h.id));
      const newSamples = samples.filter((s) => !existingIds.has(s.id));
      return {
        ...prev,
        hallOfFame: [...newSamples, ...currentHoF],
      };
    });
  };

  const resetProgressForDemo = () => {
    const today = getLogicalDateString();
    const initialColor = rollHorseCoatColor();
    const initialName = generateRandomHorseName();
    const freshHorse = createDefaultCareerHorse({
      name: initialName,
      color: initialColor,
    });
    setProgress({
      ...DEFAULT_PROGRESS,
      horseName: freshHorse.name,
      horseWeight: 500,
      condition: 'heavy',
      lastTrainingDate: null,
      completedToday: false,
      learnedPhraseIds: [],
      lapCount: 1,
      todayPhraseIds: [],
      todayWoodchipPhraseIds: [],
      completedCoursesToday: [],
      weekdayTrainingDays: 0,
      currentWeekMonday: getLogicalWeekMonday(today),
      lastRaceWeekMonday: null,
      hasCompletedWeeklyRace: false,
      careerHorse: freshHorse,
      hallOfFame: [],
      bookmarkedPhraseIds: [],
    });
    setDebugDayOfWeek(null);
    setDebugWeekdayDays(null);
    setDebugCarrotCount(null);
    setDebugCareerWeek(null);
    setDebugRaceCompleted(null);
  };

  return {
    progress: {
      ...progress,
      horseName: progress.careerHorse.name,
      condition: conditionTier.condition,
      horseWeight: conditionTier.baseWeight,
      weekdayTrainingDays: effectiveWeekdayDays,
      carrotCount: effectiveCarrots,
      hasCompletedWeeklyRace: effectiveRaceCompleted,
      completedToday: isCompletedOnEffectiveDate,
      completedCoursesToday: effectiveCompletedCoursesToday,
      todayPhraseIds: isCompletedOnEffectiveDate ? progress.todayPhraseIds : [],
      todayWoodchipPhraseIds: isCompletedOnEffectiveDate ? (progress.todayWoodchipPhraseIds ?? []) : [],
      bookmarkedPhraseIds: progress.bookmarkedPhraseIds ?? [],
      phrasePartners: progress.phrasePartners ?? {},
      careerHorse: {
        ...progress.careerHorse,
        currentWeek: effectiveCareerWeek,
        weight: conditionTier.baseWeight,
      },
    },
    conditionTier,
    recordTodayPhrases,
    markTrainingCompleted,
    markRaceCompleted,
    updateHorseName,
    regenerateHorseName,
    updateCareerRoute,
    rerollHorseCoatColor,
    retireCurrentHorse,
    resetProgressForDemo,
    addSampleHallOfFameForDemo,
    toggleBookmarkPhrase,
    todayString: effectiveTodayString,
    debugDayOfWeek,
    setDebugDayOfWeek,
    actualDayOfWeek,
    effectiveDayOfWeek,
    appMode,
    daysUntilWeekend,
    isWeekendDay,
    debugWeekdayDays,
    setDebugWeekdayDays,
    effectiveWeekdayDays,
    debugCarrotCount,
    setDebugCarrotCount,
    debugCareerWeek,
    setDebugCareerWeek,
    effectiveCareerWeek,
    debugRaceCompleted,
    setDebugRaceCompleted,
    hasCompletedWeeklyRace: effectiveRaceCompleted,
  };
}
