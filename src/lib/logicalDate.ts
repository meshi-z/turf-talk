/**
 * 午前4時（28時）更新ロジックおよび論理日付・ストリーク計算ユーティリティ
 */

export const DAY_CUTOFF_HOUR = 4; // 午前4時（28時）切り替え

/**
 * 実日時から4時間減算した論理 Date オブジェクトを取得
 * 例: 2026-10-13 03:59:59 -> 2026-10-12 23:59:59 (前日扱い)
 * 例: 2026-10-13 04:00:00 -> 2026-10-13 00:00:00 (当日扱い)
 */
export function getLogicalDate(now: Date = new Date()): Date {
  const logicalTime = now.getTime() - DAY_CUTOFF_HOUR * 60 * 60 * 1000;
  return new Date(logicalTime);
}

/**
 * 実日時または論理Dateから 'YYYY-MM-DD' 形式の論理日付文字列を取得
 */
export function getLogicalDateString(now: Date = new Date()): string {
  const logical = getLogicalDate(now);
  const year = logical.getFullYear();
  const month = String(logical.getMonth() + 1).padStart(2, '0');
  const day = String(logical.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 2つの 'YYYY-MM-DD' 文字列の日数差 (dateB - dateA) を算出
 * 例: diffInDays('2026-10-12', '2026-10-13') => 1 (翌日)
 */
export function getLogicalDateDiffInDays(dateA: string, dateB: string): number {
  const [y1, m1, d1] = dateA.split('-').map(Number);
  const [y2, m2, d2] = dateB.split('-').map(Number);

  const utc1 = Date.UTC(y1, m1 - 1, d1);
  const utc2 = Date.UTC(y2, m2 - 1, d2);

  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return Math.round((utc2 - utc1) / MS_PER_DAY);
}

/**
 * 前回完了日と現在の論理日付から、現在のアクティブな連続学習日数（ストリーク）を算出
 * - lastTrainingDate が null の場合: 0
 * - lastTrainingDate === todayLogicalDate (当日完了済み): 保存されている streakDays を維持
 * - lastTrainingDate が昨日 (差分 1日): 未学習だが連続記録は有効中（受講待ち）なので保持
 * - lastTrainingDate が前々日以前 (差分 >= 2日): 1日以上未受講が空いたため 0 にリセット
 * - 未来日など負の差分（時計ズレ等）: 保持
 */
export function evaluateCurrentStreak(
  savedStreak: number,
  lastTrainingDate: string | null,
  todayLogicalDate: string
): number {
  if (!lastTrainingDate) {
    return 0;
  }

  const diff = getLogicalDateDiffInDays(lastTrainingDate, todayLogicalDate);

  if (diff === 0) {
    // 今日受講済み
    return savedStreak;
  }

  if (diff === 1) {
    // 昨日受講済み。今日受講すれば streak + 1 になる状態
    return savedStreak;
  }

  // 2日以上受講していない場合、ストリークは途切れている
  return 0;
}

/**
 * 調教完了時（markTrainingCompleted）の新しいストリーク日数を計算
 * - 既に本日完了済みの場合はインクリメントせず維持
 * - 前回完了日が昨日（差分1日）の場合は savedStreak + 1
 * - 前回完了日が前々日以前または初受講の場合は 1 にリセット・開始
 */
export function calculateNextStreakOnCompletion(
  currentStreak: number,
  lastTrainingDate: string | null,
  todayLogicalDate: string
): number {
  if (!lastTrainingDate) {
    return 1;
  }

  const diff = getLogicalDateDiffInDays(lastTrainingDate, todayLogicalDate);

  if (diff === 0) {
    // 同日内の2回目以降の受講（復習モード等）: ストリークは増加させない
    return currentStreak;
  }

  if (diff === 1) {
    // 昨日受講済みからの翌日継続
    return currentStreak + 1;
  }

  // 1日以上空いたあとの再開、または初回
  return 1;
}
