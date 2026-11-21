import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateUserSummary,
  fetchUserProgressFromFirestore,
  saveUserProgressToFirestore,
  subscribeUserProgressFromFirestore,
  markAccountDeletedInFirestore,
  restoreAccountInFirestore,
  updateUserAuthMetaInFirestore,
  normalizeUserProgress,
  shouldSkipCloudSave,
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

    const unsubscribe = subscribeUserProgressFromFirestore('test_uid', () => {});
    assert.strictEqual(typeof unsubscribe, 'function');
    assert.doesNotThrow(() => unsubscribe());
  });
});

describe('Multi-device sync guard & cloud normalization (Issue #137)', () => {
  test('shouldSkipCloudSave blocks saves before initial sync or when state matches cloud snapshot', () => {
    // 1. 未ログイン / userId 未確定時はスキップ
    assert.strictEqual(
      shouldSkipCloudSave({
        userId: null,
        syncedUserId: null,
        currentSerialized: '{"horseName":"エー"}',
        lastSyncedSerialized: null,
      }),
      true
    );

    // 2. 初回クラウド同期完了前（syncedUserId !== userId）は古いローカルデータの上書きを防止するためスキップ
    assert.strictEqual(
      shouldSkipCloudSave({
        userId: 'user_123',
        syncedUserId: null,
        currentSerialized: '{"horseName":"エー"}',
        lastSyncedSerialized: null,
      }),
      true
    );

    // 3. 別アカウントへ切り替えた直後（syncedUserId が旧UIDのまま）もスキップ
    assert.strictEqual(
      shouldSkipCloudSave({
        userId: 'user_linked_456',
        syncedUserId: 'guest_123',
        currentSerialized: '{"horseName":"エー"}',
        lastSyncedSerialized: '{"horseName":"エー"}',
      }),
      true
    );

    // 4. クラウドから最新データ（「ビー」）を受信してローカル反映した直後は同一データ書き戻しをスキップ
    assert.strictEqual(
      shouldSkipCloudSave({
        userId: 'user_123',
        syncedUserId: 'user_123',
        currentSerialized: '{"horseName":"ビー","hasTrained":true}',
        lastSyncedSerialized: '{"horseName":"ビー","hasTrained":true}',
      }),
      true
    );

    // 5. 初回同期完了後にユーザーがローカルで新しい操作（調教完了等）を行った場合は保存を実行（false）
    assert.strictEqual(
      shouldSkipCloudSave({
        userId: 'user_123',
        syncedUserId: 'user_123',
        currentSerialized: '{"horseName":"ビー","hasTrained":true,"streakDays":2}',
        lastSyncedSerialized: '{"horseName":"ビー","hasTrained":true,"streakDays":1}',
      }),
      false
    );
  });

  test('normalizeUserProgress reconciles multi-device horse name and training lock state from cloud', () => {
    const today = '2026-11-15';

    // 端末Aの古い未調教ローカル状態（馬名「エー」、未調教）
    const deviceAStaleProgress = normalizeUserProgress(
      {
        lastTrainingDate: null,
        horseName: 'エー',
        completedToday: false,
        careerHorse: {
          generation: 1,
          name: 'エー',
          color: '鹿毛',
          routeId: 'classic-colt',
          currentWeek: 1,
          weight: 500,
          hasTrained: false,
          raceHistory: [],
          learnedPhraseIdsInCareer: [],
        },
      },
      undefined,
      today
    );
    assert.strictEqual(deviceAStaleProgress.careerHorse.name, 'エー');
    assert.strictEqual(deviceAStaleProgress.careerHorse.hasTrained, false);
    assert.strictEqual(deviceAStaleProgress.completedToday, false);

    // 端末Bで馬名を「ビー」に変更し、調教を完了して確定したクラウド状態
    const deviceBConfirmedCloudData: Partial<UserProgress> = {
      lastTrainingDate: today,
      streakDays: 1,
      condition: 'flat',
      horseName: 'ビー',
      horseWeight: 496,
      completedToday: true,
      learnedPhraseIds: ['p1', 'p2', 'p3'],
      todayPhraseIds: ['p1', 'p2', 'p3'],
      completedCoursesToday: ['uphill'],
      weekdayTrainingDays: 1,
      currentWeekMonday: '2026-11-09',
      careerHorse: {
        generation: 1,
        name: 'ビー',
        color: '栗毛',
        routeId: 'classic-colt',
        currentWeek: 1,
        weight: 496,
        hasTrained: true,
        raceHistory: [],
        learnedPhraseIdsInCareer: ['p1', 'p2', 'p3'],
      },
    };

    // 端末Aに戻った際（onSnapshot / visibilitychange）にクラウドデータを正規化・適用
    const syncedOnDeviceA = normalizeUserProgress(deviceBConfirmedCloudData, deviceAStaleProgress, today);

    assert.strictEqual(syncedOnDeviceA.horseName, 'ビー');
    assert.strictEqual(syncedOnDeviceA.careerHorse.name, 'ビー');
    assert.strictEqual(syncedOnDeviceA.careerHorse.color, '栗毛');
    assert.strictEqual(syncedOnDeviceA.careerHorse.hasTrained, true);
    assert.strictEqual(syncedOnDeviceA.completedToday, true);
    assert.deepStrictEqual(syncedOnDeviceA.completedCoursesToday, ['uphill']);
    assert.deepStrictEqual(syncedOnDeviceA.learnedPhraseIds, ['p1', 'p2', 'p3']);
  });
});
