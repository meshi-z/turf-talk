import { test } from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_PHRASES, WOODCHIP_PHRASES } from '../src/data/phrases.ts';
import {
  selectDailyPhrases,
  selectExtraTrainingPhrases,
  calculateNextProgressAfterCompletion,
} from '../src/lib/dailyRotation.ts';
import { calculateNextStreakOnCompletion } from '../src/lib/logicalDate.ts';

test('woodchip training: daily rotation selects vocabulary items only', () => {
  const result = selectDailyPhrases(INITIAL_PHRASES, [], '2026-10-18', 3, 'woodchip');

  assert.equal(result.questions.length, 3, 'Must select 3 questions for woodchip');
  for (const q of result.questions) {
    assert.equal(q.type, 'vocabulary', `Question ${q.id} must have type "vocabulary"`);
    assert.ok(q.id.startsWith('vocab-'), `Question ID ${q.id} should start with "vocab-"`);
  }
});

test('uphill training: daily rotation selects phrases only', () => {
  const result = selectDailyPhrases(INITIAL_PHRASES, [], '2026-10-18', 3, 'uphill');

  assert.equal(result.questions.length, 3, 'Must select 3 questions for uphill');
  for (const q of result.questions) {
    assert.notEqual(q.type, 'vocabulary', `Question ${q.id} must not be vocabulary`);
    assert.ok(q.id.startsWith('phrase-'), `Question ID ${q.id} should start with "phrase-"`);
  }
});

test('woodchip vs uphill: independent deterministic seeds for same day', () => {
  const woodchipResult1 = selectDailyPhrases(INITIAL_PHRASES, [], '2026-10-18', 3, 'woodchip');
  const woodchipResult2 = selectDailyPhrases(INITIAL_PHRASES, [], '2026-10-18', 3, 'woodchip');
  const uphillResult = selectDailyPhrases(INITIAL_PHRASES, [], '2026-10-18', 3, 'uphill');

  const woodchipIds1 = woodchipResult1.questions.map((q) => q.id);
  const woodchipIds2 = woodchipResult2.questions.map((q) => q.id);
  const uphillIds = uphillResult.questions.map((q) => q.id);

  assert.deepEqual(woodchipIds1, woodchipIds2, 'Woodchip selections must be deterministic on same date');
  assert.notDeepEqual(woodchipIds1, uphillIds, 'Woodchip and uphill selections should be completely different');
});

test('woodchip training: extra training draws from vocabulary pool', () => {
  const learnedIds = WOODCHIP_PHRASES.slice(0, 5).map((p) => p.id);
  const result = selectExtraTrainingPhrases(INITIAL_PHRASES, learnedIds, 3, 'woodchip');

  assert.equal(result.questions.length, 3);
  for (const q of result.questions) {
    assert.equal(q.type, 'vocabulary', `Extra training question ${q.id} must have type "vocabulary"`);
  }
});

test('woodchip training: full 60 questions distribution and structure', () => {
  assert.equal(WOODCHIP_PHRASES.length, 60, 'Woodchip phrases count must be exactly 60');

  const categories = {
    feel: 0,
    tactics: 0,
    reaction: 0,
    comment: 0,
  };

  for (const item of WOODCHIP_PHRASES) {
    assert.equal(item.type, 'vocabulary');
    assert.equal(item.options.length, 4, `Question ${item.id} must have 4 options`);
    const correctOpts = item.options.filter((o) => o.isCorrect);
    assert.equal(correctOpts.length, 1, `Question ${item.id} must have exactly 1 correct option`);
    assert.ok(item.explanation.length > 0, `Question ${item.id} must have explanation`);
    assert.ok(item.situation.length > 0, `Question ${item.id} must have situation`);
    categories[item.category as keyof typeof categories]++;
  }

  assert.equal(categories.feel, 15, 'feel must be 15');
  assert.equal(categories.tactics, 15, 'tactics must be 15');
  assert.equal(categories.reaction, 15, 'reaction must be 15');
  assert.equal(categories.comment, 15, 'comment must be 15');
});

test('dual training flow: either course fulfills daily requirement without double-incrementing streak', () => {
  const today = '2026-10-18';
  let lastTrainingDate: string | null = '2026-10-17'; // 前日完了済み（ストリーク2日）
  let streakDays = 2;
  let weekdayTrainingDays = 2;
  let completedCoursesToday: ('uphill' | 'woodchip')[] = [];
  let learnedPhraseIds: string[] = [];
  let lapCount = 1;

  // 1. 初回調教: ウッドチップ調教を完了
  const isAlreadyCompletedStep1 = lastTrainingDate === today;
  assert.equal(isAlreadyCompletedStep1, false, 'Step 1 should be not yet completed today');

  const nextStreakStep1 = calculateNextStreakOnCompletion(streakDays, lastTrainingDate, today);
  const nextWeekdayDaysStep1 = Math.min(7, weekdayTrainingDays + 1);
  completedCoursesToday = ['woodchip'];
  lastTrainingDate = today;
  streakDays = nextStreakStep1;
  weekdayTrainingDays = nextWeekdayDaysStep1;

  const step1Result = calculateNextProgressAfterCompletion(
    learnedPhraseIds,
    lapCount,
    ['vocab-001', 'vocab-002', 'vocab-003'],
    INITIAL_PHRASES.length
  );
  learnedPhraseIds = step1Result.nextLearnedIds;

  assert.equal(streakDays, 3, 'Streak should increment by 1 after first course completion');
  assert.equal(weekdayTrainingDays, 3, 'Weekday training days should increment by 1');
  assert.deepEqual(completedCoursesToday, ['woodchip']);
  assert.equal(learnedPhraseIds.length, 3);

  // 2. 同日2回目調教: 続いて坂路調教も受講・完了
  const isAlreadyCompletedStep2 = lastTrainingDate === today;
  assert.equal(isAlreadyCompletedStep2, true, 'Step 2 must recognize that training was already done today');

  const nextStreakStep2 = isAlreadyCompletedStep2
    ? streakDays
    : calculateNextStreakOnCompletion(streakDays, lastTrainingDate, today);
  const nextWeekdayDaysStep2 = isAlreadyCompletedStep2
    ? weekdayTrainingDays
    : Math.min(7, weekdayTrainingDays + 1);

  completedCoursesToday = Array.from(new Set([...completedCoursesToday, 'uphill']));
  streakDays = nextStreakStep2;
  weekdayTrainingDays = nextWeekdayDaysStep2;

  const step2Result = calculateNextProgressAfterCompletion(
    learnedPhraseIds,
    lapCount,
    ['phrase-001', 'phrase-002', 'phrase-003'],
    INITIAL_PHRASES.length
  );
  learnedPhraseIds = step2Result.nextLearnedIds;

  // 二重加算されていないことを検証
  assert.equal(streakDays, 3, 'Streak must NOT double-increment when second course completed');
  assert.equal(weekdayTrainingDays, 3, 'Weekday days must NOT double-increment');
  assert.equal(completedCoursesToday.length, 2, 'Both courses should be recorded');
  assert.ok(completedCoursesToday.includes('woodchip'));
  assert.ok(completedCoursesToday.includes('uphill'));
  assert.equal(learnedPhraseIds.length, 6, 'Learned phrases should contain items from both courses');
});
