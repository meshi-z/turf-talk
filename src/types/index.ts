import type { PhraseCategory, PhraseItem } from '../data/phrases';

export type HorseCondition = 'heavy' | 'flat' | 'up' | 'peak'; // 調子: 太め残り ↘, 平常 ➡, 上昇 ↗, 絶好調 ⤴

export type CareerWeek = 1 | 2 | 3 | 4;

/**
 * JRA「サラブレッド講座：毛色の種類」に準拠した全8毛色
 */
export type HorseCoatColor =
  | '鹿毛'
  | '栗毛'
  | '黒鹿毛'
  | '芦毛'
  | '青鹿毛'
  | '青毛'
  | '栃栗毛'
  | '白毛';

export type CareerRouteId =
  | 'classic-colt'   // 3歳牡馬クラシック路線
  | 'classic-filly'  // 3歳牝馬クラシック路線
  | 'sprint'         // 古馬短距離（スプリント）路線
  | 'middle'         // 古馬マイル・中距離路線
  | 'stayer'         // 古馬長距離（ステイヤー）路線
  | 'dirt-mile'      // ダート短中距離（マイル）路線
  | 'dirt-classic'   // ダート王道中距離路線
  | 'jump';          // 障害（ジャンプ）路線

export type CareerRaceGrade = 'Maiden' | 'G3' | 'G2' | 'G1' | 'WorldG1';

export interface CareerRouteRace {
  week: CareerWeek;
  raceName: string;
  distanceText: string;
  surface: 'turf' | 'dirt' | 'jump';
  grade: CareerRaceGrade;
  themeCategory: PhraseCategory;
}

export interface CareerRouteInfo {
  id: CareerRouteId;
  name: string;
  shortName: string;
  categoryName: string;
  sexAgeLabel: string;
  description: string;
  races: readonly [CareerRouteRace, CareerRouteRace, CareerRouteRace, CareerRouteRace];
}

export interface CareerRaceRecord {
  week: CareerWeek;
  raceName: string;
  score: number;
  placementText: string;
}

export interface CareerHorse {
  generation: number;                 // 世代番号 (1, 2, ...)
  name: string;                       // 馬名
  color: HorseCoatColor;              // 毛色 (8種類)
  routeId: CareerRouteId;             // 選択した路線
  currentWeek: CareerWeek;            // 現在週 (1〜4)
  weight: number;                     // 馬体重 (kg)
  raceHistory: CareerRaceRecord[];    // 出走戦績履歴
  learnedPhraseIdsInCareer: string[]; // この馬の担当期間中に習得したフレーズID
}

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
  carrotCount: number; // にんじん所持数 (0〜3)
  lastCarrotUsedDate?: string | null; // 直近ににんじんを消費して救済した論理日付
  careerHorse: CareerHorse; // 現在の担当競走馬キャリア情報
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

