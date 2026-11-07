import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { CareerHorse, PhrasePartnerHorse } from '../src/types/index.ts';
import {
  recordNewPhrasePartners,
  resolvePhrasePartner,
} from '../src/lib/phrasePartner.ts';

describe('Phrase partner horse tracking (phrasePartner.ts)', () => {
  const horseGen1: CareerHorse = {
    generation: 1,
    name: 'ターフスター',
    color: '鹿毛',
    routeId: 'classic-colt',
    currentWeek: 1,
    weight: 484,
    hasTrained: true,
    raceHistory: [],
    learnedPhraseIdsInCareer: ['phrase-001', 'phrase-002'],
  };

  const horseGen2: CareerHorse = {
    generation: 2,
    name: 'サイレントヒーロー',
    color: '芦毛',
    routeId: 'sprint',
    currentWeek: 1,
    weight: 490,
    hasTrained: true,
    raceHistory: [],
    learnedPhraseIdsInCareer: ['vocab-001'],
  };

  describe('recordNewPhrasePartners', () => {
    it('records current career horse for newly learned phrases', () => {
      const initialPartners: Record<string, PhrasePartnerHorse> = {};
      const newPhraseIds = ['phrase-001', 'phrase-002'];

      const result = recordNewPhrasePartners(initialPartners, newPhraseIds, horseGen1);

      assert.deepEqual(result['phrase-001'], {
        generation: 1,
        name: 'ターフスター',
        color: '鹿毛',
      });
      assert.deepEqual(result['phrase-002'], {
        generation: 1,
        name: 'ターフスター',
        color: '鹿毛',
      });
    });

    it('preserves existing partner information when phrase is reviewed (immutable initial partner)', () => {
      const existingPartners: Record<string, PhrasePartnerHorse> = {
        'phrase-001': {
          generation: 1,
          name: 'ターフスター',
          color: '鹿毛',
        },
      };

      // 第2世代の愛馬が phrase-001（既習）と vocab-001（新習得）を正解
      const correctIds = ['phrase-001', 'vocab-001'];
      const result = recordNewPhrasePartners(existingPartners, correctIds, horseGen2);

      // phrase-001 は第1世代のまま保持される
      assert.equal(result['phrase-001'].generation, 1);
      assert.equal(result['phrase-001'].name, 'ターフスター');
      assert.equal(result['phrase-001'].color, '鹿毛');

      // vocab-001 には第2世代の新馬が記録される
      assert.equal(result['vocab-001'].generation, 2);
      assert.equal(result['vocab-001'].name, 'サイレントヒーロー');
      assert.equal(result['vocab-001'].color, '芦毛');
    });

    it('handles undefined initial partners gracefully', () => {
      const result = recordNewPhrasePartners(undefined, ['phrase-003'], horseGen1);
      assert.deepEqual(result['phrase-003'], {
        generation: 1,
        name: 'ターフスター',
        color: '鹿毛',
      });
    });
  });

  describe('resolvePhrasePartner', () => {
    const savedPartners: Record<string, PhrasePartnerHorse> = {
      'phrase-001': {
        generation: 1,
        name: 'ターフスター',
        color: '鹿毛',
      },
    };

    it('returns exact registered partner horse when available', () => {
      const partner = resolvePhrasePartner('phrase-001', savedPartners, true, horseGen2);
      assert.deepEqual(partner, {
        generation: 1,
        name: 'ターフスター',
        color: '鹿毛',
      });
    });

    it('safely falls back to current horse for legacy learned phrases without partner records', () => {
      // phrase-999 は習得済みだが savedPartners に未登録
      const partner = resolvePhrasePartner('phrase-999', savedPartners, true, horseGen1);
      assert.deepEqual(partner, {
        generation: 1,
        name: 'ターフスター',
        color: '鹿毛',
      });
    });

    it('returns null for unlearned phrases even if fallback horse is provided', () => {
      const partner = resolvePhrasePartner('phrase-unlearned', savedPartners, false, horseGen1);
      assert.equal(partner, null);
    });

    it('returns null when unlearned and no partners exist', () => {
      const partner = resolvePhrasePartner('phrase-unknown', undefined, false, null);
      assert.equal(partner, null);
    });
  });
});
