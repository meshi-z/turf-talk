import { useEffect, useState } from 'react';

export const STORAGE_KEY_PWA_DISMISSED = 'turf_talk_pwa_dismissed';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

/**
 * アプリがスタンドアロンモード（ホーム画面からPWAとして起動中）かどうかを判定
 */
export function isStandalone(customCheck?: { standalone?: boolean; displayModeStandalone?: boolean }): boolean {
  if (customCheck !== undefined) {
    return Boolean(customCheck.standalone || customCheck.displayModeStandalone);
  }
  if (typeof window === 'undefined') return false;
  const isDisplayModeStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isNavigatorStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  return isDisplayModeStandalone || isNavigatorStandalone;
}

/**
 * iOS デバイス（iPhone / iPad / iPod）かどうかを判定
 */
export function isIos(customUa?: string, customTouchPoints?: number): boolean {
  if (customUa !== undefined) {
    const isIosDevice = /iPhone|iPad|iPod/i.test(customUa);
    const isIpadOs = /Macintosh/i.test(customUa) && (customTouchPoints ?? 0) > 1;
    return isIosDevice || isIpadOs;
  }
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent;
  const isIosDevice = /iPhone|iPad|iPod/i.test(ua);
  const isIpadOs = /Macintosh/i.test(ua) && Boolean(navigator.maxTouchPoints && navigator.maxTouchPoints > 1);
  return isIosDevice || isIpadOs;
}

/**
 * ユーザーが過去にPWAインストール案内バナーを閉じたかどうか
 */
export function hasDismissedPwaInstall(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(STORAGE_KEY_PWA_DISMISSED) === 'true';
  } catch {
    return false;
  }
}

/**
 * PWAインストール案内バナーを閉じたことを記憶
 */
export function dismissPwaInstall(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_PWA_DISMISSED, 'true');
  } catch {
    // LocalStorage access failure is safe to ignore
  }
}

/**
 * PWAインストール案内バナーの既読状態をリセット（デバッグ・再表示用）
 */
export function resetPwaDismissed(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY_PWA_DISMISSED);
  } catch {
    // LocalStorage access failure is safe to ignore
  }
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(() => isStandalone());
  const [isDismissed, setIsDismissed] = useState<boolean>(() => hasDismissedPwaInstall());
  const [isIosDevice, setIsIosDevice] = useState<boolean>(() => isIos());

  useEffect(() => {
    setIsInstalled(isStandalone());
    setIsIosDevice(isIos());

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setDeferredPrompt(null);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const dismiss = () => {
    dismissPwaInstall();
    setIsDismissed(true);
  };

  const resetDismiss = () => {
    resetPwaDismissed();
    setIsDismissed(false);
  };

  const isBannerVisible = !isInstalled && !isDismissed && (Boolean(deferredPrompt) || isIosDevice);

  return {
    canInstall: Boolean(deferredPrompt),
    isInstalled,
    isDismissed,
    isIosDevice,
    isBannerVisible,
    promptInstall,
    dismiss,
    resetDismiss,
  };
}
