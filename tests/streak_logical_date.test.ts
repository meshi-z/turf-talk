import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getLogicalDateString,
  getLogicalDateDiffInDays,
  evaluateCurrentStreak,
  calculateNextStreakOnCompletion,
  getLogicalWeekMonday,
  isWeeklyRaceCompletedForWeek,
} from '../src/lib/logicalDate.ts';

test('logicalDate: 4am cutoff boundary logic', () => {
  // 2026-10-13 03:59:59 (深夜・午前4時前) -> 2026-10-12 扱い
  const beforeCutoff = new Date(2026, 9, 13, 3, 59, 59, 999);
  assert.equal(getLogicalDateString(beforeCutoff), '2026-10-12');

  // 2026-10-13 04:00:00 (午前4時ちょうど) -> 2026-10-13 扱い
  const atCutoff = new Date(2026, 9, 13, 4, 0, 0, 0);
  assert.equal(getLogicalDateString(atCutoff), '2026-10-13');

  // 2026-10-13 23:59:59 (深夜前) -> 2026-10-13 扱い
  const night = new Date(2026, 9, 13, 23, 59, 59);
  assert.equal(getLogicalDateString(night), '2026-10-13');

  // 2026-10-14 00:01:00 (午前0時過ぎ/24時台) -> 2026-10-13 扱い
  const midnight = new Date(2026, 9, 14, 0, 1, 0);
  assert.equal(getLogicalDateString(midnight), '2026-10-13');
});

test('getLogicalDateDiffInDays: correctly calculates difference between two YYYY-MM-DD dates', () => {
  assert.equal(getLogicalDateDiffInDays('2026-10-12', '2026-10-12'), 0);
  assert.equal(getLogicalDateDiffInDays('2026-10-12', '2026-10-13'), 1);
  assert.equal(getLogicalDateDiffInDays('2026-10-12', '2026-10-14'), 2);
  assert.equal(getLogicalDateDiffInDays('2026-10-15', '2026-10-12'), -3);
});

test('evaluateCurrentStreak: determines active streak state on launch/reload', () => {
  const today = '2026-10-13';

  // 1. 初回利用時（記録なし）: 0日
  assert.equal(evaluateCurrentStreak(0, null, today), 0);

  // 2. 本日すでに学習済み（同日）: 保存されているストリークを維持
  assert.equal(evaluateCurrentStreak(5, '2026-10-13', today), 5);

  // 3. 昨日学習済みで本日はまだ受講前（diff = 1）: 連続記録待機状態として維持
  assert.equal(evaluateCurrentStreak(5, '2026-10-12', today), 5);

  // 4. 前々日以前（2日以上空いた）: 連続記録が途切れて 0 にリセット
  assert.equal(evaluateCurrentStreak(5, '2026-10-11', today), 0);
  assert.equal(evaluateCurrentStreak(10, '2026-10-01', today), 0);
});

test('calculateNextStreakOnCompletion: handles completion updates accurately', () => {
  const today = '2026-10-13';

  // 1. 初回完了時: 1日連続
  assert.equal(calculateNextStreakOnCompletion(0, null, today), 1);

  // 2. 昨日に引き続いて本日完了（1日差）: streak + 1
  assert.equal(calculateNextStreakOnCompletion(3, '2026-10-12', today), 4);

  // 3. 同日内に再度完了（復習等）: streakは増やさない
  assert.equal(calculateNextStreakOnCompletion(4, '2026-10-13', today), 4);

  // 4. 途切れた後（前々日以前完了）に本日完了: 1日にリセットして再スタート
  assert.equal(calculateNextStreakOnCompletion(0, '2026-10-11', today), 1);
  assert.equal(calculateNextStreakOnCompletion(5, '2026-10-10', today), 1);
});

test('getLogicalWeekMonday and isWeeklyRaceCompletedForWeek: tracks once-per-weekend race limit and Monday 4am reset', () => {
  // 2026-10-12 is Monday, 2026-10-17 is Saturday, 2026-10-18 is Sunday, 2026-10-19 is next Monday
  assert.equal(getLogicalWeekMonday('2026-10-12'), '2026-10-12');
  assert.equal(getLogicalWeekMonday('2026-10-17'), '2026-10-12');
  assert.equal(getLogicalWeekMonday('2026-10-18'), '2026-10-12');
  assert.equal(getLogicalWeekMonday('2026-10-19'), '2026-10-19');

  // Race completed on Saturday 2026-10-17 (week Monday = '2026-10-12')
  const completedWeekMonday = getLogicalWeekMonday('2026-10-17');
  assert.equal(isWeeklyRaceCompletedForWeek(null, '2026-10-17'), false);
  assert.equal(isWeeklyRaceCompletedForWeek(completedWeekMonday, '2026-10-17'), true);
  assert.equal(isWeeklyRaceCompletedForWeek(completedWeekMonday, '2026-10-18'), true); // Still completed on Sunday

  // Monday 2026-10-19 before 4am -> logical date is still '2026-10-18' (Sunday) -> still completed
  const mondayBefore4am = getLogicalDateString(new Date(2026, 9, 19, 3, 59, 59));
  assert.equal(mondayBefore4am, '2026-10-18');
  assert.equal(isWeeklyRaceCompletedForWeek(completedWeekMonday, mondayBefore4am), true);

  // Monday 2026-10-19 at 4am -> logical date becomes '2026-10-19' (Monday) -> resets to false!
  const mondayAt4am = getLogicalDateString(new Date(2026, 9, 19, 4, 0, 0));
  assert.equal(mondayAt4am, '2026-10-19');
  assert.equal(isWeeklyRaceCompletedForWeek(completedWeekMonday, mondayAt4am), false);
});

