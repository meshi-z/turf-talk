import test from 'node:test';
import assert from 'node:assert/strict';
import {
  selectExtraTrainingPhrases,
  calculateNextProgressAfterCompletion,
} from '../src/lib/dailyRotation.ts';
import { INITIAL_PHRASES } from '../src/data/phrases.ts';

test('extra training: selects 2 unlearned and 1 learned phrase when available', () => {
  // 先頭10問を習得済みとする
  const learnedIds = INITIAL_PHRASES.slice(0, 10).map((p) => p.id);
  const learnedSet = new Set(learnedIds);

  const result = selectExtraTrainingPhrases(INITIAL_PHRASES, learnedIds, 3);

  assert.equal(result.questions.length, 3, 'Should select exactly 3 questions');
  assert.equal(result.isReview, false, 'Should not be full review mode');

  // IDが一意であること
  const ids = result.questions.map((q) => q.id);
  assert.equal(new Set(ids).size, 3, 'Selected questions must be unique');

  // 未習得と習得済みの内訳
  const unlearnedCount = ids.filter((id) => !learnedSet.has(id)).length;
  const learnedCount = ids.filter((id) => learnedSet.has(id)).length;

  assert.equal(unlearnedCount, 2, 'Should have exactly 2 unlearned questions');
  assert.equal(learnedCount, 1, 'Should have exactly 1 learned question');

  // 各問題の選択肢が4つ存在すること
  for (const q of result.questions) {
    assert.equal(q.options.length, 4, 'Each question must have 4 options');
  }
});

test('extra training: falls back gracefully when only 1 unlearned phrase remains', () => {
  // 残り1問以外すべて習得済みとする
  const allExceptOne = INITIAL_PHRASES.slice(0, INITIAL_PHRASES.length - 1).map((p) => p.id);
  const learnedSet = new Set(allExceptOne);
  const theUnlearnedId = INITIAL_PHRASES[INITIAL_PHRASES.length - 1].id;

  const result = selectExtraTrainingPhrases(INITIAL_PHRASES, allExceptOne, 3);

  assert.equal(result.questions.length, 3, 'Should select exactly 3 questions');
  assert.equal(result.isReview, false, 'Should not be full review mode');

  const ids = result.questions.map((q) => q.id);
  assert.equal(new Set(ids).size, 3, 'Selected questions must be unique');

  assert.ok(ids.includes(theUnlearnedId), 'The single unlearned phrase must be included');

  const unlearnedCount = ids.filter((id) => !learnedSet.has(id)).length;
  const learnedCount = ids.filter((id) => learnedSet.has(id)).length;

  assert.equal(unlearnedCount, 1, 'Should have exactly 1 unlearned question');
  assert.equal(learnedCount, 2, 'Should have 2 learned questions to fill up to 3');
});

test('extra training: full review mode when all phrases are learned', () => {
  // 全フレーズ習得済み
  const allIds = INITIAL_PHRASES.map((p) => p.id);
  const result = selectExtraTrainingPhrases(INITIAL_PHRASES, allIds, 3);

  assert.equal(result.questions.length, 3, 'Should select 3 questions');
  assert.equal(result.isReview, true, 'Should be full review mode');

  const ids = result.questions.map((q) => q.id);
  assert.equal(new Set(ids).size, 3, 'Selected questions must be unique');
});

test('extra training: selects from unlearned when no phrases are learned yet', () => {
  // 習得済みが0問
  const learnedIds: string[] = [];
  const result = selectExtraTrainingPhrases(INITIAL_PHRASES, learnedIds, 3);

  assert.equal(result.questions.length, 3, 'Should select 3 questions');
  assert.equal(result.isReview, false);

  const ids = result.questions.map((q) => q.id);
  assert.equal(new Set(ids).size, 3, 'Selected questions must be unique');
});

test('extra training: correct answers add to learnedPhraseIds without mutating original set', () => {
  const currentLearned = ['phrase-001', 'phrase-002'];
  const sessionCorrect = ['phrase-002', 'phrase-005']; // phrase-005が新規習得

  const { nextLearnedIds, nextLapCount } = calculateNextProgressAfterCompletion(
    currentLearned,
    1,
    sessionCorrect,
    INITIAL_PHRASES.length
  );

  assert.deepEqual(
    nextLearnedIds.sort(),
    ['phrase-001', 'phrase-002', 'phrase-005'].sort(),
    'Newly answered phrase should be added to learnedPhraseIds'
  );
  assert.equal(nextLapCount, 1);
});
