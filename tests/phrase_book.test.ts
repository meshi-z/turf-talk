import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_PHRASES, type PhraseCategory, type PhraseItem } from '../src/data/phrases.ts';

describe('phrase book filtering & bookmarking logic', () => {
  const sampleLearnedIds = ['phrase-001', 'phrase-002', 'vocab-001'];
  const sampleBookmarkedIds = ['phrase-001', 'vocab-002'];

  it('calculates total learned and course-specific progress accurately', () => {
    const totalCount = INITIAL_PHRASES.length; // 120
    const uphillTotal = INITIAL_PHRASES.filter((p) => (p.type ?? 'phrase') === 'phrase').length; // 60
    const woodchipTotal = INITIAL_PHRASES.filter((p) => p.type === 'vocabulary').length; // 60

    assert.equal(totalCount, 120);
    assert.equal(uphillTotal, 60);
    assert.equal(woodchipTotal, 60);

    const learnedSet = new Set(sampleLearnedIds);
    const uphillLearned = INITIAL_PHRASES.filter(
      (p) => (p.type ?? 'phrase') === 'phrase' && learnedSet.has(p.id)
    ).length;
    const woodchipLearned = INITIAL_PHRASES.filter(
      (p) => p.type === 'vocabulary' && learnedSet.has(p.id)
    ).length;

    assert.equal(uphillLearned, 2);
    assert.equal(woodchipLearned, 1);
  });

  describe('status filtering (learned, unlearned, bookmarked)', () => {
    const learnedSet = new Set(sampleLearnedIds);
    const bookmarkedSet = new Set(sampleBookmarkedIds);

    it('filters only learned phrases', () => {
      const learned = INITIAL_PHRASES.filter((p) => learnedSet.has(p.id));
      assert.equal(learned.length, 3);
      assert.ok(learned.every((p) => sampleLearnedIds.includes(p.id)));
    });

    it('filters only unlearned phrases', () => {
      const unlearned = INITIAL_PHRASES.filter((p) => !learnedSet.has(p.id));
      assert.equal(unlearned.length, INITIAL_PHRASES.length - 3);
      assert.ok(unlearned.every((p) => !sampleLearnedIds.includes(p.id)));
    });

    it('filters only bookmarked phrases', () => {
      const bookmarked = INITIAL_PHRASES.filter((p) => bookmarkedSet.has(p.id));
      assert.equal(bookmarked.length, 2);
      assert.ok(bookmarked.every((p) => sampleBookmarkedIds.includes(p.id)));
    });
  });

  describe('course & category filtering', () => {
    it('filters phrases by course type', () => {
      const uphillPhrases = INITIAL_PHRASES.filter((p) => (p.type ?? 'phrase') === 'phrase');
      const woodchipPhrases = INITIAL_PHRASES.filter((p) => p.type === 'vocabulary');

      assert.equal(uphillPhrases.length, 60);
      assert.equal(woodchipPhrases.length, 60);
      assert.ok(uphillPhrases.every((p) => (p.type ?? 'phrase') === 'phrase'));
      assert.ok(woodchipPhrases.every((p) => p.type === 'vocabulary'));
    });

    it('filters phrases by category (feel, tactics, reaction, comment)', () => {
      const categories: PhraseCategory[] = ['feel', 'tactics', 'reaction', 'comment'];
      for (const cat of categories) {
        const catItems = INITIAL_PHRASES.filter((p) => p.category === cat);
        assert.ok(catItems.length > 0, `Category ${cat} should have questions`);
        assert.ok(catItems.every((p) => p.category === cat));
      }
    });
  });

  describe('keyword search matching', () => {
    function searchPhrases(query: string): PhraseItem[] {
      const q = query.toLowerCase().trim();
      if (!q) return [...INITIAL_PHRASES];

      return INITIAL_PHRASES.filter((item) => {
        const inPhrase = item.phrase.toLowerCase().includes(q);
        const inSituation = item.situation.toLowerCase().includes(q);
        const inExplanation = item.explanation.toLowerCase().includes(q);
        const inLiteral = (item.literalTranslation ?? '').toLowerCase().includes(q);
        const inOptions = item.options.some((opt) => opt.text.toLowerCase().includes(q));
        return inPhrase || inSituation || inExplanation || inLiteral || inOptions;
      });
    }

    it('matches exact and case-insensitive English phrases', () => {
      const resultsLower = searchPhrases('turn of foot');
      const resultsUpper = searchPhrases('TURN OF FOOT');
      assert.ok(resultsLower.length > 0);
      assert.equal(resultsLower.length, resultsUpper.length);
      assert.ok(resultsLower.some((p) => p.id === 'phrase-057'));
    });

    it('matches Japanese text in options, explanation, or situation', () => {
      const results = searchPhrases('瞬発力');
      assert.ok(results.length > 0);
      assert.ok(
        results.some(
          (p) =>
            p.phrase.includes('Turn of foot') ||
            p.options.some((o) => o.text.includes('瞬発力')) ||
            p.explanation.includes('瞬発力')
        )
      );
    });

    it('returns empty array when query has no matches', () => {
      const noMatch = searchPhrases('xyz_nonexistent_query_12345');
      assert.equal(noMatch.length, 0);
    });
  });

  describe('bookmark toggling behavior', () => {
    it('adds and removes phrase IDs cleanly without duplicates', () => {
      let bookmarked: string[] = ['phrase-001'];

      // トグル追加: vocab-001 を追加
      const toAdd = 'vocab-001';
      bookmarked = bookmarked.includes(toAdd)
        ? bookmarked.filter((id) => id !== toAdd)
        : [...bookmarked, toAdd];

      assert.deepEqual(bookmarked, ['phrase-001', 'vocab-001']);

      // トグル削除: phrase-001 を解除
      const toRemove = 'phrase-001';
      bookmarked = bookmarked.includes(toRemove)
        ? bookmarked.filter((id) => id !== toRemove)
        : [...bookmarked, toRemove];

      assert.deepEqual(bookmarked, ['vocab-001']);
    });
  });
});
