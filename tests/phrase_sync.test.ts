import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  validatePhraseItem,
  mergePhrases,
  loadCachedCloudPhrases,
  saveCachedCloudPhrases,
  getMergedPhrases,
  fetchCloudPhrasesFromFirestore,
  PHRASES_CACHE_KEY,
  type PhraseItem,
} from '../src/lib/phraseSync.ts';
import { INITIAL_PHRASES } from '../src/data/phrases.ts';

describe('Phrase item validation (validatePhraseItem)', () => {
  const validItem: PhraseItem = {
    id: 'custom-phrase-001',
    situation: 'レース後の勝利騎手インタビュー',
    phrase: 'travelled with plenty of swagger',
    literalTranslation: '堂々と自信満々に走った',
    explanation: '手応え抜群で威風堂々と追走した様子を表す表現。',
    category: 'feel',
    level: 'intermediate',
    type: 'phrase',
    options: [
      { id: 'opt-1', text: '自信満々の抜群の手応えで追走した', isCorrect: true },
      { id: 'opt-2', text: '気負いすぎて折り合いを欠いた', isCorrect: false },
      { id: 'opt-3', text: '手元が忙しく手が動いていた', isCorrect: false },
      { id: 'opt-4', text: '直線で完全に脚が上がった', isCorrect: false },
    ],
  };

  test('valid item passes validation', () => {
    const validated = validatePhraseItem(validItem);
    assert.ok(validated);
    assert.equal(validated?.id, 'custom-phrase-001');
    assert.equal(validated?.phrase, 'travelled with plenty of swagger');
    assert.equal(validated?.category, 'feel');
    assert.equal(validated?.level, 'intermediate');
    assert.equal(validated?.type, 'phrase');
    assert.equal(validated?.options.length, 4);
    assert.equal(validated?.options.filter((o) => o.isCorrect).length, 1);
  });

  test('rejects items with isPublished: false', () => {
    const unpublished = {
      ...validItem,
      isPublished: false,
    };
    assert.equal(validatePhraseItem(unpublished), null);
  });

  test('rejects empty id or phrase', () => {
    assert.equal(validatePhraseItem({ ...validItem, id: '' }), null);
    assert.equal(validatePhraseItem({ ...validItem, phrase: '   ' }), null);
    assert.equal(validatePhraseItem(null), null);
    assert.equal(validatePhraseItem(undefined), null);
  });

  test('rejects invalid category or level', () => {
    assert.equal(validatePhraseItem({ ...validItem, category: 'unknown-cat' }), null);
    assert.equal(validatePhraseItem({ ...validItem, level: 'expert' }), null);
  });

  test('rejects options with count !== 4 or multiple correct answers', () => {
    // 3 options
    const threeOpts = {
      ...validItem,
      options: validItem.options.slice(0, 3),
    };
    assert.equal(validatePhraseItem(threeOpts), null);

    // 2 correct options
    const twoCorrect = {
      ...validItem,
      options: validItem.options.map((opt) => ({ ...opt, isCorrect: true })),
    };
    assert.equal(validatePhraseItem(twoCorrect), null);

    // 0 correct options
    const zeroCorrect = {
      ...validItem,
      options: validItem.options.map((opt) => ({ ...opt, isCorrect: false })),
    };
    assert.equal(validatePhraseItem(zeroCorrect), null);
  });
});

describe('Phrase hybrid merge logic (mergePhrases)', () => {
  const sampleStatic: PhraseItem[] = [
    {
      id: 'p-1',
      situation: 'sit 1',
      phrase: 'phrase 1',
      explanation: 'exp 1',
      category: 'feel',
      level: 'beginner',
      options: [
        { id: 'o-1', text: 'ans', isCorrect: true },
        { id: 'o-2', text: 'w1', isCorrect: false },
        { id: 'o-3', text: 'w2', isCorrect: false },
        { id: 'o-4', text: 'w3', isCorrect: false },
      ],
    },
    {
      id: 'p-2',
      situation: 'sit 2',
      phrase: 'phrase 2',
      explanation: 'exp 2',
      category: 'tactics',
      level: 'beginner',
      options: [
        { id: 'o-1', text: 'ans', isCorrect: true },
        { id: 'o-2', text: 'w1', isCorrect: false },
        { id: 'o-3', text: 'w2', isCorrect: false },
        { id: 'o-4', text: 'w3', isCorrect: false },
      ],
    },
  ];

  test('returns copy of static phrases when cloud phrases is empty', () => {
    const result = mergePhrases(sampleStatic, []);
    assert.equal(result.length, 2);
    assert.equal(result[0].id, 'p-1');
    assert.equal(result[1].id, 'p-2');
  });

  test('appends new phrases from cloud to the end', () => {
    const cloudNew: PhraseItem = {
      id: 'p-new-99',
      situation: 'sit new',
      phrase: 'phrase new',
      explanation: 'exp new',
      category: 'reaction',
      level: 'intermediate',
      options: [
        { id: 'o-1', text: 'ans', isCorrect: true },
        { id: 'o-2', text: 'w1', isCorrect: false },
        { id: 'o-3', text: 'w2', isCorrect: false },
        { id: 'o-4', text: 'w3', isCorrect: false },
      ],
    };

    const result = mergePhrases(sampleStatic, [cloudNew]);
    assert.equal(result.length, 3);
    assert.equal(result[0].id, 'p-1');
    assert.equal(result[1].id, 'p-2');
    assert.equal(result[2].id, 'p-new-99');
    assert.equal(result[2].phrase, 'phrase new');
  });

  test('overwrites existing phrases by matching id without changing position', () => {
    const cloudUpdate: PhraseItem = {
      id: 'p-1',
      situation: 'sit 1 updated',
      phrase: 'phrase 1 updated',
      explanation: 'exp 1 updated',
      category: 'feel',
      level: 'intermediate',
      options: [
        { id: 'o-1', text: 'ans updated', isCorrect: true },
        { id: 'o-2', text: 'w1', isCorrect: false },
        { id: 'o-3', text: 'w2', isCorrect: false },
        { id: 'o-4', text: 'w3', isCorrect: false },
      ],
    };

    const result = mergePhrases(sampleStatic, [cloudUpdate]);
    assert.equal(result.length, 2);
    assert.equal(result[0].id, 'p-1');
    assert.equal(result[0].phrase, 'phrase 1 updated');
    assert.equal(result[0].explanation, 'exp 1 updated');
    assert.equal(result[0].level, 'intermediate');
    assert.equal(result[1].id, 'p-2');
    assert.equal(result[1].phrase, 'phrase 2');
  });
});

describe('LocalStorage cache operations (loadCachedCloudPhrases & saveCachedCloudPhrases)', () => {
  let mockStore: Record<string, string> = {};

  beforeEach(() => {
    mockStore = {};
    const mockLocalStorage = {
      getItem: (key: string) => mockStore[key] ?? null,
      setItem: (key: string, value: string) => {
        mockStore[key] = value;
      },
      removeItem: (key: string) => {
        delete mockStore[key];
      },
      clear: () => {
        mockStore = {};
      },
    };

    (globalThis as unknown as { window: unknown }).window = {
      localStorage: mockLocalStorage,
    };
  });

  afterEach(() => {
    delete (globalThis as unknown as { window?: unknown }).window;
  });

  test('saves and loads valid cached cloud phrases', () => {
    const testItem: PhraseItem = {
      id: 'cloud-cached-001',
      situation: 'ゲート入り直前',
      phrase: 'loaded into the stalls nicely',
      explanation: '枠入りスムーズな様子。',
      category: 'tactics',
      level: 'beginner',
      type: 'vocabulary',
      options: [
        { id: 'o-1', text: 'スムーズにゲートに収まった', isCorrect: true },
        { id: 'o-2', text: '枠入りを激しく嫌がった', isCorrect: false },
        { id: 'o-3', text: 'ゲート内で立ち上がった', isCorrect: false },
        { id: 'o-4', text: '出遅れて後方からになった', isCorrect: false },
      ],
    };

    saveCachedCloudPhrases([testItem]);
    assert.ok(mockStore[PHRASES_CACHE_KEY]);

    const loaded = loadCachedCloudPhrases();
    assert.equal(loaded.length, 1);
    assert.equal(loaded[0].id, 'cloud-cached-001');
    assert.equal(loaded[0].phrase, 'loaded into the stalls nicely');
  });

  test('safely falls back to empty array on invalid JSON or damaged cache', () => {
    mockStore[PHRASES_CACHE_KEY] = 'INVALID_JSON{{{';
    const loaded = loadCachedCloudPhrases();
    assert.deepEqual(loaded, []);
  });

  test('getMergedPhrases merges cache with INITIAL_PHRASES', () => {
    // キャッシュなしの場合: INITIAL_PHRASES（120問）そのまま
    const initialOnly = getMergedPhrases();
    assert.equal(initialOnly.length, INITIAL_PHRASES.length);

    // キャッシュに1件新規を追加した場合: 121問
    const testNew: PhraseItem = {
      id: 'brand-new-phrase-2026',
      situation: 'パドック気配',
      phrase: 'walking on air',
      explanation: '弾むような軽いフットワーク。',
      category: 'feel',
      level: 'intermediate',
      options: [
        { id: 'o-1', text: '弾むような最高の足取り', isCorrect: true },
        { id: 'o-2', text: '重苦しい歩様', isCorrect: false },
        { id: 'o-3', text: '落ち着きがない', isCorrect: false },
        { id: 'o-4', text: '歩様が硬い', isCorrect: false },
      ],
    };
    saveCachedCloudPhrases([testNew]);
    const merged = getMergedPhrases();
    assert.equal(merged.length, INITIAL_PHRASES.length + 1);
    assert.equal(merged[merged.length - 1].id, 'brand-new-phrase-2026');
  });
});

describe('Firestore fetch resilience (fetchCloudPhrasesFromFirestore)', () => {
  test('returns empty array when Firebase is unconfigured or offline without crashing', async () => {
    const result = await fetchCloudPhrasesFromFirestore();
    assert.ok(Array.isArray(result));
  });
});
