/**
 * 愛馬の余力温存ボーナスおよびにんじん（ストリーク補填）計算ユーティリティ
 */
import { getLogicalDateDiffInDays } from './logicalDate.ts';

export const MAX_CARROTS = 3;

export interface StreakEvaluationResult {
  streakDays: number;
  carrotCount: number;
  carrotsUsed: number;
  rescuedByCarrot: boolean;
}

/**
 * レース終了時：温存した「余力」をにんじんに変換・加算する
 * @param currentCarrots 現在の所持にんじん数
 * @param remainingReserves レース終了時に未使用で残った余力数
 * @returns 獲得にんじん数と新しい所持数
 */
export function calculateCarrotsFromRemainingReserves(
  currentCarrots: number,
  remainingReserves: number
): { addedCarrots: number; nextCarrots: number } {
  if (remainingReserves <= 0) {
    return { addedCarrots: 0, nextCarrots: currentCarrots };
  }

  const nextCarrots = Math.min(MAX_CARROTS, currentCarrots + remainingReserves);
  const addedCarrots = nextCarrots - currentCarrots;
  return { addedCarrots, nextCarrots };
}

/**
 * アプリ起動・日付更新時：ストリーク判定とにんじんによる自動救済
 * - lastTrainingDate === null: 新規ユーザー。streak: 0, carrots: current
 * - diff === 0: 今日受講済み。streak維持
 * - diff === 1: 昨日受講済み。今日受講待ち。streak維持
 * - diff >= 2: 未受講日が存在する（missedDays = diff - 1 日）
 *     - 所持にんじん >= missedDays の場合:
 *         missedDays 個のにんじんを消費し、ストリークを維持（救済成功）
 *     - 所持にんじん < missedDays の場合:
 *         にんじんが不足しているためストリークは 0 にリセット（所持にんじんはそのまま維持または全消費ルール：仕様上、救済不成立時はにんじんを消費せず0リセットとするのが親切）
 */
export function evaluateStreakWithCarrotRescue(
  savedStreak: number,
  lastTrainingDate: string | null,
  todayLogicalDate: string,
  currentCarrots: number
): StreakEvaluationResult {
  if (!lastTrainingDate) {
    return {
      streakDays: 0,
      carrotCount: currentCarrots,
      carrotsUsed: 0,
      rescuedByCarrot: false,
    };
  }

  const diff = getLogicalDateDiffInDays(lastTrainingDate, todayLogicalDate);

  if (diff <= 1) {
    // 今日または昨日受講済み。救済不要
    return {
      streakDays: savedStreak,
      carrotCount: currentCarrots,
      carrotsUsed: 0,
      rescuedByCarrot: false,
    };
  }

  // diff >= 2: 空いた未学習日数
  const missedDays = diff - 1;

  if (currentCarrots >= missedDays) {
    // にんじんで全未受講日を補填成功！
    return {
      streakDays: savedStreak,
      carrotCount: currentCarrots - missedDays,
      carrotsUsed: missedDays,
      rescuedByCarrot: true,
    };
  }

  // にんじん不足で救済できずストリーク途切れ
  return {
    streakDays: 0,
    carrotCount: currentCarrots,
    carrotsUsed: 0,
    rescuedByCarrot: false,
  };
}
