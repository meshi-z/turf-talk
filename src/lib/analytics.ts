import { getAnalytics, isSupported, logEvent, type Analytics } from 'firebase/analytics';
import { firebaseApp, isFirebaseConfigured } from './firebase.ts';
import { isDevOrLocalhost } from './environment.ts';

let analyticsInstance: Analytics | null = null;
let isInitAttempted = false;

/**
 * Firebase Analytics インスタンスを非同期に初期化する（ブラウザ環境かつサポート対象のみ）
 */
export async function initAnalytics(): Promise<Analytics | null> {
  if (analyticsInstance) {
    return analyticsInstance;
  }
  if (isInitAttempted) {
    return null;
  }
  isInitAttempted = true;

  if (typeof window === 'undefined' || !isFirebaseConfigured() || !firebaseApp) {
    return null;
  }

  try {
    const supported = await isSupported();
    if (supported) {
      analyticsInstance = getAnalytics(firebaseApp);
    }
  } catch (err) {
    console.warn('[Analytics] Initialization skipped or unsupported:', err);
  }

  return analyticsInstance;
}

// 起動時にブラウザ環境であれば初期化を試行
if (typeof window !== 'undefined') {
  void initAnalytics();
}

/**
 * 任意の分析イベントを送信する（未初期化・エラー時もクラッシュせずフォールバック）
 */
export function logAnalyticsEvent(
  eventName: string,
  eventParams?: Record<string, string | number | boolean | null | undefined>
): void {
  // パラメータのサニタイズ（undefined を除外）
  const cleanParams: Record<string, string | number | boolean> = {};
  if (eventParams) {
    for (const [key, val] of Object.entries(eventParams)) {
      if (val !== undefined && val !== null) {
        cleanParams[key] = val;
      }
    }
  }

  if (analyticsInstance) {
    try {
      logEvent(analyticsInstance, eventName, cleanParams);
    } catch (e) {
      console.warn(`[Analytics] Failed to log event "${eventName}":`, e);
    }
  } else if (isDevOrLocalhost()) {
    // 開発・ローカル環境ではコンソールにログ出力
    console.debug(`[Analytics (Dev)] ${eventName}`, cleanParams);
  }
}

/**
 * 調教完了イベントを送信する
 */
export function logTrainingCompleted(params: {
  course: 'uphill' | 'woodchip';
  score: number;
  durationSec?: number;
  learnedCount?: number;
}): void {
  logAnalyticsEvent('training_completed', {
    course: params.course,
    score: params.score,
    duration_sec: params.durationSec ?? 0,
    learned_count: params.learnedCount ?? 0,
  });
}

/**
 * 週末レース完了イベントを送信する
 */
export function logRaceCompleted(params: {
  grade: string;
  raceName: string;
  placement: number;
  placementText: string;
  horseName: string;
  routeId: string;
  score: number;
}): void {
  logAnalyticsEvent('race_completed', {
    grade: params.grade,
    race_name: params.raceName,
    placement: params.placement,
    placement_text: params.placementText,
    horse_name: params.horseName,
    route_id: params.routeId,
    score: params.score,
  });
}

/**
 * 競走馬引退・世代交代イベントを送信する
 */
export function logHorseRetired(params: {
  generation: number;
  totalWins: number;
  hallOfFame: boolean;
  epithet: string;
  careerWeeks: number;
}): void {
  logAnalyticsEvent('horse_retired', {
    generation: params.generation,
    total_wins: params.totalWins,
    hall_of_fame: params.hallOfFame,
    epithet: params.epithet,
    career_weeks: params.careerWeeks,
  });
}

/**
 * フレーズブックマーク追加/解除イベントを送信する
 */
export function logPhraseBookmarked(params: {
  phraseId: string;
  isBookmarked: boolean;
}): void {
  logAnalyticsEvent('phrase_bookmarked', {
    phrase_id: params.phraseId,
    is_bookmarked: params.isBookmarked,
  });
}
