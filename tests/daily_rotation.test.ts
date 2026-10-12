import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hashDateString,
  createMulberry32,
  selectDailyPhrases,
  calculateNextProgressAfterCompletion,
  shufflePhraseOptions,
} from '../src/lib/dailyRotation.ts';
import { INITIAL_PHRASES } from '../src/data/phrases.ts';

test('daily rotation: deterministic seed behavior', () => {
  const hash1 = hashDateString('2026-10-12');
  const hash2 = hashDateString('2026-10-12');
  const hash3 = hashDateString('2026-10-13');

  assert.equal(hash1, hash2, 'Same date string should produce same hash');
  assert.notEqual(hash1, hash3, 'Different date string should produce different hash');

  const rng1 = createMulberry32(hash1);
  const rng2 = createMulberry32(hash2);
  const values1 = [rng1(), rng1(), rng1()];
  const values2 = [rng2(), rng2(), rng2()];
  assert.deepEqual(values1, values2, 'Same seed produces identical PRNG stream');
});

test('daily rotation: selectDailyPhrases selects 3 questions deterministically for same day', () => {
  const learnedIds: string[] = [];
  const resultA = selectDailyPhrases(INITIAL_PHRASES, learnedIds, '2026-10-12', 3);
  const resultB = selectDailyPhrases(INITIAL_PHRASES, learnedIds, '2026-10-12', 3);

  assert.equal(resultA.questions.length, 3);
  assert.equal(resultB.questions.length, 3);

  const idsA = resultA.questions.map((q) => q.id);
  const idsB = resultB.questions.map((q) => q.id);
  assert.deepEqual(idsA, idsB, 'Same day must select same question IDs');
});

test('daily rotation: selects different questions for different dates', () => {
  const learnedIds: string[] = [];
  const resultDay1 = selectDailyPhrases(INITIAL_PHRASES, learnedIds, '2026-10-12', 3);
  const resultDay2 = selectDailyPhrases(INITIAL_PHRASES, learnedIds, '2026-10-13', 3);

  const idsDay1 = resultDay1.questions.map((q) => q.id);
  const idsDay2 = resultDay2.questions.map((q) => q.id);
  assert.notDeepEqual(idsDay1, idsDay2, 'Different days should rotate question IDs');
});

test('daily rotation: prioritizes unlearned phrases', () => {
  // すでに先頭20問を学習済み
  const learnedIds = INITIAL_PHRASES.slice(0, 20).map((p) => p.id);
  const result = selectDailyPhrases(INITIAL_PHRASES, learnedIds, '2026-10-12', 3);

  assert.equal(result.questions.length, 3);
  for (const q of result.questions) {
    assert.equal(
      learnedIds.includes(q.id),
      false,
      `Selected question ${q.id} must be from unlearned pool`
    );
  }
});

test('daily rotation: fills remainder from learned pool when unlearned is fewer than 3', () => {
  // 未履修が1問だけ残っているケース
  const onlyOneUnlearned = INITIAL_PHRASES[29];
  const learnedIds = INITIAL_PHRASES.slice(0, 29).map((p) => p.id);

  const result = selectDailyPhrases(INITIAL_PHRASES, learnedIds, '2026-10-12', 3);

  assert.equal(result.questions.length, 3);
  const selectedIds = result.questions.map((q) => q.id);
  assert.ok(
    selectedIds.includes(onlyOneUnlearned.id),
    'Must include the remaining unlearned question'
  );
  // 重複がないこと
  const uniqueIds = new Set(selectedIds);
  assert.equal(uniqueIds.size, 3, 'Must select 3 unique questions without duplication');
});

test('daily rotation: review mode when all phrases are learned', () => {
  const allIds = INITIAL_PHRASES.map((p) => p.id);
  const result = selectDailyPhrases(INITIAL_PHRASES, allIds, '2026-10-12', 3);

  assert.equal(result.questions.length, 3);
  assert.equal(result.isReview, true, 'isReview should be true when all phrases learned');
  const uniqueIds = new Set(result.questions.map((q) => q.id));
  assert.equal(uniqueIds.size, 3, 'Selected questions must be unique');
});

test('daily rotation: option shuffling requirement (開くたびに選択肢がシャッフルされる)', () => {
  const sample = INITIAL_PHRASES[0];
  const originalOrder = sample.options.map((o) => o.id).join(',');

  // 複数回シャッフルを行い、元の選択肢要素を保持しつつ、異なる順序が発生することを確認
  let orderVaried = false;
  for (let i = 0; i < 20; i++) {
    const shuffled = shufflePhraseOptions(sample);
    // 全選択肢が含まれているか
    assert.equal(shuffled.options.length, sample.options.length);
    const sortedOriginal = [...sample.options].map((o) => o.id).sort();
    const sortedShuffled = [...shuffled.options].map((o) => o.id).sort();
    assert.deepEqual(sortedOriginal, sortedShuffled, 'All options must be preserved');

    const shuffledOrder = shuffled.options.map((o) => o.id).join(',');
    if (shuffledOrder !== originalOrder) {
      orderVaried = true;
      break;
    }
  }

  assert.ok(orderVaried, 'Option order must vary upon shuffling');
});

test('daily rotation: progress calculation and lap increment on completion', () => {
  const currentLearned = ['p-001', 'p-002'];
  const answered = ['p-003', 'p-004', 'p-005'];

  const progress1 = calculateNextProgressAfterCompletion(currentLearned, 1, answered, 30);
  assert.equal(progress1.nextLapCount, 1);
  assert.deepEqual(progress1.nextLearnedIds, ['p-001', 'p-002', 'p-003', 'p-004', 'p-005']);

  // 30問達成時の周回インクリメント
  const almostAll = INITIAL_PHRASES.slice(0, 28).map((p) => p.id);
  const lastTwo = [INITIAL_PHRASES[28].id, INITIAL_PHRASES[29].id];

  const progressLap = calculateNextProgressAfterCompletion(almostAll, 1, lastTwo, 30);
  assert.equal(progressLap.nextLapCount, 2, 'Lap count should increment to 2');
  assert.deepEqual(progressLap.nextLearnedIds, [], 'Learned IDs should reset for next lap');
});
