import type { HorseCondition, TrainingCourse } from '../types';

export const APP_SITE_URL = 'https://turftalk-jp.web.app/';

const CONDITION_LABEL_MAP: Record<HorseCondition, string> = {
  peak: '絶好調 ⤴',
  up: '好調 ↗',
  flat: '普通 ➡',
  heavy: '太め残り ↘',
};

export interface TrainingShareParams {
  horseName: string;
  score: number;
  totalQuestions: number;
  streakDays: number;
  condition: HorseCondition;
  course?: TrainingCourse;
}

/**
 * 本日の調教完了結果の X (Twitter) シェアテキストを生成
 */
export function generateTrainingShareText(params: TrainingShareParams): string {
  const { horseName, score, totalQuestions, streakDays, condition, course } = params;
  const courseName = course === 'woodchip' ? 'ウッド' : '坂路';
  const conditionLabel = CONDITION_LABEL_MAP[condition] ?? '普通';
  const isPerfect = score === totalQuestions;
  const scoreBadge = isPerfect ? `${score}/${totalQuestions}問 満点💮` : `${score}/${totalQuestions}問`;

  const line1 = `🏇 TurfTalk 調教完了！`;
  const line2 = `「${horseName}」${courseName}（${scoreBadge}）`;
  const line3 = `🔥 連続: ${streakDays}日 | 調子: ${conditionLabel}`;
  const line4 = `#TurfTalk #競馬英語`;
  const line5 = APP_SITE_URL;

  return `${line1}\n${line2}\n${line3}\n${line4}\n${line5}`;
}

export interface RaceShareParams {
  horseName: string;
  generation: number;
  week: number;
  raceName: string;
  placementRank: number;
  score: number;
  totalQuestions: number;
}

/**
 * 週末レース結果の X (Twitter) シェアテキストを生成
 */
export function generateRaceShareText(params: RaceShareParams): string {
  const { horseName, generation, week, raceName, placementRank, score, totalQuestions } = params;

  let rankText = `${placementRank}着`;
  if (placementRank === 1) rankText = '1着 🏆';
  else if (placementRank === 2) rankText = '2着 🥈';
  else if (placementRank <= 5) rankText = `${placementRank}着 🎖️`;

  const line1 = `🏁 TurfTalk 週末レース結果！`;
  const line2 = `W${week}「${raceName}」`;
  const line3 = `第${generation}世代「${horseName}」${rankText}(${score}/${totalQuestions}問)`;
  const line4 = `#TurfTalk #競馬英語`;
  const line5 = APP_SITE_URL;

  return `${line1}\n${line2}\n${line3}\n${line4}\n${line5}`;
}

/**
 * X（旧Twitter）共有用のWeb Intent URLを生成
 */
export function generateTwitterShareUrl(text: string): string {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
}

/**
 * クリップボードにテキストをコピー
 */
export async function copyShareTextToClipboard(
  text: string,
  customClipboard?: { writeText: (t: string) => Promise<void> }
): Promise<boolean> {
  if (customClipboard) {
    try {
      await customClipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback below
    }
  }

  if (typeof document !== 'undefined') {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    } catch {
      return false;
    }
  }

  return false;
}
