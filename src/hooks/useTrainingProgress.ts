import { useState, useEffect } from 'react';
import type { UserProgress } from '../types';
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
  getConditionFromDays,
  calculateRaceFeedback,
} from '../lib/conditionBonus';
import {
  getLogicalDateString,
  calculateNextStreakOnCompletion,
} from '../lib/logicalDate';
import {
  evaluateStreakWithCarrotRescue,
  calculateCarrotsFromRemainingReserves,
} from '../lib/carrotBonus';
import { INITIAL_PHRASES } from '../data/phrases';

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
  weekdayTrainingDays: 3, // 初期値3日（好調）
  carrotCount: 1, // 初期所持数1個（お試し・安心設計）
  lastCarrotUsedDate: null,
};

export function useTrainingProgress() {
  const [progress, setProgress] = useState<UserProgress>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const today = getLogicalDateString();
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

        return {
          ...DEFAULT_PROGRESS,
          ...parsed,
          streakDays: evalResult.streakDays,
          carrotCount: evalResult.carrotCount,
          lastCarrotUsedDate: evalResult.rescuedByCarrot ? today : parsed.lastCarrotUsedDate ?? null,
          learnedPhraseIds: Array.isArray(parsed.learnedPhraseIds) ? parsed.learnedPhraseIds : [],
          lapCount: typeof parsed.lapCount === 'number' ? parsed.lapCount : 1,
          todayPhraseIds: isSameDay && Array.isArray(parsed.todayPhraseIds) ? parsed.todayPhraseIds : [],
          completedToday: isSameDay,
          weekdayTrainingDays:
            typeof parsed.weekdayTrainingDays === 'number'
              ? Math.max(0, Math.min(5, parsed.weekdayTrainingDays))
              : 3,
        };
      }
    } catch {
      // LocalStorage読み取り失敗時のフォールバック
    }
    return DEFAULT_PROGRESS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // 保存エラーは無視
    }
  }, [progress]);

  const recordTodayPhrases = (phraseIds: string[]) => {
    setProgress((prev) => {
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
    sessionPhraseIds: string[] = []
  ) => {
    const today = getLogicalDateString();
    setProgress((prev) => {
      const isAlreadyCompletedToday = prev.lastTrainingDate === today;
      const nextStreak = isAlreadyCompletedToday
        ? prev.streakDays
        : calculateNextStreakOnCompletion(prev.streakDays, prev.lastTrainingDate, today);

      const nextWeekdayDays = isAlreadyCompletedToday
        ? prev.weekdayTrainingDays
        : Math.min(5, prev.weekdayTrainingDays + 1);

      // 調教日数に応じたコンディションを算出
      const tier = getConditionFromDays(nextWeekdayDays);

      const { nextLearnedIds, nextLapCount } = calculateNextProgressAfterCompletion(
        prev.learnedPhraseIds,
        prev.lapCount,
        correctPhraseIds,
        INITIAL_PHRASES.length
      );

      const nextTodayPhraseIds =
        prev.todayPhraseIds.length > 0
          ? prev.todayPhraseIds
          : sessionPhraseIds;

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
        weekdayTrainingDays: nextWeekdayDays,
      };
    });
  };

  /**
   * レース完了時のステータス変動および余力温存にんじんボーナス
   */
  const markRaceCompleted = (score: number, remainingReserves: number = 0) => {
    const feedback = calculateRaceFeedback(score, progress.horseWeight, progress.condition);
    const carrotBonus = calculateCarrotsFromRemainingReserves(progress.carrotCount, remainingReserves);

    setProgress((prev) => ({
      ...prev,
      horseWeight: feedback.nextWeight,
      condition: feedback.nextCondition,
      carrotCount: carrotBonus.nextCarrots,
    }));
    return {
      feedback,
      carrotBonus,
    };
  };

  const [debugDayOfWeek, setDebugDayOfWeek] = useState<DayOfWeek | null>(null);
  const [debugWeekdayDays, setDebugWeekdayDays] = useState<number | null>(null);
  const [debugCarrotCount, setDebugCarrotCount] = useState<number | null>(null);

  const resetProgressForDemo = () => {
    setProgress({
      ...DEFAULT_PROGRESS,
      lastTrainingDate: null,
      completedToday: false,
      learnedPhraseIds: [],
      lapCount: 1,
      todayPhraseIds: [],
      weekdayTrainingDays: 3,
    });
    setDebugDayOfWeek(null);
    setDebugWeekdayDays(null);
  };

  const todayStr = getLogicalDateString();
  const actualDayOfWeek = getDayOfWeek(todayStr);
  const effectiveDayOfWeek: DayOfWeek = debugDayOfWeek !== null ? debugDayOfWeek : actualDayOfWeek;
  const appMode: AppMode = getAppMode(effectiveDayOfWeek);
  const daysUntilWeekend: number = getDaysUntilWeekend(effectiveDayOfWeek);
  const isWeekendDay: boolean = isWeekend(effectiveDayOfWeek);

  // 平日調教日数の実効値と、それに基づくコンディション・馬体重・ヒント数
  const effectiveWeekdayDays =
    debugWeekdayDays !== null ? debugWeekdayDays : progress.weekdayTrainingDays;
  const conditionTier = getConditionFromDays(effectiveWeekdayDays);

  const effectiveCarrots =
    debugCarrotCount !== null ? debugCarrotCount : progress.carrotCount;

  return {
    progress: {
      ...progress,
      condition: conditionTier.condition,
      horseWeight: conditionTier.baseWeight,
      weekdayTrainingDays: effectiveWeekdayDays,
      carrotCount: effectiveCarrots,
    },
    conditionTier,
    recordTodayPhrases,
    markTrainingCompleted,
    markRaceCompleted,
    resetProgressForDemo,
    todayString: todayStr,
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
  };
}
