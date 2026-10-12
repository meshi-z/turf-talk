import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getConditionFromDays,
  eliminateOneWrongOption,
  calculateRaceFeedback,
} from '../src/lib/conditionBonus.ts';
import type { QuizOption } from '../src/data/phrases.ts';

test('getConditionFromDays: correctly maps days to condition and hint counts', () => {
  // 5 days -> peak, 480kg, 2 hints
  const c5 = getConditionFromDays(5);
  assert.equal(c5.condition, 'peak');
  assert.equal(c5.hintCount, 2);
  assert.equal(c5.baseWeight, 480);

  // 4 days -> peak, 480kg, 2 hints
  const c4 = getConditionFromDays(4);
  assert.equal(c4.condition, 'peak');
  assert.equal(c4.hintCount, 2);

  // 3 days -> up, 484kg, 1 hint
  const c3 = getConditionFromDays(3);
  assert.equal(c3.condition, 'up');
  assert.equal(c3.hintCount, 1);
  assert.equal(c3.baseWeight, 484);

  // 2 days -> flat, 492kg, 0 hints
  const c2 = getConditionFromDays(2);
  assert.equal(c2.condition, 'flat');
  assert.equal(c2.hintCount, 0);
  assert.equal(c2.baseWeight, 492);

  // 1 day -> flat, 492kg, 0 hints
  const c1 = getConditionFromDays(1);
  assert.equal(c1.condition, 'flat');
  assert.equal(c1.hintCount, 0);

  // 0 days -> heavy, 500kg, 0 hints
  const c0 = getConditionFromDays(0);
  assert.equal(c0.condition, 'heavy');
  assert.equal(c0.hintCount, 0);
  assert.equal(c0.baseWeight, 500);
});

test('eliminateOneWrongOption: eliminates wrong option without removing correct answer', () => {
  const options: QuizOption[] = [
    { id: 'opt-1', text: '正解の選択肢', isCorrect: true },
    { id: 'opt-2', text: '誤答1', isCorrect: false },
    { id: 'opt-3', text: '誤答2', isCorrect: false },
    { id: 'opt-4', text: '誤答3', isCorrect: false },
  ];

  // 1st elimination
  const eliminated1 = eliminateOneWrongOption(options, []);
  assert.ok(eliminated1 !== null);
  assert.notEqual(eliminated1, 'opt-1'); // Correct answer must never be eliminated
  assert.ok(['opt-2', 'opt-3', 'opt-4'].includes(eliminated1!));

  // 2nd elimination
  const eliminated2 = eliminateOneWrongOption(options, [eliminated1!]);
  assert.ok(eliminated2 !== null);
  assert.notEqual(eliminated2, 'opt-1');
  assert.notEqual(eliminated2, eliminated1);
  assert.ok(['opt-2', 'opt-3', 'opt-4'].includes(eliminated2!));

  // 3rd elimination
  const eliminated3 = eliminateOneWrongOption(options, [eliminated1!, eliminated2!]);
  assert.ok(eliminated3 !== null);
  assert.notEqual(eliminated3, 'opt-1');
  assert.notEqual(eliminated3, eliminated1);
  assert.notEqual(eliminated3, eliminated2);

  // 4th elimination: all 3 wrong options eliminated, nothing left
  const eliminated4 = eliminateOneWrongOption(options, [eliminated1!, eliminated2!, eliminated3!]);
  assert.equal(eliminated4, null);
});

test('calculateRaceFeedback: reduces weight by 4kg and updates condition', () => {
  // Good performance (score 4/5) -> peak
  const fbHigh = calculateRaceFeedback(4, 484, 'up');
  assert.equal(fbHigh.prevWeight, 484);
  assert.equal(fbHigh.nextWeight, 480);
  assert.equal(fbHigh.weightChange, -4);
  assert.equal(fbHigh.nextCondition, 'peak');

  // Heavy condition race -> resolves to flat
  const fbHeavy = calculateRaceFeedback(2, 500, 'heavy');
  assert.equal(fbHeavy.prevWeight, 500);
  assert.equal(fbHeavy.nextWeight, 496);
  assert.equal(fbHeavy.nextCondition, 'flat');

  // Lower bound clamp (460kg)
  const fbLow = calculateRaceFeedback(1, 462, 'flat');
  assert.equal(fbLow.nextWeight, 460);
});
