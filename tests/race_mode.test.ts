import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateRacePlacement,
  selectRaceQuestions,
  RACE_PHASES,
  RACE_QUESTION_COUNT,
} from '../src/lib/raceMode.ts';
import { INITIAL_PHRASES } from '../src/data/phrases.ts';

test('raceMode: phases metadata integrity', () => {
  assert.equal(RACE_PHASES.length, 5);
  RACE_PHASES.forEach((phase, idx) => {
    assert.equal(phase.step, idx + 1);
    assert.ok(phase.phaseName.length > 0);
    assert.ok(phase.commentary.length > 0);
    assert.ok(phase.correctReaction.length > 0);
    assert.ok(phase.incorrectReaction.length > 0);
  });
});

test('calculateRacePlacement: accurately determines rank from score', () => {
  // 5/5 -> 1st place
  const res5 = calculateRacePlacement(5);
  assert.equal(res5.type, '1st');
  assert.ok(res5.rankText.includes('1着'));

  // 4/5 -> 2nd place
  const res4 = calculateRacePlacement(4);
  assert.equal(res4.type, '2nd');
  assert.ok(res4.rankText.includes('2着'));

  // 3/5 -> Board (3着)
  const res3 = calculateRacePlacement(3);
  assert.equal(res3.type, 'board');
  assert.ok(res3.rankText.includes('3着'));

  // 2/5 -> Board (4着)
  const res2 = calculateRacePlacement(2);
  assert.equal(res2.type, 'board');
  assert.ok(res2.rankText.includes('4着'));

  // 1/5 -> Unplaced (着外)
  const res1 = calculateRacePlacement(1);
  assert.equal(res1.type, 'unplaced');
  assert.ok(res1.rankText.includes('着外'));

  // 0/5 -> Unplaced (着外)
  const res0 = calculateRacePlacement(0);
  assert.equal(res0.type, 'unplaced');
  assert.ok(res0.rankText.includes('着外'));
});

test('selectRaceQuestions: selects exactly 5 questions with options shuffled', () => {
  const selected = selectRaceQuestions(INITIAL_PHRASES, []);
  assert.equal(selected.length, RACE_QUESTION_COUNT);

  // All 5 must have 4 options and valid correct answer
  selected.forEach((q) => {
    assert.equal(q.options.length, 4);
    assert.equal(q.options.filter((o) => o.isCorrect).length, 1);
  });
});

test('selectRaceQuestions: prioritizes learned phrases pool', () => {
  const learnedIds = ['phrase-001', 'phrase-002', 'phrase-003', 'phrase-004', 'phrase-005'];
  const selected = selectRaceQuestions(INITIAL_PHRASES, learnedIds);
  assert.equal(selected.length, 5);

  const selectedIds = selected.map((q) => q.id);
  // All 5 should come from the learned pool
  learnedIds.forEach((id) => {
    assert.ok(selectedIds.includes(id));
  });
});
