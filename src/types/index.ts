import type { PhraseItem } from '../data/phrases';

export interface UserProgress {
  lastTrainingDate: string | null; // YYYY-MM-DD
  streakDays: number;
  condition: 'flat' | 'up' | 'peak'; // 調子: 平常 ➡, 上昇 ↗, 絶好調 ⤴
  horseName: string;
  horseWeight: number; // kg
  completedToday: boolean;
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
