import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCarrotsFromRemainingReserves,
  evaluateStreakWithCarrotRescue,
  MAX_CARROTS,
} from '../src/lib/carrotBonus.ts';
import { soundManager } from '../src/lib/sound.ts';

test('calculateCarrotsFromRemainingReserves: adds remaining reserves to carrots up to MAX_CARROTS', () => {
  // 1. 余力0回温存: 加算なし
  const res0 = calculateCarrotsFromRemainingReserves(1, 0);
  assert.equal(res0.addedCarrots, 0);
  assert.equal(res0.nextCarrots, 1);

  // 2. 余力1回温存: 所持0 -> 1 (+1)
  const res1 = calculateCarrotsFromRemainingReserves(0, 1);
  assert.equal(res1.addedCarrots, 1);
  assert.equal(res1.nextCarrots, 1);

  // 3. 余力2回温存: 所持1 -> 3 (+2)
  const res2 = calculateCarrotsFromRemainingReserves(1, 2);
  assert.equal(res2.addedCarrots, 2);
  assert.equal(res2.nextCarrots, 3);

  // 4. 上限(3個)到達クリップ: 所持2個 + 余力2回温存 -> 最大3個 (+1のみ加算)
  const res3 = calculateCarrotsFromRemainingReserves(2, 2);
  assert.equal(res3.addedCarrots, 1);
  assert.equal(res3.nextCarrots, MAX_CARROTS);

  // 5. 既に所持上限(3個)の場合: 加算0
  const res4 = calculateCarrotsFromRemainingReserves(3, 1);
  assert.equal(res4.addedCarrots, 0);
  assert.equal(res4.nextCarrots, 3);
});

test('evaluateStreakWithCarrotRescue: handles streak rescue with carrots', () => {
  const today = '2026-10-15';

  // 1. 初回ユーザー: 救済なし、streak 0
  const initial = evaluateStreakWithCarrotRescue(0, null, today, 1);
  assert.equal(initial.streakDays, 0);
  assert.equal(initial.carrotCount, 1);
  assert.equal(initial.rescuedByCarrot, false);

  // 2. 本日すでに学習済み（diff 0）: 救済不要、そのまま維持
  const sameDay = evaluateStreakWithCarrotRescue(5, '2026-10-15', today, 2);
  assert.equal(sameDay.streakDays, 5);
  assert.equal(sameDay.carrotCount, 2);
  assert.equal(sameDay.rescuedByCarrot, false);

  // 3. 昨日学習済み（diff 1）: 救済不要、そのまま維持
  const yesterday = evaluateStreakWithCarrotRescue(5, '2026-10-14', today, 2);
  assert.equal(yesterday.streakDays, 5);
  assert.equal(yesterday.carrotCount, 2);
  assert.equal(yesterday.rescuedByCarrot, false);

  // 4. 1日未学習（diff 2, missedDays 1）& にんじん1個以上所持: 1個消費して救済成功！
  const rescue1Day = evaluateStreakWithCarrotRescue(5, '2026-10-13', today, 2);
  assert.equal(rescue1Day.streakDays, 5);
  assert.equal(rescue1Day.carrotCount, 1); // 2 - 1 = 1
  assert.equal(rescue1Day.carrotsUsed, 1);
  assert.equal(rescue1Day.rescuedByCarrot, true);

  // 5. 2日連続未学習（diff 3, missedDays 2）& にんじん2個所持: 2個消費して救済成功！
  const rescue2Days = evaluateStreakWithCarrotRescue(10, '2026-10-12', today, 2);
  assert.equal(rescue2Days.streakDays, 10);
  assert.equal(rescue2Days.carrotCount, 0); // 2 - 2 = 0
  assert.equal(rescue2Days.carrotsUsed, 2);
  assert.equal(rescue2Days.rescuedByCarrot, true);

  // 6. 1日未学習（diff 2）だがにんじん0個: 救済できずストリーク0リセット
  const failedNoCarrot = evaluateStreakWithCarrotRescue(5, '2026-10-13', today, 0);
  assert.equal(failedNoCarrot.streakDays, 0);
  assert.equal(failedNoCarrot.carrotCount, 0);
  assert.equal(failedNoCarrot.rescuedByCarrot, false);

  // 7. 2日連続未学習（diff 3, missedDays 2）だがにんじん1個のみ（不足）: 救済できずストリーク0リセット
  const failedNotEnough = evaluateStreakWithCarrotRescue(7, '2026-10-12', today, 1);
  assert.equal(failedNotEnough.streakDays, 0);
  assert.equal(failedNotEnough.carrotCount, 1); // 消費せず保持
  assert.equal(failedNotEnough.rescuedByCarrot, false);
});

test('soundManager: playCarrot handles safe invocation', () => {
  assert.doesNotThrow(() => {
    soundManager.playCarrot();
  });
});
