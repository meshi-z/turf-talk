import type { HorseCoatColor, TrainingCourse } from '../types';

/**
 * 競走馬の表示シーン種別
 */
export type HorseSceneType =
  | 'standing_left'      // ① ホーム画面（公式立ち絵・左向き・無装具）
  | 'training_gallop'    // ② 平日調教（6コマ疾走スプライト・右向き・白ゼッケン）
  | 'training_complete'  // ③ 平日調教完了（達成立ち絵・右向き・無装具）
  | 'race_gallop'        // ④ 週末レース（6コマ全力疾走スプライト・右向き・濃紺ゼッケン1番）
  | 'race_victory'       // ⑤-A 週末レース1着勝利（堂々立ち絵・右向き）
  | 'race_cooldown';     // ⑤-B 週末レース惜敗・労い（息整え立ち絵・右向き）

export type StaticHorseSceneType = Extract<
  HorseSceneType,
  'standing_left' | 'training_complete' | 'race_victory' | 'race_cooldown'
>;

/**
 * 背景イラスト種別（全8バリエーション）
 */
export type HorseBackgroundType =
  | 'pasture'          // ① ホーム画面：のどかな牧場
  | 'uphill_course'    // ②-A 平日調教：坂路調教コース
  | 'woodchip_course'  // ②-B 平日調教：ウッドチップ調教コース
  | 'stable'           // ③ 調教完了 ＆ ⑤-B レース惜敗：厩舎（馬房）
  | 'turf_race'        // ④-A 週末レース：芝本馬場コース
  | 'dirt_race'        // ④-B 週末レース：ダート本馬場コース
  | 'winners_circle'   // ⑤-A レース勝利：ウィナーズサークル
  | 'hall_of_fame';    // ⑥ 殿堂入りギャラリー：クラブハウス記念肖像フレーム

export const HORSE_BACKGROUND_FILE_MAP: Record<HorseBackgroundType, string> = {
  pasture: 'bg_pasture.jpg',
  uphill_course: 'bg_uphill_course.jpg',
  woodchip_course: 'bg_woodchip_course.jpg',
  stable: 'bg_stable.jpg',
  turf_race: 'bg_turf_race.jpg',
  dirt_race: 'bg_dirt_race.jpg',
  winners_circle: 'bg_winners_circle.jpg',
  hall_of_fame: 'bg_hall_of_fame.jpg',
};

/**
 * JRA全8毛色日本語名とアセット用英語キーの相互変換マッピング
 */
export const HORSE_COAT_KEY_MAP: Record<HorseCoatColor, string> = {
  '鹿毛': 'bay',
  '栗毛': 'chestnut',
  '黒鹿毛': 'dark_bay',
  '芦毛': 'grey',
  '青鹿毛': 'seal_brown',
  '青毛': 'black',
  '栃栗毛': 'liver_chestnut',
  '白毛': 'white',
};

export const REVERSE_HORSE_COAT_KEY_MAP: Record<string, HorseCoatColor> = {
  bay: '鹿毛',
  chestnut: '栗毛',
  dark_bay: '黒鹿毛',
  grey: '芦毛',
  seal_brown: '青鹿毛',
  black: '青毛',
  liver_chestnut: '栃栗毛',
  white: '白毛',
};

// Viteのバンドル時静的アセット解決（Node.jsテスト環境等での未定義フォールバック付き）
const globFn = (import.meta as unknown as {
  glob?: (pattern: string, options: { eager: boolean }) => Record<string, { default: string }>;
}).glob;

const horseAssetModules: Record<string, { default: string }> =
  typeof globFn === 'function'
    ? globFn('../assets/horses/*.jpg', { eager: true })
    : {};

const backgroundAssetModules: Record<string, { default: string }> =
  typeof globFn === 'function'
    ? globFn('../assets/backgrounds/*.jpg', { eager: true })
    : {};

/**
 * 毛色とシーンに応じた競走馬アセットの画像URLを取得します。
 *
 * @param color 毛色（JRA基準8毛色）
 * @param scene シーン種別（全6種）
 * @returns 画像アセットURL
 */
export function getHorseImageUrl(color: HorseCoatColor, scene: HorseSceneType): string {
  const coatKey = HORSE_COAT_KEY_MAP[color] ?? 'bay';
  const fileName = `${coatKey}_${scene}.jpg`;
  const relativePath = `../assets/horses/${fileName}`;

  if (horseAssetModules[relativePath]?.default) {
    return horseAssetModules[relativePath].default;
  }

  // Vite開発サーバーまたは未解決時のフォールバックURL
  return new URL(`../assets/horses/${fileName}`, import.meta.url).href;
}

/**
 * 背景種別に応じた背景イラストアセットの画像URLを取得します。
 *
 * @param bgType 背景種別（全7種）
 * @returns 背景画像アセットURL
 */
export function getBackgroundImageUrl(bgType: HorseBackgroundType): string {
  const fileName = HORSE_BACKGROUND_FILE_MAP[bgType] ?? 'bg_pasture.jpg';
  const relativePath = `../assets/backgrounds/${fileName}`;

  if (backgroundAssetModules[relativePath]?.default) {
    return backgroundAssetModules[relativePath].default;
  }

  return new URL(`../assets/backgrounds/${fileName}`, import.meta.url).href;
}

/**
 * 静止画シーンに対応する背景イラスト種別を返します。
 */
export function resolveStaticSceneBackground(scene: StaticHorseSceneType): HorseBackgroundType {
  switch (scene) {
    case 'standing_left':
      return 'pasture';
    case 'training_complete':
      return 'stable';
    case 'race_victory':
      return 'winners_circle';
    case 'race_cooldown':
      return 'stable';
  }
}

/**
 * 疾走アニメーションシーンに対応する背景イラスト種別を返します。
 */
export function resolveGallopSceneBackground(
  scene: 'training_gallop' | 'race_gallop',
  courseType: TrainingCourse = 'uphill',
  raceSurface: 'turf' | 'dirt' | 'jump' = 'turf'
): HorseBackgroundType {
  if (scene === 'training_gallop') {
    return courseType === 'woodchip' ? 'woodchip_course' : 'uphill_course';
  }
  return raceSurface === 'dirt' ? 'dirt_race' : 'turf_race';
}

/**
 * 毛色の英語キーを取得します。
 */
export function getCoatKey(color: HorseCoatColor): string {
  return HORSE_COAT_KEY_MAP[color] ?? 'bay';
}

export const SPRITE_FRAME_WIDTH = 500;
export const SPRITE_FRAME_HEIGHT = 360;
export const SPRITE_TOTAL_FRAMES = 6;
export const SPRITE_COLS = 3;

export const STATIC_ILLUSTRATION_WIDTH = 1376;
export const STATIC_ILLUSTRATION_HEIGHT = 768;

/**
 * 静止画シーン（1376×768）における閉領域（手綱と首の間・二重手綱の間）のピンポイント透過シード座標
 * - standing_left / training_complete は無装具のため閉領域なし
 * - race_victory / race_cooldown は手綱間の閉領域2箇所のみピンポイント指定し、白毛馬体の誤透過を防止
 */
export const STATIC_CLOSED_REGION_SEEDS: Record<
  StaticHorseSceneType,
  ReadonlyArray<readonly [number, number]>
> = {
  standing_left: [],
  training_complete: [],
  race_victory: [
    [1000, 257],
    [982, 314],
  ],
  race_cooldown: [
    [1008, 320],
    [971, 356],
  ],
};

/**
 * 閉領域①：首・手綱の間の三角形空間のフレーム別透過シード座標 (Frame 0〜5)
 * - 平日調教（一定姿勢）と週末レース（ヘッドボブ連動）でそれぞれの閉領域中心を指定
 * - 広範囲グリッド走査を行わないことで、白毛の首・頭部被毛への誤シードを防止
 */
export const TRAINING_REINS_SEEDS: ReadonlyArray<readonly [number, number]> = [
  [408, 107],
  [403, 110],
  [404, 110],
  [403, 111],
  [404, 110],
  [408, 107],
];

export const RACE_REINS_SEEDS: ReadonlyArray<readonly [number, number]> = [
  [408, 113],
  [403, 108],
  [404, 101],
  [402, 105],
  [404, 112],
  [408, 116],
];

/**
 * 閉領域②：交差する後肢の間の閉空間のフレーム別透過シード座標 (Frame 2・Frame 3のみ存在)
 * - 白毛の脚被毛（ソックスなし純白）への誤シードを防ぐため、閉空間が存在するフレームの中心のみ指定
 */
export const CROSSED_HIND_LEGS_SEEDS: ReadonlyArray<readonly [number, number] | null> = [
  null,
  null,
  [195, 225],
  [199, 222],
  null,
  null,
];

/**
 * 背景の白系ピクセル判定
 */
export function isWhiteLikePixel(r: number, g: number, b: number): boolean {
  return r >= 232 && g >= 232 && b >= 232;
}

/**
 * 輪郭の黒主線ピクセル判定
 */
export function isBoundaryBlackPixel(r: number, g: number, b: number): boolean {
  return r < 70 && g < 70 && b < 70;
}

/**
 * 平日調教アニメにおける白ゼッケン内部保護判定
 * - 背中ライン（Y=100）および黒鞍より下の実際の白ゼッケン内部（X: 228..276, Y: 105..150）のみを保護し、
 *   鞍の周囲・背中上の外側背景（Y < 100）の透過を阻害しない
 */
export function isProtectedWhiteSaddleCloth(x: number, y: number, isTraining: boolean): boolean {
  return isTraining && x >= 228 && x <= 276 && y >= 105 && y <= 150;
}

/**
 * 単一フレームのRGBAピクセル配列に対して、外周および閉領域ピンポイントシードから背景透過を適用します。
 */
export function applyFrameFloodFillTransparency(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  frameIndex: number,
  isTraining: boolean
): void {
  const visited = new Uint8Array(width * height);

  const floodFill = (startX: number, startY: number) => {
    if (startX < 0 || startX >= width || startY < 0 || startY >= height) return;
    const startIdx = startY * width + startX;
    if (visited[startIdx]) return;

    const pIdx = startIdx * 4;
    if (!isWhiteLikePixel(data[pIdx], data[pIdx + 1], data[pIdx + 2])) return;

    const queue: number[] = [startIdx];
    visited[startIdx] = 1;

    while (queue.length > 0) {
      const curr = queue.pop()!;
      const cx = curr % width;
      const cy = Math.floor(curr / width);
      const cp = curr * 4;

      if (isProtectedWhiteSaddleCloth(cx, cy, isTraining)) {
        continue;
      }

      // 透明化
      data[cp + 3] = 0;

      // 4近傍走査
      const neighbors = [
        cy > 0 ? (cy - 1) * width + cx : -1,
        cy < height - 1 ? (cy + 1) * width + cx : -1,
        cx > 0 ? cy * width + (cx - 1) : -1,
        cx < width - 1 ? cy * width + (cx + 1) : -1,
      ];

      for (const n of neighbors) {
        if (n === -1 || visited[n]) continue;
        const np = n * 4;
        const nr = data[np];
        const ng = data[np + 1];
        const nb = data[np + 2];

        if (!isBoundaryBlackPixel(nr, ng, nb) && isWhiteLikePixel(nr, ng, nb)) {
          visited[n] = 1;
          queue.push(n);
        }
      }
    }
  };

  // 1. 外周4辺の全ピクセルからフラッドフィル
  for (let x = 0; x < width; x++) {
    floodFill(x, 0);
    floodFill(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    floodFill(0, y);
    floodFill(width - 1, y);
  }

  // 2. 閉領域ピンポイントシードのフラッドフィル（仕様書 Section 3-②）
  const reinsSeeds = isTraining ? TRAINING_REINS_SEEDS : RACE_REINS_SEEDS;
  const reinsSeed = reinsSeeds[frameIndex];
  if (reinsSeed) {
    floodFill(reinsSeed[0], reinsSeed[1]);
  }

  const legSeed = CROSSED_HIND_LEGS_SEEDS[frameIndex];
  if (legSeed) {
    floodFill(legSeed[0], legSeed[1]);
  }
}

/**
 * 静止画立ち絵（1376×768）のRGBAピクセル配列に対して、外周および手綱間ピンポイントシードから白背景透過を適用します。
 */
export function applyStaticSceneFloodFillTransparency(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  scene: StaticHorseSceneType
): void {
  const visited = new Uint8Array(width * height);

  const floodFill = (startX: number, startY: number) => {
    if (startX < 0 || startX >= width || startY < 0 || startY >= height) return;
    const startIdx = startY * width + startX;
    if (visited[startIdx]) return;

    const pIdx = startIdx * 4;
    if (!isWhiteLikePixel(data[pIdx], data[pIdx + 1], data[pIdx + 2])) return;

    const queue: number[] = [startIdx];
    visited[startIdx] = 1;

    while (queue.length > 0) {
      const curr = queue.pop()!;
      const cx = curr % width;
      const cy = Math.floor(curr / width);
      const cp = curr * 4;

      data[cp + 3] = 0;

      const neighbors = [
        cy > 0 ? (cy - 1) * width + cx : -1,
        cy < height - 1 ? (cy + 1) * width + cx : -1,
        cx > 0 ? cy * width + (cx - 1) : -1,
        cx < width - 1 ? cy * width + (cx + 1) : -1,
      ];

      for (const n of neighbors) {
        if (n === -1 || visited[n]) continue;
        const np = n * 4;
        const nr = data[np];
        const ng = data[np + 1];
        const nb = data[np + 2];

        if (!isBoundaryBlackPixel(nr, ng, nb) && isWhiteLikePixel(nr, ng, nb)) {
          visited[n] = 1;
          queue.push(n);
        }
      }
    }
  };

  for (let x = 0; x < width; x++) {
    floodFill(x, 0);
    floodFill(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    floodFill(0, y);
    floodFill(width - 1, y);
  }

  const seeds = STATIC_CLOSED_REGION_SEEDS[scene] ?? [];
  for (const [sx, sy] of seeds) {
    floodFill(sx, sy);
  }
}
