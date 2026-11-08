import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  isAdminUser,
  formatTimestamp,
  parseUserDocumentToAdminSummary,
  fetchAllUsersForAdmin,
  restoreUserAccountByAdmin,
  MOCK_ADMIN_USERS,
} from '../src/lib/adminService.ts';

describe('Admin authentication & authorization (isAdminUser)', () => {
  test('returns true in dev/localhost environment', () => {
    // isDevOrLocalhost() returns true in Node test environment
    assert.equal(isAdminUser({ uid: 'any-user' }), true);
    assert.equal(isAdminUser(null), true);
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

describe('Admin service data fetch and restore resilience', () => {
  test('fetchAllUsersForAdmin returns array (mock or firestore) without crashing', async () => {
    const users = await fetchAllUsersForAdmin();
    assert.ok(Array.isArray(users));
    assert.ok(users.length > 0);
    // Verifies mock users are populated in test environment
    assert.equal(users[0].uid, MOCK_ADMIN_USERS[0].uid);
  });

  test('restoreUserAccountByAdmin safely handles invocation', async () => {
    const result = await restoreUserAccountByAdmin('sample-uid');
    assert.equal(typeof result, 'boolean');
  });
});
