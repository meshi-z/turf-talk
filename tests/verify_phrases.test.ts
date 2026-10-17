import { test } from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_PHRASES, UPHILL_PHRASES, WOODCHIP_PHRASES } from '../src/data/phrases.ts';

test('phrases dataset verification (120 items: 60 uphill phrases, 60 woodchip vocabularies)', () => {
  // 1. 件数確認（120件、各60件）
  assert.equal(INITIAL_PHRASES.length, 120, 'Total phrases must be exactly 120');
  assert.equal(UPHILL_PHRASES.length, 60, 'Uphill phrases must be exactly 60');
  assert.equal(WOODCHIP_PHRASES.length, 60, 'Woodchip vocabularies must be exactly 60');

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

  // 4. カテゴリごとの分布確認（坂路調教 60問）
  const uphillFeel = UPHILL_PHRASES.filter((p) => p.category === 'feel').length;
  const uphillTactics = UPHILL_PHRASES.filter((p) => p.category === 'tactics').length;
  const uphillReaction = UPHILL_PHRASES.filter((p) => p.category === 'reaction').length;
  const uphillComment = UPHILL_PHRASES.filter((p) => p.category === 'comment').length;

  assert.equal(uphillFeel, 15, 'uphill feel count must be 15');
  assert.equal(uphillTactics, 16, 'uphill tactics count must be 16');
  assert.equal(uphillReaction, 15, 'uphill reaction count must be 15');
  assert.equal(uphillComment, 14, 'uphill comment count must be 14');

  // 5. カテゴリごとの分布確認（ウッドチップ調教 60問）
  const woodchipFeel = WOODCHIP_PHRASES.filter((p) => p.category === 'feel').length;
  const woodchipTactics = WOODCHIP_PHRASES.filter((p) => p.category === 'tactics').length;
  const woodchipReaction = WOODCHIP_PHRASES.filter((p) => p.category === 'reaction').length;
  const woodchipComment = WOODCHIP_PHRASES.filter((p) => p.category === 'comment').length;

  assert.equal(woodchipFeel, 15, 'woodchip feel count must be 15');
  assert.equal(woodchipTactics, 15, 'woodchip tactics count must be 15');
  assert.equal(woodchipReaction, 15, 'woodchip reaction count must be 15');
  assert.equal(woodchipComment, 15, 'woodchip comment count must be 15');
});
