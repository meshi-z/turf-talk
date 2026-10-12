import type { PhraseItem } from '../data/phrases';

export type HorseCondition = 'heavy' | 'flat' | 'up' | 'peak'; // 調子: 太め残り ↘, 平常 ➡, 上昇 ↗, 絶好調 ⤴

export interface UserProgress {
  lastTrainingDate: string | null; // YYYY-MM-DD
  streakDays: number;
  condition: HorseCondition;
  horseName: string;
  horseWeight: number; // kg
  completedToday: boolean;
  learnedPhraseIds: string[]; // 履修済みフレーズID
  lapCount: number; // 周回数
  todayPhraseIds: string[]; // 本日の調教対象フレーズID
  weekdayTrainingDays: number; // 今週の平日調教消化日数 (0〜5)
}

export interface QuizSessionState {
  questions: PhraseItem[];
  currentIndex: number;
  selectedOptionId: string | null;
  isAnswered: boolean;
  score: number;
  answeredHistory: {
    phrase: PhraseItem;
    selectedOptionId: string;
    isCorrect: boolean;
  }[];
}
