import type { UserProgress } from '../types/index.ts';

/**
 * ユーザー進捗データが改ざん・破損されていないか検証し、安全な範囲内に自己修復（サニタイズ）する
 */
export function validateAndSanitizeProgress(raw: UserProgress): {
  sanitized: UserProgress;
  hasTampered: boolean;
} {
  let hasTampered = false;

  // にんじん数 (0〜3)
  let carrotCount = typeof raw.carrotCount === 'number' ? raw.carrotCount : 1;
  if (carrotCount < 0 || carrotCount > 3) {
    carrotCount = Math.max(0, Math.min(3, carrotCount));
    hasTampered = true;
  }

  // 今週の調教消化日数 (0〜7)
  let weekdayTrainingDays = typeof raw.weekdayTrainingDays === 'number' ? raw.weekdayTrainingDays : 3;
  if (weekdayTrainingDays < 0 || weekdayTrainingDays > 7) {
    weekdayTrainingDays = Math.max(0, Math.min(7, weekdayTrainingDays));
    hasTampered = true;
  }

  // 連続学習日数 (0以上)
  let streakDays = typeof raw.streakDays === 'number' ? raw.streakDays : 0;
  if (streakDays < 0) {
    streakDays = 0;
    hasTampered = true;
  }

  // キャリア競走馬の整合性
  let careerHorse = raw.careerHorse;
  if (careerHorse) {
    let currentWeek = careerHorse.currentWeek;
    if (typeof currentWeek !== 'number' || currentWeek < 1 || currentWeek > 4) {
      currentWeek = Math.max(1, Math.min(4, typeof currentWeek === 'number' ? currentWeek : 1)) as 1 | 2 | 3 | 4;
      hasTampered = true;
    }

    let weight = careerHorse.weight;
    if (typeof weight !== 'number' || weight < 350 || weight > 650) {
      weight = 484; // デフォルト安全体重
      hasTampered = true;
    }

    careerHorse = {
      ...careerHorse,
      currentWeek,
      weight,
    };
  }

  const sanitized: UserProgress = {
    ...raw,
    carrotCount,
    weekdayTrainingDays,
    streakDays,
    careerHorse,
  };

  return { sanitized, hasTampered };
}

/**
 * クラウド正本主義に基づき、ローカルデータとクラウドデータを安全にリコンサイル（調停・復元）する
 */
export function reconcileWithCloud(local: UserProgress, cloud: UserProgress): UserProgress {
  // クラウド側が最新・正本
  const { sanitized: safeCloud } = validateAndSanitizeProgress(cloud);
  return {
    ...local,
    ...safeCloud,
  };
}
