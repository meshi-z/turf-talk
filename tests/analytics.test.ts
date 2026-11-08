import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  initAnalytics,
  logAnalyticsEvent,
  logTrainingCompleted,
  logRaceCompleted,
  logHorseRetired,
  logPhraseBookmarked,
} from '../src/lib/analytics.ts';

describe('Firebase Analytics client logger (analytics.ts)', () => {
  test('initAnalytics returns null safely in Node environment without crashing', async () => {
    const analytics = await initAnalytics();
    assert.equal(analytics, null);
  });

  test('logAnalyticsEvent runs safely in test environment without throwing', () => {
    assert.doesNotThrow(() => {
      logAnalyticsEvent('test_event', {
        string_val: 'hello',
        num_val: 123,
        bool_val: true,
        null_val: null,
        undef_val: undefined,
      });
    });
  });

  test('logTrainingCompleted executes safely', () => {
    assert.doesNotThrow(() => {
      logTrainingCompleted({
        course: 'uphill',
        score: 3,
        durationSec: 25,
        learnedCount: 42,
      });
      logTrainingCompleted({
        course: 'woodchip',
        score: 2,
      });
    });
  });

  test('logRaceCompleted executes safely', () => {
    assert.doesNotThrow(() => {
      logRaceCompleted({
        grade: 'G1',
        raceName: 'Classic Stakes',
        placement: 1,
        placementText: '1着',
        horseName: 'Turf Champion',
        routeId: 'classic',
        score: 5,
      });
    });
  });

  test('logHorseRetired executes safely', () => {
    assert.doesNotThrow(() => {
      logHorseRetired({
        generation: 2,
        totalWins: 4,
        hallOfFame: true,
        epithet: '伝説の三冠馬',
        careerWeeks: 4,
      });
    });
  });

  test('logPhraseBookmarked executes safely', () => {
    assert.doesNotThrow(() => {
      logPhraseBookmarked({
        phraseId: 'phrase-001',
        isBookmarked: true,
      });
      logPhraseBookmarked({
        phraseId: 'phrase-001',
        isBookmarked: false,
      });
    });
  });
});

describe('BigQuery SQL queries verification (analytics-queries.sql)', () => {
  const sqlPath = path.resolve('docs/specs/analytics-queries.sql');

  test('SQL file exists and contains all 4 major dashboard metrics', () => {
    assert.ok(fs.existsSync(sqlPath), 'analytics-queries.sql should exist');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // 1. コンテンツ健全性 & 枯渇予測
    assert.ok(sqlContent.includes('1. コンテンツ健全性 ＆ 消化率・枯渇予測'));
    assert.ok(sqlContent.includes('progress_bucket'));
    assert.ok(sqlContent.includes('depleted_user_count'));
    assert.ok(sqlContent.includes('overall_depletion_rate_percent'));

    // 2. 問題クオリティ & 難易度分析
    assert.ok(sqlContent.includes('2. 問題クオリティ ＆ フレーズ難易度分析'));
    assert.ok(sqlContent.includes('mastered_user_count'));
    assert.ok(sqlContent.includes('total_bookmarks'));

    // 3. ユーザー継続率 (リテンション)
    assert.ok(sqlContent.includes('3. ユーザー継続率（リテンション） ＆ ストリーク分析'));
    assert.ok(sqlContent.includes('day_1_retention_percent'));
    assert.ok(sqlContent.includes('day_7_retention_percent'));
    assert.ok(sqlContent.includes('day_30_retention_percent'));

    // 4. 競走馬成績 & 路線動向
    assert.ok(sqlContent.includes('4. 競走馬成績 ＆ 路線動向分析'));
    assert.ok(sqlContent.includes('route_popularity_percent'));
    assert.ok(sqlContent.includes('total_hall_of_fame_count'));
  });
});
