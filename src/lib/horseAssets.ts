import type { HorseCoatColor } from '../types';

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
 * 毛色の英語キーを取得します。
 */
export function getCoatKey(color: HorseCoatColor): string {
  return HORSE_COAT_KEY_MAP[color] ?? 'bay';
}
