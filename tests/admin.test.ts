import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  isAdminUser,
  formatTimestamp,
  parseUserDocumentToAdminSummary,
  calculateAdminInsights,
  getRouteLabel,
  fetchAllUsersForAdmin,
  restoreUserAccountByAdmin,
  fetchAllCloudPhrasesForAdmin,
  saveCloudPhraseByAdmin,
  toggleCloudPhrasePublishByAdmin,
  MOCK_ADMIN_USERS,
} from '../src/lib/adminService.ts';
import type { PhraseItem } from '../src/data/phrases.ts';

describe('Admin authentication & authorization (isAdminUser)', () => {
  test('returns true in dev/localhost environment', () => {
    assert.equal(isAdminUser({ uid: 'any-user' }), true);
    assert.equal(isAdminUser(null), true);
  });

  test('validates admin UID only via environment variable (no hardcoded UIDs)', () => {
    assert.equal(
      isAdminUser(
        { uid: 'env-configured-admin-01' },
        { bypassDevCheck: true, adminUidsEnv: 'env-configured-admin-01, env-configured-admin-02' }
      ),
      true
    );
    assert.equal(
      isAdminUser(
        { uid: 'general-user-uid-999' },
        { bypassDevCheck: true, adminUidsEnv: 'env-configured-admin-01' }
      ),
      false
    );
    // Without VITE_ADMIN_UIDS configured, returns false in production
    assert.equal(
      isAdminUser({ uid: 'any-uid' }, { bypassDevCheck: true, adminUidsEnv: '' }),
      false
    );
    assert.equal(isAdminUser(null, { bypassDevCheck: true }), false);
  });
});

describe('Timestamp formatter (formatTimestamp)', () => {
  test('formats Firestore Timestamp object with toDate() method', () => {
    const localDate = new Date(2026, 10, 8, 12, 0, 0);
    const mockTimestamp = {
      toDate: () => localDate,
    };
    const formatted = formatTimestamp(mockTimestamp);
    assert.ok(formatted.text.includes('2026-11-08'));
    assert.ok(formatted.ms > 0);
  });

  test('formats ISO date string or epoch milliseconds', () => {
    const fromStr = formatTimestamp('2026-10-15T12:00:00Z');
    assert.ok(fromStr.text.includes('2026-10-15'));

    const fromEpoch = formatTimestamp(1762600000000);
    assert.ok(fromEpoch.ms === 1762600000000);
  });

  test('returns fallback for null or invalid inputs', () => {
    assert.deepEqual(formatTimestamp(null), { text: '-', ms: 0 });
    assert.deepEqual(formatTimestamp(undefined), { text: '-', ms: 0 });
    assert.deepEqual(formatTimestamp('invalid-date-string'), { text: '-', ms: 0 });
  });
});

describe('User document parser (parseUserDocumentToAdminSummary)', () => {
  test('correctly parses complete UserDocument payload', () => {
    const rawDoc = {
      isAnonymous: false,
      providerId: 'google.com',
      learnedCount: 95,
      progressPercent: 79.2,
      streakDays: 21,
      carrotCount: 2,
      currentHorseName: 'ディープインパクト',
      currentHorseRoute: 'classic',
      currentHorseWeek: 3,
      totalRaceWins: 7,
      totalHallOfFameCount: 1,
      isDeleted: false,
      deletedAt: null,
      createdAt: '2026-10-01T00:00:00Z',
      lastActiveAt: '2026-11-08T18:00:00Z',
    };

    const parsed = parseUserDocumentToAdminSummary('user-12345', rawDoc);
    assert.equal(parsed.uid, 'user-12345');
    assert.equal(parsed.isAnonymous, false);
    assert.equal(parsed.providerId, 'google.com');
    assert.equal(parsed.currentHorseName, 'ディープインパクト');
    assert.equal(parsed.currentHorseRoute, 'classic');
    assert.equal(parsed.currentHorseWeek, 3);
    assert.equal(parsed.totalRaceWins, 7);
    assert.equal(parsed.streakDays, 21);
    assert.equal(parsed.carrotCount, 2);
    assert.equal(parsed.isDeleted, false);
    assert.equal(parsed.deletedAt, null);
    assert.ok(parsed.createdAtText.includes('2026-10-01'));
  });

  test('fills safe defaults for missing or partial payload', () => {
    const emptyDoc = {};
    const parsed = parseUserDocumentToAdminSummary('fallback-uid', emptyDoc);

    assert.equal(parsed.uid, 'fallback-uid');
    assert.equal(parsed.isAnonymous, false);
    assert.equal(parsed.providerId, 'anonymous');
    assert.equal(parsed.currentHorseName, '未設定');
    assert.equal(parsed.currentHorseRoute, 'classic');
    assert.equal(parsed.learnedCount, 0);
    assert.equal(parsed.progressPercent, 0);
    assert.equal(parsed.streakDays, 0);
    assert.equal(parsed.isDeleted, false);
  });

  test('retains soft delete flag and timestamp accurately', () => {
    const deletedDoc = {
      isDeleted: true,
      deletedAt: '2026-11-07 19:30',
    };
    const parsed = parseUserDocumentToAdminSummary('deleted-uid', deletedDoc);
    assert.equal(parsed.isDeleted, true);
    assert.equal(parsed.deletedAt, '2026-11-07 19:30');
  });
});

describe('Admin insights aggregation (calculateAdminInsights & getRouteLabel)', () => {
  test('computes distributions, depletion rate, and 15% alert accurately', () => {
    const insights = calculateAdminInsights(MOCK_ADMIN_USERS, 120);

    assert.equal(insights.totalUsers, 4);
    assert.equal(insights.activeUsers, 3);
    assert.equal(insights.deletedUsers, 1);
    assert.equal(insights.linkedUsers, 3);
    assert.equal(insights.ssoLinkRatePercent, 75);

    // demo-user-001-admin has learnedCount = 118 (remaining 2 <= 10) -> 1 out of 3 active users = 33.3%
    assert.equal(insights.depletedUserCount, 1);
    assert.equal(insights.depletionRatePercent, 33.3);
    assert.equal(insights.needsNewContentPack, true);

    assert.equal(insights.progressDistribution.length, 5);
    assert.equal(insights.weekDistribution.length, 4);
    assert.equal(insights.providerDistribution.length, 3);
    assert.equal(insights.streakDistribution.length, 4);
    assert.ok(insights.routeDistribution.length >= 2);
  });

  test('handles empty user list safely without division by zero', () => {
    const emptyInsights = calculateAdminInsights([], 120);
    assert.equal(emptyInsights.totalUsers, 0);
    assert.equal(emptyInsights.avgProgressPercent, 0);
    assert.equal(emptyInsights.depletionRatePercent, 0);
    assert.equal(emptyInsights.needsNewContentPack, false);
  });

  test('maps route IDs to readable Japanese labels', () => {
    assert.equal(getRouteLabel('classic'), 'クラシック路線');
    assert.equal(getRouteLabel('sprint'), '古馬短距離（スプリント）');
    assert.equal(getRouteLabel('custom-route'), 'custom-route');
  });
});

describe('Admin service data fetch, restore, and cloud phrase management', () => {
  test('fetchAllUsersForAdmin returns array (mock or firestore) without crashing', async () => {
    const users = await fetchAllUsersForAdmin();
    assert.ok(Array.isArray(users));
    assert.ok(users.length > 0);
    assert.equal(users[0].uid, MOCK_ADMIN_USERS[0].uid);
  });

  test('restoreUserAccountByAdmin safely handles invocation', async () => {
    const result = await restoreUserAccountByAdmin('sample-uid');
    assert.equal(typeof result, 'boolean');
  });

  test('saveCloudPhraseByAdmin validates phrase schema and rejects invalid input', async () => {
    const invalidPhrase = {
      id: '',
      situation: 'test',
      phrase: '',
      explanation: 'test',
      category: 'feel',
      level: 'beginner',
      options: [],
    } as unknown as PhraseItem;

    const failRes = await saveCloudPhraseByAdmin(invalidPhrase, true);
    assert.equal(failRes.ok, false);
    assert.ok(failRes.error);

    const validPhrase: PhraseItem = {
      id: 'phrase-admin-test-999',
      situation: 'レース後の騎手インタビュー',
      phrase: 'He quickened up smartly in the final furlong.',
      literalTranslation: '残り1ハロンで鮮やかに加速した',
      explanation: 'quicken up は勝負どころで鋭く脚を伸ばす定番表現です。',
      category: 'reaction',
      level: 'intermediate',
      type: 'phrase',
      options: [
        { id: 'opt-1', text: '残り200mで鮮やかに切れ味を発揮して伸びた', isCorrect: true },
        { id: 'opt-2', text: '残り200mで脚色が鈍り失速した', isCorrect: false },
        { id: 'opt-3', text: '道中で掛かってしまい折り合いを欠いた', isCorrect: false },
        { id: 'opt-4', text: 'ゲート内で立ち遅れて後方からになった', isCorrect: false },
      ],
    };

    const okRes = await saveCloudPhraseByAdmin(validPhrase, true);
    assert.equal(okRes.ok, true);

    const list = await fetchAllCloudPhrasesForAdmin();
    assert.ok(Array.isArray(list));

    const toggleRes = await toggleCloudPhrasePublishByAdmin('', false);
    assert.equal(toggleRes, false);
  });
});
