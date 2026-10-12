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
import { INITIAL_PHRASES } from '../data/phrases';

const STORAGE_KEY = 'turftalk_user_progress_v1';

function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const DEFAULT_PROGRESS: UserProgress = {
  lastTrainingDate: null,
  streakDays: 3, // デモ用に初期値3日
  condition: 'up',
  horseName: 'ターフスター',
  horseWeight: 482,
  completedToday: false,
  learnedPhraseIds: [],
  lapCount: 1,
  todayPhraseIds: [],
};

export function useTrainingProgress() {
  const [progress, setProgress] = useState<UserProgress>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const today = getTodayString();
        const isSameDay = parsed.lastTrainingDate === today;
        return {
          ...DEFAULT_PROGRESS,
          ...parsed,
          learnedPhraseIds: Array.isArray(parsed.learnedPhraseIds) ? parsed.learnedPhraseIds : [],
          lapCount: typeof parsed.lapCount === 'number' ? parsed.lapCount : 1,
          todayPhraseIds: isSameDay && Array.isArray(parsed.todayPhraseIds) ? parsed.todayPhraseIds : [],
          completedToday: isSameDay,
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
    score: number,
    correctPhraseIds: string[] = [],
    sessionPhraseIds: string[] = []
  ) => {
    const today = getTodayString();
    setProgress((prev) => {
      const isAlreadyCompletedToday = prev.lastTrainingDate === today;
      const nextStreak = isAlreadyCompletedToday ? prev.streakDays : prev.streakDays + 1;
      
      // スコアに応じて調子変動
      const nextCondition = score >= 3 ? 'peak' : 'up';
      const weightChange = score >= 2 ? -2 : 2;

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
        condition: nextCondition,
        horseWeight: Math.max(460, Math.min(520, prev.horseWeight + weightChange)),
        completedToday: true,
        learnedPhraseIds: nextLearnedIds,
        lapCount: nextLapCount,
        todayPhraseIds: nextTodayPhraseIds,
      };
    });
  };

  const [debugDayOfWeek, setDebugDayOfWeek] = useState<DayOfWeek | null>(null);

  const resetProgressForDemo = () => {
    setProgress({
      ...DEFAULT_PROGRESS,
      lastTrainingDate: null,
      completedToday: false,
      learnedPhraseIds: [],
      lapCount: 1,
      todayPhraseIds: [],
    });
    setDebugDayOfWeek(null);
  };

  const todayStr = getTodayString();
  const actualDayOfWeek = getDayOfWeek(todayStr);
  const effectiveDayOfWeek: DayOfWeek = debugDayOfWeek !== null ? debugDayOfWeek : actualDayOfWeek;
  const appMode: AppMode = getAppMode(effectiveDayOfWeek);
  const daysUntilWeekend: number = getDaysUntilWeekend(effectiveDayOfWeek);
  const isWeekendDay: boolean = isWeekend(effectiveDayOfWeek);

  return {
    progress,
    recordTodayPhrases,
    markTrainingCompleted,
    resetProgressForDemo,
    todayString: todayStr,
    debugDayOfWeek,
    setDebugDayOfWeek,
    actualDayOfWeek,
    effectiveDayOfWeek,
    appMode,
    daysUntilWeekend,
    isWeekendDay,
  };
}
