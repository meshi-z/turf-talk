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
  hasTrained: boolean;                // 初回調教実施済みフラグ（trueで馬名・毛色・路線をロック）
  raceHistory: CareerRaceRecord[];    // 出走戦績履歴
  learnedPhraseIdsInCareer: string[]; // この馬の担当期間中に習得したフレーズID
}

export interface HallOfFameHorse {
  id: string;
  generation: number;
  name: string;
  color: HorseCoatColor;
  routeId: CareerRouteId;
  routeName: string;
  retiredDate: string;                // YYYY-MM-DD
  wins: number;
  totalRaces: number;
  titles: string[];                   // 獲得タイトル一覧
  learnedCount: number;               // この馬の担当期間中に習得したフレーズ数
  titleName: string;                  // 授与された二つ名・称号
  raceHistory: CareerRaceRecord[];    // 出走戦績履歴
}

export type TrainingCourse = 'uphill' | 'woodchip';

export interface UserProgress {
  lastTrainingDate: string | null; // YYYY-MM-DD
  streakDays: number;
  condition: HorseCondition;
  horseName: string;
  horseWeight: number; // kg
  completedToday: boolean;
  learnedPhraseIds: string[]; // 履修済みフレーズID
  lapCount: number; // 周回数
  todayPhraseIds: string[]; // 本日の調教対象フレーズID（坂路調教）
  todayWoodchipPhraseIds?: string[]; // 本日の調教対象フレーズID（ウッドチップ調教）
  completedCoursesToday?: TrainingCourse[]; // 本日完了した調教コース一覧
  weekdayTrainingDays: number; // 今週の調教消化日数 (0〜7)
  carrotCount: number; // にんじん所持数 (0〜3)
  lastCarrotUsedDate?: string | null; // 直近ににんじんを消費して救済した論理日付
  currentWeekMonday?: string | null; // 週間調教日数を集計している対象週の月曜日 (YYYY-MM-DD)
  lastRaceWeekMonday?: string | null; // 直近に週末レースを出走完了した週の月曜日 (YYYY-MM-DD)
  hasCompletedWeeklyRace?: boolean; // 当該週の週末レースに出走済みかどうか
  careerHorse: CareerHorse; // 現在の担当競走馬キャリア情報
  hallOfFame?: HallOfFameHorse[]; // 引退・殿堂入りした愛馬アーカイブ
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

