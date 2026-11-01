import { useState, useEffect } from 'react';
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
  evaluateStreakWithCarrotRescue,
  calculateCarrotsFromRemainingReserves,
} from '../lib/carrotBonus';
import {
  createDefaultCareerHorse,
  migrateToCareerHorse,
  updateCareerHorseAfterTraining,
  advanceCareerHorseAfterRace,
  generateRandomHorseName,
  rollHorseCoatColor,
  rerollHorseIdentity,
  changeHorseNameIfUnlocked,
  changeHorseRouteIfUnlocked,
  retireAndSpawnNextGeneration,
} from '../lib/careerCycle';
import { calculateRacePlacement } from '../lib/raceMode';
import { INITIAL_PHRASES } from '../data/phrases';
import { createSampleHallOfFameHorses } from '../lib/hallOfFame';

const STORAGE_KEY = 'turftalk_user_progress_v1';

const DEFAULT_PROGRESS: UserProgress = {
  lastTrainingDate: null,
  streakDays: 0, // 新規利用時の初期値0日
  condition: 'up',
  horseName: 'ターフスター',
  horseWeight: 484,
  completedToday: false,
  learnedPhraseIds: [],
  lapCount: 1,
  todayPhraseIds: [],
  todayWoodchipPhraseIds: [],
  completedCoursesToday: [],
  weekdayTrainingDays: 3, // 初期値3日（好調）
  carrotCount: 1, // 初期所持数1個（お試し・安心設計）
  lastCarrotUsedDate: null,
  currentWeekMonday: null,
  lastRaceWeekMonday: null,
  hasCompletedWeeklyRace: false,
  careerHorse: createDefaultCareerHorse(),
  hallOfFame: [],
  bookmarkedPhraseIds: [],
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

export function useTrainingProgress() {
  const [progress, setProgress] = useState<UserProgress>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const today = getLogicalDateString();
        const todayMonday = getLogicalWeekMonday(today);
        const isSameDay = parsed.lastTrainingDate === today;
        const savedStreak = typeof parsed.streakDays === 'number' ? parsed.streakDays : 0;
        const savedCarrots = typeof parsed.carrotCount === 'number' ? parsed.carrotCount : 1;

        // にんじんストリーク救済ロジックを実行
        const evalResult = evaluateStreakWithCarrotRescue(
          savedStreak,
          parsed.lastTrainingDate ?? null,
          today,
          savedCarrots
        );

        // 既存データから安全に CareerHorse をマイグレーション・復元
        const migratedHorse = migrateToCareerHorse(parsed);

        // 週替わり判定（月曜午前4時で新しい週に入った場合は週間調教日数および週末レース出走済フラグをリセット）
        const savedWeekMonday =
          typeof parsed.currentWeekMonday === 'string' ? parsed.currentWeekMonday : null;
        const isNewWeek = savedWeekMonday !== null && savedWeekMonday !== todayMonday;

        const restoredWeeklyDays = isNewWeek
          ? 0
          : typeof parsed.weekdayTrainingDays === 'number'
            ? Math.max(0, Math.min(MAX_WEEKLY_TRAINING_DAYS, parsed.weekdayTrainingDays))
            : 3;

        const lastRaceWeekMonday =
          typeof parsed.lastRaceWeekMonday === 'string' ? parsed.lastRaceWeekMonday : null;
        const completedWeeklyRace = isWeeklyRaceCompletedForWeek(lastRaceWeekMonday, today);

        return {
          ...DEFAULT_PROGRESS,
          ...parsed,
          horseName: migratedHorse.name,
          horseWeight: migratedHorse.weight,
          streakDays: evalResult.streakDays,
          carrotCount: evalResult.carrotCount,
          lastCarrotUsedDate: evalResult.rescuedByCarrot ? today : parsed.lastCarrotUsedDate ?? null,
          learnedPhraseIds: Array.isArray(parsed.learnedPhraseIds) ? parsed.learnedPhraseIds : [],
          lapCount: typeof parsed.lapCount === 'number' ? parsed.lapCount : 1,
          todayPhraseIds: isSameDay && Array.isArray(parsed.todayPhraseIds) ? parsed.todayPhraseIds : [],
          todayWoodchipPhraseIds:
            isSameDay && Array.isArray(parsed.todayWoodchipPhraseIds)
              ? parsed.todayWoodchipPhraseIds
              : [],
          completedCoursesToday:
            isSameDay && Array.isArray(parsed.completedCoursesToday)
              ? parsed.completedCoursesToday
              : [],
          completedToday: isSameDay,
          weekdayTrainingDays: restoredWeeklyDays,
          currentWeekMonday: todayMonday,
          lastRaceWeekMonday,
          hasCompletedWeeklyRace: completedWeeklyRace,
          careerHorse: migratedHorse,
          hallOfFame: Array.isArray(parsed.hallOfFame) ? parsed.hallOfFame : [],
          bookmarkedPhraseIds: Array.isArray(parsed.bookmarkedPhraseIds) ? parsed.bookmarkedPhraseIds : [],
        };
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

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // 保存エラーは無視
    }
  }, [progress]);

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
    course: TrainingCourse = 'uphill'
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
        INITIAL_PHRASES.length
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
      };
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

      return {
        ...prev,
        horseName: nextHorse.name,
        horseWeight: nextHorse.weight,
        condition: 'up',
        weekdayTrainingDays: 3,
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
      horseWeight: freshHorse.weight,
      lastTrainingDate: null,
      completedToday: false,
      learnedPhraseIds: [],
      lapCount: 1,
      todayPhraseIds: [],
      todayWoodchipPhraseIds: [],
      completedCoursesToday: [],
      weekdayTrainingDays: 3,
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
