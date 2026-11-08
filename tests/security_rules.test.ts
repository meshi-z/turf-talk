import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  validateAndSanitizeProgress,
  reconcileWithCloud,
} from '../src/lib/securityValidator.ts';
import { initAppCheck } from '../src/lib/appCheck.ts';
import type { UserProgress } from '../src/types/index.ts';

describe('Data sanitization & anti-tampering (securityValidator.ts)', () => {
  const dummyProgress: UserProgress = {
    lastTrainingDate: '2026-11-08',
    streakDays: 5,
    condition: 'up',
    horseName: 'ターフスター',
    horseWeight: 484,
    completedToday: true,
    learnedPhraseIds: ['p1'],
    lapCount: 1,
    todayPhraseIds: ['p1'],
    todayWoodchipPhraseIds: [],
    completedCoursesToday: ['uphill'],
    weekdayTrainingDays: 3,
    carrotCount: 1,
    lastCarrotUsedDate: null,
    currentWeekMonday: '2026-11-02',
    lastRaceWeekMonday: null,
    hasCompletedWeeklyRace: false,
    careerHorse: {
      generation: 1,
      name: 'テスト馬',
      color: 'bay',
      routeId: 'classic',
      currentWeek: 2,
      weight: 484,
      hasTrained: true,
      raceHistory: [],
      learnedPhraseIdsInCareer: ['p1'],
    },
    hallOfFame: [],
    bookmarkedPhraseIds: [],
    phrasePartners: {},
  };

  test('detects and clamps tampered carrotCount (> 3 or < 0)', () => {
    // 99個のにんじんに改ざん
    const tamperedHigh = { ...dummyProgress, carrotCount: 99 };
    const resultHigh = validateAndSanitizeProgress(tamperedHigh);
    assert.strictEqual(resultHigh.hasTampered, true);
    assert.strictEqual(resultHigh.sanitized.carrotCount, 3);

    // 負の数に改ざん
    const tamperedNegative = { ...dummyProgress, carrotCount: -5 };
    const resultNegative = validateAndSanitizeProgress(tamperedNegative);
    assert.strictEqual(resultNegative.hasTampered, true);
    assert.strictEqual(resultNegative.sanitized.carrotCount, 0);

    // 正常値 (2)
    const valid = { ...dummyProgress, carrotCount: 2 };
    const resultValid = validateAndSanitizeProgress(valid);
    assert.strictEqual(resultValid.hasTampered, false);
    assert.strictEqual(resultValid.sanitized.carrotCount, 2);
  });

  test('detects and clamps tampered weekdayTrainingDays and streakDays', () => {
    // 10日調教に改ざん
    const tamperedDays = { ...dummyProgress, weekdayTrainingDays: 10, streakDays: -10 };
    const result = validateAndSanitizeProgress(tamperedDays);
    assert.strictEqual(result.hasTampered, true);
    assert.strictEqual(result.sanitized.weekdayTrainingDays, 7);
    assert.strictEqual(result.sanitized.streakDays, 0);
  });

  test('detects and sanitizes abnormal career horse week and weight', () => {
    const tamperedHorse = {
      ...dummyProgress,
      careerHorse: {
        ...dummyProgress.careerHorse,
        currentWeek: 9 as unknown as 4, // 不正な週番号
        weight: 1200, // 異常な馬体重
      },
    };

    const result = validateAndSanitizeProgress(tamperedHorse);
    assert.strictEqual(result.hasTampered, true);
    assert.strictEqual(result.sanitized.careerHorse.currentWeek, 4);
    assert.strictEqual(result.sanitized.careerHorse.weight, 484);
  });

  test('reconciles local progress with cloud authority', () => {
    const localTampered = { ...dummyProgress, carrotCount: 3, streakDays: 99 };
    const cloudProgress = { ...dummyProgress, carrotCount: 1, streakDays: 5 };

    const reconciled = reconcileWithCloud(localTampered, cloudProgress);
    assert.strictEqual(reconciled.carrotCount, 1);
    assert.strictEqual(reconciled.streakDays, 5);
  });
});

describe('Firestore rules syntax and App Check (firestore.rules & appCheck.ts)', () => {
  test('firestore.rules file exists and defines essential security validations', () => {
    const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
    assert.ok(fs.existsSync(rulesPath), 'firestore.rules should exist');

    const content = fs.readFileSync(rulesPath, 'utf-8');
    assert.ok(content.includes('rules_version = \'2\';'), 'rules_version 2 required');
    assert.ok(content.includes('carrotCount <= 3'), 'carrot validation required');
    assert.ok(content.includes('isAdmin()'), 'admin validation function required');
    assert.ok(content.includes('match /users/{userId}'), 'users collection rule required');
    assert.ok(content.includes('match /phrases/{phraseId}'), 'phrases collection rule required');
  });

  test('initAppCheck returns null safely in test environment', () => {
    const result = initAppCheck();
    assert.strictEqual(result, null);
  });
});
