import { initializeAppCheck, ReCaptchaV3Provider, type AppCheck } from 'firebase/app-check';
import { firebaseApp, isFirebaseConfigured } from './firebase.ts';
import { isDevOrLocalhost } from './environment.ts';

let appCheckInstance: AppCheck | null = null;

/**
 * Firebase App Check を初期化する（Bot・外部スクリプト遮断）
 * 開発環境や localhost ではデバッグ・開発者操作を阻害しないよう自動バイパス
 */
export function initAppCheck(): AppCheck | null {
  if (typeof window === 'undefined' || !isFirebaseConfigured() || !firebaseApp) {
    return null;
  }

  // 既に初期化済みの場合は既存インスタンスを返却
  if (appCheckInstance) {
    return appCheckInstance;
  }

  // ローカル開発環境（localhost / dev）ではバイパス
  if (isDevOrLocalhost()) {
    // 開発環境用のデバッグトークンフラグ
    (window as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    return null;
  }

  const siteKey = import.meta.env?.VITE_RECAPTCHA_SITE_KEY;
  if (!siteKey || siteKey.includes('your-site-key')) {
    console.info('[AppCheck] VITE_RECAPTCHA_SITE_KEY not configured. App Check skipped.');
    return null;
  }

  try {
    appCheckInstance = initializeAppCheck(firebaseApp, {
      provider: new ReCaptchaV3Provider(siteKey),
      isTokenAutoRefreshEnabled: true,
    });
    return appCheckInstance;
  } catch (error) {
    console.warn('[AppCheck] Initialization failed:', error);
    return null;
  }
}
