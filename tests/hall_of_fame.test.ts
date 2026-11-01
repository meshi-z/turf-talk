import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { HallOfFameHorse } from '../src/types/index.ts';
import {
  calculateHallOfFameStats,
  sortHallOfFame,
  generateHallOfFameShareText,
  generateHallOfFameTwitterUrl,
  createSampleHallOfFameHorses,
  COAT_COLOR_THEMES,
} from '../src/lib/hallOfFame.ts';
import { HORSE_COAT_COLORS } from '../src/lib/careerCycle.ts';

describe('Hall of Fame statistics & logic (hallOfFame.ts)', () => {
  const sampleHorses: HallOfFameHorse[] = [
    {
      id: 'hof-1',
      generation: 1,
      name: 'ターフスター',
      color: '鹿毛',
      routeId: 'classic-colt',
      routeName: '3歳牡馬クラシック路線',
      retiredDate: '2026-10-25',
      wins: 4,
      totalRaces: 4,
      titles: ['メイクデビュー 制覇', '日本ダービー 制覇', '凱旋門賞 制覇'],
      learnedCount: 12,
      titleName: '不敗の世界覇者',
      raceHistory: [],
    },
    {
      id: 'hof-2',
      generation: 2,
      name: 'クリスタルクラウン',
      color: '芦毛',
      routeId: 'classic-filly',
      routeName: '3歳牝馬クラシック路線',
      retiredDate: '2026-11-01',
      wins: 2,
      totalRaces: 4,
      titles: ['優駿牝馬/オークス 制覇'],
      learnedCount: 9,
      titleName: 'ターフに咲く優駿の女王',
      raceHistory: [],
    },
    {
      id: 'hof-3',
      generation: 3,
      name: 'ゴールデンランナー',
      color: '栗毛',
      routeId: 'sprint',
      routeName: '古馬短距離（スプリント）路線',
      retiredDate: '2026-11-08',
      wins: 4,
      totalRaces: 4,
      titles: ['スプリンターズS 制覇', '香港スプリント 制覇'],
      learnedCount: 15,
      titleName: '不敗の世界覇者',
      raceHistory: [],
    },
  ];

  describe('calculateHallOfFameStats', () => {
    it('returns zeroes when hall of fame list is empty', () => {
      const stats = calculateHallOfFameStats([]);
      assert.deepEqual(stats, {
        totalHorses: 0,
        totalWins: 0,
        totalTitles: 0,
        totalLearnedCount: 0,
        undefeatedCount: 0,
      });
    });

    it('accurately calculates cumulative statistics from multiple horses', () => {
      const stats = calculateHallOfFameStats(sampleHorses);
      assert.equal(stats.totalHorses, 3);
      assert.equal(stats.totalWins, 10); // 4 + 2 + 4
      assert.equal(stats.totalTitles, 6); // 3 + 1 + 2
      assert.equal(stats.totalLearnedCount, 36); // 12 + 9 + 15
      assert.equal(stats.undefeatedCount, 2); // hof-1, hof-3
    });
  });

  describe('sortHallOfFame', () => {
    it('sorts by generation descending (latest generation first)', () => {
      const sorted = sortHallOfFame(sampleHorses, 'generation-desc');
      assert.deepEqual(
        sorted.map((h) => h.generation),
        [3, 2, 1]
      );
    });

    it('sorts by generation ascending (first generation first)', () => {
      const sorted = sortHallOfFame(sampleHorses, 'generation-asc');
      assert.deepEqual(
        sorted.map((h) => h.generation),
        [1, 2, 3]
      );
    });

    it('sorts by wins descending with generation tie-breaker', () => {
      const sorted = sortHallOfFame(sampleHorses, 'wins-desc');
      // wins: hof-3 (4, gen 3), hof-1 (4, gen 1), hof-2 (2, gen 2)
      assert.deepEqual(
        sorted.map((h) => h.id),
        ['hof-3', 'hof-1', 'hof-2']
      );
    });
  });

  describe('generateHallOfFameShareText & Twitter URL', () => {
    it('contains all essential horse attributes, stats, and hashtags', () => {
      const horse = sampleHorses[0];
      const text = generateHallOfFameShareText(horse);

      assert.ok(text.includes('第1世代「ターフスター」'));
      assert.ok(text.includes('（鹿毛）'));
      assert.ok(text.includes('【不敗の世界覇者】'));
      assert.ok(text.includes('3歳牡馬クラシック路線'));
      assert.ok(text.includes('4戦4勝'));
      assert.ok(text.includes('12問マスター'));
      assert.ok(text.includes('#TurfTalk'));
      assert.ok(text.includes('#HallOfFame'));
      assert.ok(text.includes('#競馬英語'));
    });

    it('generates valid encoded Twitter Web Intent URL', () => {
      const horse = sampleHorses[0];
      const url = generateHallOfFameTwitterUrl(horse);

      assert.ok(url.startsWith('https://twitter.com/intent/tweet?text='));
      assert.ok(url.includes('%E7%AC%AC1%E4%B8%96%E4%BB%A3')); // URI encoded
    });
  });

  describe('COAT_COLOR_THEMES integrity', () => {
    it('defines visual palette for all 8 JRA coat colors', () => {
      for (const color of HORSE_COAT_COLORS) {
        const theme = COAT_COLOR_THEMES[color];
        assert.ok(theme, `Theme must exist for color: ${color}`);
        assert.equal(theme.label, color);
        assert.ok(theme.bgClass.length > 0);
        assert.ok(theme.textClass.length > 0);
        assert.ok(theme.hex.startsWith('#'));
      }
    });
  });

  describe('createSampleHallOfFameHorses', () => {
    it('creates sample horses with complete and valid properties', () => {
      const samples = createSampleHallOfFameHorses();
      assert.ok(samples.length >= 2);
      for (const h of samples) {
        assert.ok(h.id);
        assert.ok(h.name);
        assert.ok(h.generation >= 1);
        assert.ok(h.wins >= 0);
        assert.ok(h.totalRaces >= h.wins);
        assert.ok(h.titles.length > 0);
        assert.ok(h.titleName);
        assert.ok(h.retiredDate);
        assert.ok(h.raceHistory.length > 0);
      }
    });
  });
});
