import { test } from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_PHRASES } from '../src/data/phrases.ts';

test('phrases dataset verification (30 items)', () => {
  // 1. 件数確認（30件）
  assert.equal(INITIAL_PHRASES.length, 30, 'Total phrases must be exactly 30');

  // 2. IDの一意性・必須属性確認
  const idSet = new Set<string>();
  const validCategories = new Set(['feel', 'tactics', 'reaction', 'comment']);
  const validLevels = new Set(['beginner', 'intermediate']);

  for (const item of INITIAL_PHRASES) {
    assert.ok(item.id, 'ID must not be empty');
    assert.ok(!idSet.has(item.id), `Duplicate ID found: ${item.id}`);
    idSet.add(item.id);

    // 必須項目のチェック
    assert.ok(item.phrase.trim().length > 0, `Empty phrase in ${item.id}`);
    assert.ok(item.situation.trim().length > 0, `Empty situation in ${item.id}`);
    assert.ok(item.explanation.trim().length > 0, `Empty explanation in ${item.id}`);
    assert.ok(validCategories.has(item.category), `Invalid category ${item.category} in ${item.id}`);
    assert.ok(validLevels.has(item.level), `Invalid level ${item.level} in ${item.id}`);

    // 3. 選択肢の検証（4肢、正解が1つのみ）
    assert.equal(item.options.length, 4, `Options length must be 4 in ${item.id}`);
    const correctOptions = item.options.filter((opt) => opt.isCorrect);
    assert.equal(correctOptions.length, 1, `Must have exactly 1 correct option in ${item.id}`);

    // 各選択肢のテキスト
    const optIdSet = new Set<string>();
    for (const opt of item.options) {
      assert.ok(opt.id, `Option ID must not be empty in ${item.id}`);
      assert.ok(!optIdSet.has(opt.id), `Duplicate option ID in ${item.id}: ${opt.id}`);
      optIdSet.add(opt.id);
      assert.ok(opt.text.trim().length > 0, `Empty option text in ${item.id} - ${opt.id}`);
    }
  }

  // 4. カテゴリごとの分布確認
  const feelCount = INITIAL_PHRASES.filter((p) => p.category === 'feel').length;
  const tacticsCount = INITIAL_PHRASES.filter((p) => p.category === 'tactics').length;
  const reactionCount = INITIAL_PHRASES.filter((p) => p.category === 'reaction').length;
  const commentCount = INITIAL_PHRASES.filter((p) => p.category === 'comment').length;

  assert.equal(feelCount, 8, 'feel count must be 8');
  assert.equal(tacticsCount, 8, 'tactics count must be 8');
  assert.equal(reactionCount, 7, 'reaction count must be 7');
  assert.equal(commentCount, 7, 'comment count must be 7');
});
