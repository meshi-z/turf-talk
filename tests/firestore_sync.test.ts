import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateUserSummary,
  fetchUserProgressFromFirestore,
  saveUserProgressToFirestore,
  markAccountDeletedInFirestore,
  restoreAccountInFirestore,
  updateUserAuthMetaInFirestore,
} from '../src/lib/firestoreSync.ts';
import type { UserProgress } from '../src/types/index.ts';

describe('Firestore summary calculations (calculateUserSummary)', () => {
  const baseProgress: UserProgress = {
    lastTrainingDate: '2026-11-08',
    streakDays: 7,
    condition: 'up',
    horseName: 'ターフスター',
    horseWeight: 480,
    completedToday: true,
    learnedPhraseIds: ['p1', 'p2', 'p3'], // 3問
    lapCount: 1,
    todayPhraseIds: ['p1', 'p2', 'p3'],
    todayWoodchipPhraseIds: [],
    completedCoursesToday: ['uphill'],
    weekdayTrainingDays: 4,
    carrotCount: 2,
    lastCarrotUsedDate: null,
    currentWeekMonday: '2026-11-02',
    lastRaceWeekMonday: null,
    hasCompletedWeeklyRace: false,
    careerHorse: {
      generation: 1,
      name: 'サクラサイレンス',
      color: 'chestnut',
      routeId: 'classic',
      currentWeek: 3,
      weight: 480,
      hasTrained: true,
      raceHistory: [
        { week: 1, raceName: '新馬戦', placementText: '1着', score: 5 },
        { week: 2, raceName: '弥生賞', placementText: '2着', score: 4 },
      ],
      learnedPhraseIdsInCareer: ['p1', 'p2'],
    },
    hallOfFame: [
      {
        id: 'hof_001',
        generation: 1,
        name: 'レジェンドスター',
        color: 'white',
        routeId: 'classic',
        routeName: '王道クラシック三冠',
        retiredDate: '2026-10-20',
        wins: 3,
        totalRaces: 4,
        titles: ['日本ダービー制覇'],
        learnedCount: 15,
        titleName: '白銀の怪物',
        raceHistory: [],
      },
    ],
    bookmarkedPhraseIds: ['p1'],
    phrasePartners: {},
  };

  test('accurately calculates learnedCount and progressPercent for 120 total questions', () => {
    // 3問消化 / 120問 = 2.5%
    const summary = calculateUserSummary(baseProgress);
    assert.strictEqual(summary.learnedCount, 3);
    assert.strictEqual(summary.progressPercent, 2.5);

    // 60問消化 / 120問 = 50.0%
    const halfProgress = {
      ...baseProgress,
      learnedPhraseIds: Array.from({ length: 60 }, (_, i) => `p_${i}`),
    };
    const halfSummary = calculateUserSummary(halfProgress);
    assert.strictEqual(halfSummary.learnedCount, 60);
    assert.strictEqual(halfSummary.progressPercent, 50.0);

    // 120問全消化 / 120問 = 100.0%
    const fullProgress = {
      ...baseProgress,
      learnedPhraseIds: Array.from({ length: 130 }, (_, i) => `p_${i}`), // 120超でも上限100%
    };
    const fullSummary = calculateUserSummary(fullProgress);
    assert.strictEqual(fullSummary.progressPercent, 100);
  });

  test('extracts career horse status, race wins, and hall of fame count', () => {
    const summary = calculateUserSummary(baseProgress);
    assert.strictEqual(summary.currentHorseName, 'サクラサイレンス');
    assert.strictEqual(summary.currentHorseRoute, 'classic');
    assert.strictEqual(summary.currentHorseWeek, 3);
    assert.strictEqual(summary.totalRaceWins, 4); // 現役1勝 + 殿堂入り3勝 = 4勝
    assert.strictEqual(summary.totalHallOfFameCount, 1); // 殿堂入り1頭
    assert.strictEqual(summary.streakDays, 7);
    assert.strictEqual(summary.carrotCount, 2);
  });

  test('falls back gracefully when careerHorse is missing or empty', () => {
    const emptyProgress = {
      ...baseProgress,
      careerHorse: null as unknown as UserProgress['careerHorse'],
      hallOfFame: [],
      learnedPhraseIds: [],
    };
    const summary = calculateUserSummary(emptyProgress);
    assert.strictEqual(summary.currentHorseName, 'ターフスター');
    assert.strictEqual(summary.currentHorseRoute, 'classic');
    assert.strictEqual(summary.currentHorseWeek, 1);
    assert.strictEqual(summary.totalRaceWins, 0);
    assert.strictEqual(summary.totalHallOfFameCount, 0);
  });
});

describe('Firestore soft delete & offline safety (firestoreSync.ts)', () => {
  test('unconfigured Firebase returns safe fallback without throwing', async () => {
    const result = await fetchUserProgressFromFirestore('test_uid');
    assert.strictEqual(result.progress, null);
    assert.strictEqual(result.isDeleted, false);

    const saveSuccess = await saveUserProgressToFirestore('test_uid', {} as UserProgress);
    assert.strictEqual(saveSuccess, false);

    const deleteSuccess = await markAccountDeletedInFirestore('test_uid');
    assert.strictEqual(deleteSuccess, false);

    const restoreSuccess = await restoreAccountInFirestore('test_uid');
    assert.strictEqual(restoreSuccess, false);

    const metaUpdateSuccess = await updateUserAuthMetaInFirestore('test_uid', {
      isAnonymous: true,
      providerId: 'anonymous',
    });
    assert.strictEqual(metaUpdateSuccess, false);
  });
});
