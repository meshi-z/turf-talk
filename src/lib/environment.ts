/**
 * 実行環境判定ユーティリティ
 * - 本番ビルド環境（GitHub Pages, Vercel等）でのデバッグ機能の露出を防止
 * - 開発環境（import.meta.env.DEV）または localhost / 127.0.0.1 のみデバッグメニューを有効化
 */

export function isDevOrLocalhost(
  hostname?: string,
  isDev?: boolean
): boolean {
  // 明示的な引数があれば優先（単体テスト用）
  const activeDev = typeof isDev === 'boolean' ? isDev : Boolean(import.meta.env?.DEV);
  if (activeDev) {
    return true;
  }

  const activeHost =
    typeof hostname === 'string'
      ? hostname
      : typeof window !== 'undefined'
      ? window.location.hostname
      : '';

  return (
    activeHost === 'localhost' ||
    activeHost === '127.0.0.1' ||
    activeHost === '[::1]' ||
    activeHost.endsWith('.localhost')
  );
}
