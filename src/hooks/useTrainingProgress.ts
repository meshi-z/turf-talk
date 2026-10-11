import { useState, useEffect } from 'react';
import type { UserProgress } from '../types';

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
};

export function useTrainingProgress() {
  const [progress, setProgress] = useState<UserProgress>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const today = getTodayString();
        return {
          ...parsed,
          completedToday: parsed.lastTrainingDate === today,
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

  const markTrainingCompleted = (score: number) => {
    const today = getTodayString();
    setProgress((prev) => {
      const isAlreadyCompletedToday = prev.lastTrainingDate === today;
      const nextStreak = isAlreadyCompletedToday ? prev.streakDays : prev.streakDays + 1;
      
      // スコアに応じて調子変動
      const nextCondition = score >= 3 ? 'peak' : 'up';
      const weightChange = score >= 2 ? -2 : 2;

      return {
        ...prev,
        lastTrainingDate: today,
        streakDays: nextStreak,
        condition: nextCondition,
        horseWeight: Math.max(460, Math.min(520, prev.horseWeight + weightChange)),
        completedToday: true,
      };
    });
  };

  const resetProgressForDemo = () => {
    setProgress({
      ...DEFAULT_PROGRESS,
      lastTrainingDate: null,
      completedToday: false,
    });
  };

  return {
    progress,
    markTrainingCompleted,
    resetProgressForDemo,
    todayString: getTodayString(),
  };
}
