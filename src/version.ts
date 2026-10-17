declare const __APP_VERSION__: string | undefined;

/**
 * アプリケーションのバージョン文字列（例: "v0.1.5"）
 * Vite ビルド時に package.json から注入されます。
 */
export const APP_VERSION: string =
  typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'v0.9.0';
