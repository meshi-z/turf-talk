import type {
  CareerHorse,
  CareerRaceRecord,
  CareerRouteId,
  CareerRouteInfo,
  CareerRouteRace,
  CareerWeek,
  HallOfFameHorse,
  HorseCoatColor,
} from '../types';

export const DEFAULT_HORSE_NAME = 'ターフスター';
export const DEFAULT_HORSE_WEIGHT = 484;
export const DEFAULT_COAT_COLOR: HorseCoatColor = '鹿毛';
export const DEFAULT_ROUTE_ID: CareerRouteId = 'classic-colt';
export const MAX_HORSE_NAME_LENGTH = 18;
export const RECOMMENDED_TRAINING_DAYS_FOR_RACE = 3;

/**
 * JRA「サラブレッド講座：毛色の種類」に準拠した全8種類と出現確率（合計100%）
 * 白毛を最少の1%とし、現実のサラブレッド分布に合わせて傾斜を設定
 */
export interface CoatColorWeightEntry {
  color: HorseCoatColor;
  weight: number; // パーセンテージ (合計100)
  reading: string;
}

export const HORSE_COAT_COLOR_WEIGHTS: readonly CoatColorWeightEntry[] = [
  { color: '鹿毛', weight: 40, reading: 'かげ' },
  { color: '栗毛', weight: 22, reading: 'くりげ' },
  { color: '黒鹿毛', weight: 16, reading: 'くろかげ' },
  { color: '芦毛', weight: 8, reading: 'あしげ' },
  { color: '青鹿毛', weight: 6, reading: 'あおかげ' },
  { color: '青毛', weight: 4, reading: 'あおげ' },
  { color: '栃栗毛', weight: 3, reading: 'とちくりげ' },
  { color: '白毛', weight: 1, reading: 'しろげ' },
] as const;

export const HORSE_COAT_COLORS: readonly HorseCoatColor[] =
  HORSE_COAT_COLOR_WEIGHTS.map((entry) => entry.color);

/**
 * 重み付き抽選によって8種類の毛色から1つを選出する
 * @param randomValue 0以上1未満の乱数値（テスト時に注入可能、省略時は Math.random()）
 */
export function rollHorseCoatColor(randomValue: number = Math.random()): HorseCoatColor {
  const totalWeight = HORSE_COAT_COLOR_WEIGHTS.reduce((sum, item) => sum + item.weight, 0);
  const clampedRandom = Math.max(0, Math.min(0.999999, randomValue));
  let threshold = clampedRandom * totalWeight;

  for (const entry of HORSE_COAT_COLOR_WEIGHTS) {
    if (threshold < entry.weight) {
      return entry.color;
    }
    threshold -= entry.weight;
  }

  return DEFAULT_COAT_COLOR;
}

/**
 * 馬名自動生成用の安全な単語プール
 * 暴力・薬物・性的表現・ネガティブな語を含まない、爽やかで品格のある単語のみで構成
 */
export interface HorseNameWord {
  ja: string;
  en: string;
  partOfSpeech: 'adjective' | 'noun';
}

export const HORSE_NAME_PREFIXES: readonly HorseNameWord[] = [
  { ja: 'ターフ', en: 'Turf', partOfSpeech: 'noun' },
  { ja: 'サイレント', en: 'Silent', partOfSpeech: 'adjective' },
  { ja: 'ゴールデン', en: 'Golden', partOfSpeech: 'adjective' },
  { ja: 'グランド', en: 'Grand', partOfSpeech: 'adjective' },
  { ja: 'ノーブル', en: 'Noble', partOfSpeech: 'adjective' },
  { ja: 'ロイヤル', en: 'Royal', partOfSpeech: 'adjective' },
  { ja: 'コスモ', en: 'Cosmo', partOfSpeech: 'noun' },
  { ja: 'シャイニー', en: 'Shiny', partOfSpeech: 'adjective' },
  { ja: 'ブライト', en: 'Bright', partOfSpeech: 'adjective' },
  { ja: 'クリスタル', en: 'Crystal', partOfSpeech: 'noun' },
  { ja: 'エメラルド', en: 'Emerald', partOfSpeech: 'noun' },
  { ja: 'サンライズ', en: 'Sunrise', partOfSpeech: 'noun' },
  { ja: 'ウインド', en: 'Wind', partOfSpeech: 'noun' },
  { ja: 'シルバー', en: 'Silver', partOfSpeech: 'adjective' },
  { ja: 'ステラ', en: 'Stella', partOfSpeech: 'noun' },
  { ja: 'アストラル', en: 'Astral', partOfSpeech: 'adjective' },
  { ja: 'サファイア', en: 'Sapphire', partOfSpeech: 'noun' },
  { ja: 'ハッピー', en: 'Happy', partOfSpeech: 'adjective' },
  { ja: 'メイプル', en: 'Maple', partOfSpeech: 'noun' },
  { ja: 'オーシャン', en: 'Ocean', partOfSpeech: 'noun' },
] as const;

export const HORSE_NAME_SUFFIXES: readonly HorseNameWord[] = [
  { ja: 'スター', en: 'Star', partOfSpeech: 'noun' },
  { ja: 'ヒーロー', en: 'Hero', partOfSpeech: 'noun' },
  { ja: 'ランナー', en: 'Runner', partOfSpeech: 'noun' },
  { ja: 'クラウン', en: 'Crown', partOfSpeech: 'noun' },
  { ja: 'グローリー', en: 'Glory', partOfSpeech: 'noun' },
  { ja: 'ダンス', en: 'Dance', partOfSpeech: 'noun' },
  { ja: 'メテオ', en: 'Meteor', partOfSpeech: 'noun' },
  { ja: 'ウイング', en: 'Wing', partOfSpeech: 'noun' },
  { ja: 'ブリーズ', en: 'Breeze', partOfSpeech: 'noun' },
  { ja: 'ドリーム', en: 'Dream', partOfSpeech: 'noun' },
  { ja: 'オーロラ', en: 'Aurora', partOfSpeech: 'noun' },
  { ja: 'コンパス', en: 'Compass', partOfSpeech: 'noun' },
  { ja: 'マーチ', en: 'March', partOfSpeech: 'noun' },
  { ja: 'ステップ', en: 'Step', partOfSpeech: 'noun' },
  { ja: 'ソング', en: 'Song', partOfSpeech: 'noun' },
  { ja: 'リズム', en: 'Rhythm', partOfSpeech: 'noun' },
  { ja: 'フラッグ', en: 'Flag', partOfSpeech: 'noun' },
  { ja: 'ホープ', en: 'Hope', partOfSpeech: 'noun' },
  { ja: 'ライト', en: 'Light', partOfSpeech: 'noun' },
  { ja: 'スカイ', en: 'Sky', partOfSpeech: 'noun' },
] as const;

/**
 * 形容詞＋名詞 または 名詞＋名詞 の組み合わせでランダムに馬名（2〜9文字）を生成する
 */
export function generateRandomHorseName(currentName?: string): string {
  const candidates: string[] = [];

  for (const prefix of HORSE_NAME_PREFIXES) {
    for (const suffix of HORSE_NAME_SUFFIXES) {
      if (prefix.ja === suffix.ja || prefix.en === suffix.en) continue;
      const combined = `${prefix.ja}${suffix.ja}`;
      // JRA馬名規定（2〜9文字）に収まり、現在名と異なる候補を収集
      if (combined.length >= 2 && combined.length <= 9 && combined !== currentName) {
        candidates.push(combined);
      }
    }
  }

  if (candidates.length === 0) {
    return DEFAULT_HORSE_NAME;
  }

  const index = Math.floor(Math.random() * candidates.length);
  return candidates[index];
}

/**
 * 馬名に許可される文字パターン（カタカナ・ひらがな・漢字・英数字・長音・中黒・スペースのみ）
 * HTMLタグやスクリプト記号（< > & " ' ` / \ ; ( ) { } [ ] = 等）は一切許可しない
 */
const SAFE_HORSE_NAME_CHAR_REGEX =
  /[^a-zA-Z0-9\u3041-\u3096\u30A1-\u30FA\u30FC\u30FB\u4E00-\u9FFF\u3005 ]/g;
const SAFE_HORSE_NAME_TEST_REGEX =
  /^[a-zA-Z0-9\u3041-\u3096\u30A1-\u30FA\u30FC\u30FB\u4E00-\u9FFF\u3005 ]+$/;
const CONTROL_AND_BIDI_CHAR_REGEX = /[\p{Cc}\p{Cf}]/gu;

/**
 * ユーザー入力またはLocalStorage由来の馬名を無害化（サニタイズ）する
 * タグ記号（<, >）を含む不正な文字列は直ちにフォールバック名へ置換する
 */
export function sanitizeHorseName(
  input: unknown,
  fallback: string = DEFAULT_HORSE_NAME
): string {
  if (typeof input !== 'string') {
    return fallback;
  }

  const normalized = input.normalize('NFKC').replace(CONTROL_AND_BIDI_CHAR_REGEX, '');
  if (normalized.includes('<') || normalized.includes('>')) {
    return fallback;
  }

  const cleaned = normalized
    .replace(/\s+/g, ' ')
    .replace(SAFE_HORSE_NAME_CHAR_REGEX, '')
    .trim()
    .slice(0, MAX_HORSE_NAME_LENGTH);

  return cleaned.length > 0 ? cleaned : fallback;
}

export interface HorseNameValidationResult {
  isValid: boolean;
  sanitized: string;
  error?: string;
}

/**
 * カスタム馬名入力のバリデーション
 */
export function validateHorseName(rawInput: string): HorseNameValidationResult {
  if (typeof rawInput !== 'string') {
    return {
      isValid: false,
      sanitized: DEFAULT_HORSE_NAME,
      error: '馬名を入力してください。',
    };
  }

  const normalized = rawInput
    .normalize('NFKC')
    .replace(CONTROL_AND_BIDI_CHAR_REGEX, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (normalized.length === 0) {
    return {
      isValid: false,
      sanitized: '',
      error: '馬名を1文字以上入力してください。',
    };
  }

  if (normalized.length > MAX_HORSE_NAME_LENGTH) {
    return {
      isValid: false,
      sanitized: sanitizeHorseName(normalized, ''),
      error: `馬名は${MAX_HORSE_NAME_LENGTH}文字以内で入力してください。`,
    };
  }

  if (!SAFE_HORSE_NAME_TEST_REGEX.test(normalized)) {
    return {
      isValid: false,
      sanitized: sanitizeHorseName(normalized, ''),
      error: '記号や特殊文字は使用できません（カタカナ・ひらがな・漢字・英数字のみ）。',
    };
  }

  return {
    isValid: true,
    sanitized: normalized,
  };
}

/**
 * 8大路線（キャリアローテーション）定義
 */
export const CAREER_ROUTES: readonly CareerRouteInfo[] = [
  {
    id: 'classic-colt',
    name: '3歳牡馬クラシック路線',
    shortName: '牡馬クラシック',
    categoryName: '王道の中長距離芝',
    sexAgeLabel: '牡3',
    description: '日本ダービーから世界最高峰の凱旋門賞制覇を目指す王道路線',
    races: [
      {
        week: 1,
        raceName: 'メイクデビュー',
        distanceText: '芝1800m',
        surface: 'turf',
        grade: 'Maiden',
        themeCategory: 'feel',
      },
      {
        week: 2,
        raceName: '弥生賞',
        distanceText: 'G2・芝2000m',
        surface: 'turf',
        grade: 'G2',
        themeCategory: 'tactics',
      },
      {
        week: 3,
        raceName: '日本ダービー',
        distanceText: 'G1・芝2400m',
        surface: 'turf',
        grade: 'G1',
        themeCategory: 'reaction',
      },
      {
        week: 4,
        raceName: '凱旋門賞',
        distanceText: '世界G1・芝2400m',
        surface: 'turf',
        grade: 'WorldG1',
        themeCategory: 'comment',
      },
    ],
  },
  {
    id: 'classic-filly',
    name: '3歳牝馬クラシック路線',
    shortName: '牝馬クラシック',
    categoryName: '華やかな牝馬三冠',
    sexAgeLabel: '牝3',
    description: '桜・樫の舞台から仏国牝馬G1オペラ賞へ挑む華麗なる路線',
    races: [
      {
        week: 1,
        raceName: 'メイクデビュー',
        distanceText: '芝1600m',
        surface: 'turf',
        grade: 'Maiden',
        themeCategory: 'feel',
      },
      {
        week: 2,
        raceName: 'チューリップ賞',
        distanceText: 'G2・芝1600m',
        surface: 'turf',
        grade: 'G2',
        themeCategory: 'tactics',
      },
      {
        week: 3,
        raceName: '優駿牝馬（オークス）',
        distanceText: 'G1・芝2400m',
        surface: 'turf',
        grade: 'G1',
        themeCategory: 'reaction',
      },
      {
        week: 4,
        raceName: 'オペラ賞',
        distanceText: '世界牝馬G1・芝2000m',
        surface: 'turf',
        grade: 'WorldG1',
        themeCategory: 'comment',
      },
    ],
  },
  {
    id: 'sprint',
    name: '古馬短距離（スプリント）路線',
    shortName: 'スプリント',
    categoryName: '電撃の6ハロン戦',
    sexAgeLabel: '牡4',
    description: '一瞬の切れ味を武器に世界の快速王・香港スプリントを狙う路線',
    races: [
      {
        week: 1,
        raceName: 'オープン特別',
        distanceText: '芝1200m',
        surface: 'turf',
        grade: 'Maiden',
        themeCategory: 'feel',
      },
      {
        week: 2,
        raceName: 'セントウルS',
        distanceText: 'G2・芝1200m',
        surface: 'turf',
        grade: 'G2',
        themeCategory: 'tactics',
      },
      {
        week: 3,
        raceName: 'スプリンターズS',
        distanceText: 'G1・芝1200m',
        surface: 'turf',
        grade: 'G1',
        themeCategory: 'reaction',
      },
      {
        week: 4,
        raceName: '香港スプリント',
        distanceText: '世界G1・芝1200m',
        surface: 'turf',
        grade: 'WorldG1',
        themeCategory: 'comment',
      },
    ],
  },
  {
    id: 'middle',
    name: '古馬マイル・中距離路線',
    shortName: '古馬マイル・中距離',
    categoryName: 'スピードと底力の頂点',
    sexAgeLabel: '牡4',
    description: '伝統の盾・天皇賞（秋）からドバイの夜空へ飛躍する中距離路線',
    races: [
      {
        week: 1,
        raceName: '都大路S',
        distanceText: '芝1800m',
        surface: 'turf',
        grade: 'Maiden',
        themeCategory: 'feel',
      },
      {
        week: 2,
        raceName: '毎日王冠',
        distanceText: 'G2・芝1800m',
        surface: 'turf',
        grade: 'G2',
        themeCategory: 'tactics',
      },
      {
        week: 3,
        raceName: '天皇賞（秋）',
        distanceText: 'G1・芝2000m',
        surface: 'turf',
        grade: 'G1',
        themeCategory: 'reaction',
      },
      {
        week: 4,
        raceName: 'ドバイターフ',
        distanceText: '世界G1・芝1800m',
        surface: 'turf',
        grade: 'WorldG1',
        themeCategory: 'comment',
      },
    ],
  },
  {
    id: 'stayer',
    name: '古馬長距離（ステイヤー）路線',
    shortName: 'ステイヤー',
    categoryName: '息詰まるスタミナ勝負',
    sexAgeLabel: '牡4',
    description: '淀の3200mから英国伝統のアスコットゴールドCへ挑む長距離路線',
    races: [
      {
        week: 1,
        raceName: '迎春S',
        distanceText: '芝2500m',
        surface: 'turf',
        grade: 'Maiden',
        themeCategory: 'feel',
      },
      {
        week: 2,
        raceName: '阪神大賞典',
        distanceText: 'G2・芝3000m',
        surface: 'turf',
        grade: 'G2',
        themeCategory: 'tactics',
      },
      {
        week: 3,
        raceName: '天皇賞（春）',
        distanceText: 'G1・芝3200m',
        surface: 'turf',
        grade: 'G1',
        themeCategory: 'reaction',
      },
      {
        week: 4,
        raceName: 'アスコットゴールドC',
        distanceText: '英G1・芝4000m',
        surface: 'turf',
        grade: 'WorldG1',
        themeCategory: 'comment',
      },
    ],
  },
  {
    id: 'dirt-mile',
    name: 'ダート短中距離（マイル）路線',
    shortName: 'ダートマイル',
    categoryName: '砂のスピード＆パワー',
    sexAgeLabel: '牡4',
    description: 'フェブラリーS制覇から本場アメリカのBCダートマイルへ挑む路線',
    races: [
      {
        week: 1,
        raceName: 'プラタナス賞',
        distanceText: 'ダ1600m',
        surface: 'dirt',
        grade: 'Maiden',
        themeCategory: 'feel',
      },
      {
        week: 2,
        raceName: '武蔵野S',
        distanceText: 'G3・ダ1600m',
        surface: 'dirt',
        grade: 'G3',
        themeCategory: 'tactics',
      },
      {
        week: 3,
        raceName: 'フェブラリーS',
        distanceText: 'G1・ダ1600m',
        surface: 'dirt',
        grade: 'G1',
        themeCategory: 'reaction',
      },
      {
        week: 4,
        raceName: 'BCダートマイル',
        distanceText: '米G1・ダ1600m',
        surface: 'dirt',
        grade: 'WorldG1',
        themeCategory: 'comment',
      },
    ],
  },
  {
    id: 'dirt-classic',
    name: 'ダート王道中距離路線',
    shortName: 'ダート中距離',
    categoryName: '世界ダート最高峰',
    sexAgeLabel: '牡4',
    description: '国内ダート頂点から世界最高峰BCクラシック制覇を狙う王道ダート路線',
    races: [
      {
        week: 1,
        raceName: 'もちの木賞',
        distanceText: 'ダ1800m',
        surface: 'dirt',
        grade: 'Maiden',
        themeCategory: 'feel',
      },
      {
        week: 2,
        raceName: 'みやこS',
        distanceText: 'G3・ダ1800m',
        surface: 'dirt',
        grade: 'G3',
        themeCategory: 'tactics',
      },
      {
        week: 3,
        raceName: 'チャンピオンズC',
        distanceText: 'G1・ダ1800m',
        surface: 'dirt',
        grade: 'G1',
        themeCategory: 'reaction',
      },
      {
        week: 4,
        raceName: 'BCクラシック',
        distanceText: '米G1・ダ2000m',
        surface: 'dirt',
        grade: 'WorldG1',
        themeCategory: 'comment',
      },
    ],
  },
  {
    id: 'jump',
    name: '障害（ジャンプ）路線',
    shortName: '障害ジャンプ',
    categoryName: '飛越と不屈のドラマ',
    sexAgeLabel: '牡5',
    description: '中山大障害の栄誉から英国伝統のグランドナショナルへ挑む不屈の路線',
    races: [
      {
        week: 1,
        raceName: '障害未勝利',
        distanceText: '障2800m',
        surface: 'jump',
        grade: 'Maiden',
        themeCategory: 'feel',
      },
      {
        week: 2,
        raceName: '東京ハイジャンプ',
        distanceText: 'JG2・障3110m',
        surface: 'jump',
        grade: 'G2',
        themeCategory: 'tactics',
      },
      {
        week: 3,
        raceName: '中山大障害',
        distanceText: 'JG1・障4100m',
        surface: 'jump',
        grade: 'G1',
        themeCategory: 'reaction',
      },
      {
        week: 4,
        raceName: 'グランドナショナル',
        distanceText: '英G3・障7200m',
        surface: 'jump',
        grade: 'WorldG1',
        themeCategory: 'comment',
      },
    ],
  },
] as const;

export const CAREER_ROUTE_IDS: readonly CareerRouteId[] = CAREER_ROUTES.map((r) => r.id);

export function isValidCoatColor(value: unknown): value is HorseCoatColor {
  return typeof value === 'string' && (HORSE_COAT_COLORS as readonly string[]).includes(value);
}

export function isValidCareerRouteId(value: unknown): value is CareerRouteId {
  return typeof value === 'string' && (CAREER_ROUTE_IDS as readonly string[]).includes(value);
}

export function isValidCareerWeek(value: unknown): value is CareerWeek {
  return value === 1 || value === 2 || value === 3 || value === 4;
}

/**
 * 路線IDから路線情報を取得する
 */
export function getCareerRouteInfo(routeId: CareerRouteId): CareerRouteInfo {
  return CAREER_ROUTES.find((r) => r.id === routeId) ?? CAREER_ROUTES[0];
}

/**
 * 路線IDと現在週から今週の目標レース情報を取得する
 */
export function getCurrentWeekRaceInfo(
  routeId: CareerRouteId,
  week: CareerWeek
): CareerRouteRace {
  const route = getCareerRouteInfo(routeId);
  return route.races.find((r) => r.week === week) ?? route.races[0];
}

/**
 * 現在週と戦績履歴からホーム画面表示用のキャリアステージ文言を返す
 */
export function getCareerStageLabel(
  week: CareerWeek,
  raceHistory: readonly CareerRaceRecord[] = []
): string {
  const hasCompletedWeek4 = raceHistory.some((r) => r.week === 4);
  if (week === 4 && hasCompletedWeek4) {
    return 'Week 4: ラストラン完走';
  }
  switch (week) {
    case 1:
      return 'Week 1: 初陣前';
    case 2:
      return 'Week 2: 前哨戦前';
    case 3:
      return 'Week 3: 国内頂点前';
    case 4:
      return 'Week 4: ラストラン直前';
  }
}

/**
 * 平日調教の消化日数と曜日モードに基づく週末レース出走・仕上がり判定
 */
export interface CareerRaceReadiness {
  isWeekendUnlocked: boolean;
  isTrainingGoalMet: boolean;
  remainingTrainingDaysForGoal: number;
  canEnterRace: boolean;
}

export function evaluateCareerRaceReadiness(
  weekdayTrainingDays: number,
  isWeekendDay: boolean,
  recommendedDays: number = RECOMMENDED_TRAINING_DAYS_FOR_RACE
): CareerRaceReadiness {
  const safeDays = Math.max(0, Math.min(5, Math.floor(weekdayTrainingDays)));
  const isTrainingGoalMet = safeDays >= recommendedDays;
  const remainingTrainingDaysForGoal = Math.max(0, recommendedDays - safeDays);

  return {
    isWeekendUnlocked: isWeekendDay,
    isTrainingGoalMet,
    remainingTrainingDaysForGoal,
    canEnterRace: isWeekendDay || isTrainingGoalMet,
  };
}

/**
 * 新規または初期状態の CareerHorse を生成する
 */
export function createDefaultCareerHorse(overrides?: Partial<CareerHorse>): CareerHorse {
  return {
    generation: 1,
    name: DEFAULT_HORSE_NAME,
    color: DEFAULT_COAT_COLOR,
    routeId: DEFAULT_ROUTE_ID,
    currentWeek: 1,
    weight: DEFAULT_HORSE_WEIGHT,
    hasTrained: false,
    raceHistory: [],
    learnedPhraseIdsInCareer: [],
    ...overrides,
  };
}

/**
 * 当該世代の競走馬が既に初回調教を実施済み（馬名・毛色・路線がロック状態）か判定する
 */
export function isHorseProfileLocked(horse: CareerHorse): boolean {
  return Boolean(horse.hasTrained || horse.currentWeek > 1 || horse.raceHistory.length > 0);
}

/**
 * 「🎲 命名」実行時に、未調教（ロック前）であれば馬名と毛色（JRA基準8毛色）を同時に再抽選する
 * ロック済みの場合は変更せずそのまま返す
 */
export function rerollHorseIdentity(
  horse: CareerHorse,
  coatRandomValue?: number
): CareerHorse {
  if (isHorseProfileLocked(horse)) {
    return horse;
  }

  return {
    ...horse,
    name: generateRandomHorseName(horse.name),
    color: rollHorseCoatColor(coatRandomValue),
  };
}

/**
 * 未調教（ロック前）の場合のみ馬名をサニタイズして変更する
 */
export function changeHorseNameIfUnlocked(
  horse: CareerHorse,
  newName: string
): CareerHorse {
  if (isHorseProfileLocked(horse)) {
    return horse;
  }

  const sanitized = sanitizeHorseName(newName, horse.name);
  return {
    ...horse,
    name: sanitized,
  };
}

/**
 * 未調教（ロック前）の場合のみキャリア路線を変更する
 */
export function changeHorseRouteIfUnlocked(
  horse: CareerHorse,
  routeId: CareerRouteId
): CareerHorse {
  if (isHorseProfileLocked(horse) || !isValidCareerRouteId(routeId)) {
    return horse;
  }

  return {
    ...horse,
    routeId,
  };
}

/**
 * LocalStorage の保存データ（旧来の単頭データまたは既存の careerHorse データ）から
 * 安全にバリデーション・フォールバックを行って CareerHorse を復元する
 */
export function migrateToCareerHorse(rawProgress: unknown): CareerHorse {
  if (!rawProgress || typeof rawProgress !== 'object') {
    return createDefaultCareerHorse();
  }

  const record = rawProgress as Record<string, unknown>;
  const rawHorse =
    record.careerHorse && typeof record.careerHorse === 'object'
      ? (record.careerHorse as Record<string, unknown>)
      : null;

  const fallbackName = sanitizeHorseName(record.horseName, DEFAULT_HORSE_NAME);
  const fallbackWeight =
    typeof record.horseWeight === 'number' &&
    Number.isFinite(record.horseWeight) &&
    record.horseWeight >= 400 &&
    record.horseWeight <= 600
      ? Math.round(record.horseWeight)
      : DEFAULT_HORSE_WEIGHT;

  const fallbackLearnedIds = Array.isArray(record.learnedPhraseIds)
    ? record.learnedPhraseIds.filter((id): id is string => typeof id === 'string')
    : [];

  if (!rawHorse) {
    return createDefaultCareerHorse({
      generation: 1,
      name: fallbackName,
      color: DEFAULT_COAT_COLOR,
      routeId: DEFAULT_ROUTE_ID,
      currentWeek: 1,
      weight: fallbackWeight,
      hasTrained: false,
      raceHistory: [],
      learnedPhraseIdsInCareer: fallbackLearnedIds,
    });
  }

  const generation =
    typeof rawHorse.generation === 'number' &&
    Number.isFinite(rawHorse.generation) &&
    rawHorse.generation >= 1
      ? Math.floor(rawHorse.generation)
      : 1;

  const name = sanitizeHorseName(rawHorse.name, fallbackName);
  const color: HorseCoatColor = isValidCoatColor(rawHorse.color)
    ? rawHorse.color
    : DEFAULT_COAT_COLOR;
  const routeId: CareerRouteId = isValidCareerRouteId(rawHorse.routeId)
    ? rawHorse.routeId
    : DEFAULT_ROUTE_ID;
  const currentWeek: CareerWeek = isValidCareerWeek(rawHorse.currentWeek)
    ? rawHorse.currentWeek
    : 1;

  const weight =
    typeof rawHorse.weight === 'number' &&
    Number.isFinite(rawHorse.weight) &&
    rawHorse.weight >= 400 &&
    rawHorse.weight <= 600
      ? Math.round(rawHorse.weight)
      : fallbackWeight;

  const raceHistory: CareerRaceRecord[] = Array.isArray(rawHorse.raceHistory)
    ? rawHorse.raceHistory
        .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
        .map((item) => {
          const week: CareerWeek = isValidCareerWeek(item.week) ? item.week : 1;
          const raceName =
            typeof item.raceName === 'string' && item.raceName.trim().length > 0
              ? item.raceName.trim().slice(0, 40)
              : getCurrentWeekRaceInfo(routeId, week).raceName;
          const score =
            typeof item.score === 'number' && Number.isFinite(item.score)
              ? Math.max(0, Math.min(5, Math.floor(item.score)))
              : 0;
          const placementText =
            typeof item.placementText === 'string' && item.placementText.trim().length > 0
              ? item.placementText.trim().slice(0, 40)
              : '出走済';
          return { week, raceName, score, placementText };
        })
    : [];

  const learnedPhraseIdsInCareer: string[] = Array.isArray(rawHorse.learnedPhraseIdsInCareer)
    ? Array.from(
        new Set(
          rawHorse.learnedPhraseIdsInCareer.filter(
            (id): id is string => typeof id === 'string'
          )
        )
      )
    : fallbackLearnedIds;

  const hasTrained: boolean =
    typeof rawHorse.hasTrained === 'boolean'
      ? rawHorse.hasTrained
      : currentWeek > 1 || raceHistory.length > 0;

  return {
    generation,
    name,
    color,
    routeId,
    currentWeek,
    weight,
    hasTrained,
    raceHistory,
    learnedPhraseIdsInCareer,
  };
}

/**
 * 平日調教完了時に、担当馬のキャリア内習得フレーズと馬体重を更新し、プロフィールロック（hasTrained=true）を有効化する
 */
export function updateCareerHorseAfterTraining(
  horse: CareerHorse,
  correctPhraseIds: readonly string[],
  nextWeight: number
): CareerHorse {
  const mergedLearnedIds = Array.from(
    new Set([...horse.learnedPhraseIdsInCareer, ...correctPhraseIds])
  );

  return {
    ...horse,
    weight: nextWeight,
    hasTrained: true,
    learnedPhraseIdsInCareer: mergedLearnedIds,
  };
}

export interface CareerRaceAdvanceResult {
  nextHorse: CareerHorse;
  completedWeek: CareerWeek;
  nextWeek: CareerWeek;
  steppedUp: boolean;
  isFinalWeekCompleted: boolean;
  raceRecord: CareerRaceRecord;
}

/**
 * レース完走時に戦績を記録し、次のキャリア週（Week 1→2→3→4）へステップアップする
 */
export function advanceCareerHorseAfterRace(
  horse: CareerHorse,
  score: number,
  placementText: string,
  nextWeight: number
): CareerRaceAdvanceResult {
  const completedWeek = horse.currentWeek;
  const raceInfo = getCurrentWeekRaceInfo(horse.routeId, completedWeek);

  const raceRecord: CareerRaceRecord = {
    week: completedWeek,
    raceName: raceInfo.raceName,
    score: Math.max(0, Math.min(5, Math.floor(score))),
    placementText,
  };

  const existingIndex = horse.raceHistory.findIndex((r) => r.week === completedWeek);
  const nextHistory =
    existingIndex >= 0
      ? horse.raceHistory.map((r, i) => (i === existingIndex ? raceRecord : r))
      : [...horse.raceHistory, raceRecord];

  const nextWeek: CareerWeek =
    completedWeek < 4 ? ((completedWeek + 1) as CareerWeek) : 4;
  const steppedUp = nextWeek > completedWeek;
  const isFinalWeekCompleted = completedWeek === 4;

  const nextHorse: CareerHorse = {
    ...horse,
    currentWeek: nextWeek,
    weight: nextWeight,
    hasTrained: true,
    raceHistory: nextHistory,
  };

  return {
    nextHorse,
    completedWeek,
    nextWeek,
    steppedUp,
    isFinalWeekCompleted,
    raceRecord,
  };
}

/**
 * Week 4（最終週・海外G1等）のレースを完走済みかどうかを判定する
 */
export function isCareerWeek4Completed(horse: CareerHorse): boolean {
  return horse.raceHistory.some((r) => r.week === 4);
}

/**
 * 路線別の最高称号（国内＆世界G1連覇時）と国内G1覇者称号マップ
 */
const ROUTE_SUPREME_EPITHETS: Record<CareerRouteId, string> = {
  'classic-colt': '世界を翔ける至高の王者',
  'classic-filly': '華麗なる世界の女帝',
  sprint: '電光石火の世界快速王',
  middle: '威風堂々たる中距離の皇帝',
  stayer: '無尽蔵のワールドステイヤー',
  'dirt-mile': '砂塵を切り裂く剛脚王',
  'dirt-classic': '砂塵を統べる世界覇王',
  jump: '伝説のグランドジャンパー',
};

const ROUTE_DOMESTIC_G1_EPITHETS: Record<CareerRouteId, string> = {
  'classic-colt': '栄光のクラシック覇者',
  'classic-filly': 'ターフに咲く優駿の女王',
  sprint: '疾風の快速王',
  middle: '盾を制した中距離の雄',
  stayer: '不屈の長距離覇者',
  'dirt-mile': '砂のマイル王',
  'dirt-classic': '黄金のダート王者',
  jump: '不撓不屈の大障害王者',
};

/**
 * 生涯戦績・獲得タイトル・歩んだ路線から愛馬の「二つ名・称号」を決定する
 */
export function determineHorseEpithet(horse: CareerHorse): string {
  const history = horse.raceHistory;
  const wins = history.filter((r) => r.score === 5).length;
  const totalScore = history.reduce((sum, r) => sum + r.score, 0);
  const wonWeek3 = history.some((r) => r.week === 3 && r.score === 5);
  const wonWeek4 = history.some((r) => r.week === 4 && r.score === 5);

  if (wins >= 4 && history.length >= 4) {
    return '不敗の世界覇者';
  }

  if (wonWeek3 && wonWeek4) {
    return ROUTE_SUPREME_EPITHETS[horse.routeId] ?? '世界を制した名馬';
  }

  if (wonWeek4) {
    return '世界の頂に立つ名馬';
  }

  if (wonWeek3) {
    return ROUTE_DOMESTIC_G1_EPITHETS[horse.routeId] ?? '国内G1を制した名馬';
  }

  if (wins >= 1) {
    return 'ターフを沸かせた実力馬';
  }

  if (totalScore >= 12) {
    return '堅実無比の名バイプレイヤー';
  }

  return 'ひたむきな挑戦者';
}

export interface RetirementSummary {
  totalRaces: number;
  wins: number;
  totalScore: number;
  maxPossibleScore: number;
  titles: string[];
  titleName: string;
  learnedCount: number;
  routeName: string;
}

/**
 * 引退式セレモニー用の戦績・獲得タイトル・二つ名サマリーを算出する
 */
export function evaluateRetirementSummary(horse: CareerHorse): RetirementSummary {
  const route = getCareerRouteInfo(horse.routeId);
  const history = [...horse.raceHistory].sort((a, b) => a.week - b.week);
  const totalRaces = history.length;
  const wins = history.filter((r) => r.score === 5).length;
  const totalScore = history.reduce((sum, r) => sum + r.score, 0);
  const maxPossibleScore = Math.max(1, totalRaces) * 5;

  const titles = history
    .filter((r) => r.score === 5)
    .map((r) => `${r.raceName} 制覇`);

  const titleName = determineHorseEpithet(horse);

  return {
    totalRaces,
    wins,
    totalScore,
    maxPossibleScore,
    titles,
    titleName,
    learnedCount: horse.learnedPhraseIdsInCareer.length,
    routeName: route.name,
  };
}

/**
 * 引退する愛馬から殿堂入り（HallOfFameHorse）レコードを生成する
 */
export function createHallOfFameRecord(
  horse: CareerHorse,
  retiredDate: string
): HallOfFameHorse {
  const summary = evaluateRetirementSummary(horse);
  const sortedHistory = [...horse.raceHistory].sort((a, b) => a.week - b.week);

  return {
    id: `hof-gen-${horse.generation}-${retiredDate}`,
    generation: horse.generation,
    name: horse.name,
    color: horse.color,
    routeId: horse.routeId,
    routeName: summary.routeName,
    retiredDate,
    wins: summary.wins,
    totalRaces: summary.totalRaces,
    titles: summary.titles,
    learnedCount: summary.learnedCount,
    titleName: summary.titleName,
    raceHistory: sortedHistory,
  };
}

export interface NextGenerationHandoffResult {
  retiredRecord: HallOfFameHorse;
  nextHorse: CareerHorse;
}

/**
 * 現世代の愛馬を引退させて殿堂入りレコードを生成し、次世代（generation + 1）の新馬を誕生させる
 */
export function retireAndSpawnNextGeneration(
  currentHorse: CareerHorse,
  retiredDate: string,
  nextOverrides?: Partial<Pick<CareerHorse, 'name' | 'color' | 'routeId'>>
): NextGenerationHandoffResult {
  const retiredRecord = createHallOfFameRecord(currentHorse, retiredDate);
  const nextGenerationNumber = currentHorse.generation + 1;

  const nextName = nextOverrides?.name
    ? sanitizeHorseName(nextOverrides.name, generateRandomHorseName(currentHorse.name))
    : generateRandomHorseName(currentHorse.name);
  const nextColor =
    nextOverrides?.color && isValidCoatColor(nextOverrides.color)
      ? nextOverrides.color
      : rollHorseCoatColor();
  const nextRouteId =
    nextOverrides?.routeId && isValidCareerRouteId(nextOverrides.routeId)
      ? nextOverrides.routeId
      : currentHorse.routeId;

  const nextHorse = createDefaultCareerHorse({
    generation: nextGenerationNumber,
    name: nextName,
    color: nextColor,
    routeId: nextRouteId,
    currentWeek: 1,
    weight: DEFAULT_HORSE_WEIGHT,
    hasTrained: false,
    raceHistory: [],
    learnedPhraseIdsInCareer: [],
  });

  return {
    retiredRecord,
    nextHorse,
  };
}


