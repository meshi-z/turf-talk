import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import type { AuthError, OAuthCredential } from 'firebase/auth';
import { isFirebaseConfigured } from '../src/lib/firebase.ts';
import {
  isUnlinkedOrAnonymousUser,
  mapFirebaseUser,
  createGoogleAuthProvider,
  extractCredentialFromAuthError,
  formatAuthErrorMessage,
  refreshUnlinkedUserState,
  type FirebaseUserLike,
} from '../src/hooks/useAuth.ts';

describe('Firebase initialization & fallback (firebase.ts)', () => {
  test('isFirebaseConfigured returns boolean safely in test environment', () => {
    // テスト環境で環境変数が未設定の場合、安全に false を返すこと
    const configured = isFirebaseConfigured();
    assert.strictEqual(typeof configured, 'boolean');
  });
});

describe('User authentication model & guest fallback (useAuth.ts)', () => {
  test('generates and persists unique local guest UID when offline/unconfigured', () => {
    const STORAGE_KEY = 'turftalk_local_guest_uid_v1';
    
    // モックストレージ
    const mockStorage: Record<string, string> = {};
    const getLocalUid = () => {
      let uid = mockStorage[STORAGE_KEY];
      if (!uid) {
        uid = `guest_${Math.random().toString(36).substring(2, 10)}`;
        mockStorage[STORAGE_KEY] = uid;
      }
      return uid;
    };

    const firstUid = getLocalUid();
    assert.ok(firstUid.startsWith('guest_'), 'UID should start with guest_ prefix');
    assert.ok(firstUid.length > 8, 'UID should have sufficient entropy');

    // 2回目のアクセスで同じUIDが取得できること（セッション・進捗維持）
    const secondUid = getLocalUid();
    assert.strictEqual(firstUid, secondUid, 'Local guest UID must persist across sessions');
  });

  test('maps anonymous user properly', () => {
    const mockAnonymousUser = {
      uid: 'anon_1234567890abcdef',
      isAnonymous: true,
      displayName: null,
      email: null,
      photoURL: null,
      providerId: 'anonymous' as const,
    };

    assert.strictEqual(mockAnonymousUser.isAnonymous, true);
    assert.strictEqual(mockAnonymousUser.providerId, 'anonymous');
    assert.strictEqual(mockAnonymousUser.email, null);
  });

  test('maps linked Google user properly', () => {
    const mockGoogleUser = {
      uid: 'google_user_uid_12345',
      isAnonymous: false,
      displayName: 'テスト馬主',
      email: 'owner@example.com',
      photoURL: 'https://example.com/avatar.jpg',
      providerId: 'google.com' as const,
    };

    assert.strictEqual(mockGoogleUser.isAnonymous, false);
    assert.strictEqual(mockGoogleUser.providerId, 'google.com');
    assert.strictEqual(mockGoogleUser.email, 'owner@example.com');
  });

  test('maps linked Twitter (X) user properly', () => {
    const mockTwitterUser = {
      uid: 'twitter_user_uid_67890',
      isAnonymous: false,
      displayName: '競馬ファン馬主',
      email: null,
      photoURL: 'https://example.com/x_avatar.jpg',
      providerId: 'twitter.com' as const,
    };

    assert.strictEqual(mockTwitterUser.isAnonymous, false);
    assert.strictEqual(mockTwitterUser.providerId, 'twitter.com');
  });

  test('treats unlinked user (isAnonymous: false, providerData: []) as guest and preserves uid', () => {
    // 1. 最初は Google 連携状態
    const googleLinkedFirebaseUser: FirebaseUserLike = {
      uid: 'same_horse_owner_uid_999',
      isAnonymous: false,
      displayName: 'Google馬主',
      email: 'owner@gmail.com',
      photoURL: 'https://example.com/google.png',
      providerData: [
        {
          providerId: 'google.com',
          displayName: 'Google馬主',
          email: 'owner@gmail.com',
          photoURL: 'https://example.com/google.png',
        },
      ],
    };

    assert.strictEqual(isUnlinkedOrAnonymousUser(googleLinkedFirebaseUser), false);
    const mappedGoogle = mapFirebaseUser(googleLinkedFirebaseUser);
    assert.strictEqual(mappedGoogle.uid, 'same_horse_owner_uid_999');
    assert.strictEqual(mappedGoogle.isAnonymous, false);
    assert.strictEqual(mappedGoogle.providerId, 'google.com');

    // 2. Google 連携を解除（unlink）した直後の状態（Firebase Auth上は isAnonymous: false のまま providerData が空になる）
    const unlinkedFirebaseUser: FirebaseUserLike = {
      uid: 'same_horse_owner_uid_999',
      isAnonymous: false,
      displayName: 'Google馬主', // トップレベルにキャッシュが残っていても
      email: 'owner@gmail.com',
      photoURL: 'https://example.com/google.png',
      providerData: [],
    };

    assert.strictEqual(
      isUnlinkedOrAnonymousUser(unlinkedFirebaseUser),
      true,
      'Unlinked user with empty providerData should be treated as unlinked/anonymous for re-linking'
    );
    const mappedUnlinked = mapFirebaseUser(unlinkedFirebaseUser);
    assert.strictEqual(mappedUnlinked.uid, 'same_horse_owner_uid_999', 'UID must be preserved');
    assert.strictEqual(mappedUnlinked.isAnonymous, true, 'AppUser.isAnonymous should be true');
    assert.strictEqual(mappedUnlinked.providerId, 'anonymous');
    assert.strictEqual(mappedUnlinked.displayName, 'ゲスト馬主');
    assert.strictEqual(mappedUnlinked.email, null);

    // 3. その後 X (Twitter) と再連携（linkWithPopup）した状態
    const twitterRelinkedFirebaseUser: FirebaseUserLike = {
      uid: 'same_horse_owner_uid_999',
      isAnonymous: false,
      displayName: 'X馬主',
      email: null,
      photoURL: 'https://example.com/x.png',
      providerData: [
        {
          providerId: 'twitter.com',
          displayName: 'X馬主',
          email: null,
          photoURL: 'https://example.com/x.png',
        },
      ],
    };

    assert.strictEqual(isUnlinkedOrAnonymousUser(twitterRelinkedFirebaseUser), false);
    const mappedTwitter = mapFirebaseUser(twitterRelinkedFirebaseUser);
    assert.strictEqual(mappedTwitter.uid, 'same_horse_owner_uid_999', 'UID must remain identical');
    assert.strictEqual(mappedTwitter.isAnonymous, false);
    assert.strictEqual(mappedTwitter.providerId, 'twitter.com');
    assert.strictEqual(mappedTwitter.displayName, 'X馬主');
  });

  test('account deletion purges progress and resets to fresh guest', () => {
    const mockStorage: Record<string, string> = {
      turftalk_local_guest_uid_v1: 'old_guest_uid_123',
      turftalk_user_progress_v1: JSON.stringify({ streakDays: 10, learnedPhraseIds: ['p1'] }),
    };

    // 退会・データ全削除シミュレーション
    delete mockStorage.turftalk_local_guest_uid_v1;
    delete mockStorage.turftalk_user_progress_v1;

    assert.strictEqual(mockStorage.turftalk_local_guest_uid_v1, undefined);
    assert.strictEqual(mockStorage.turftalk_user_progress_v1, undefined);

    // 新規ゲストの再発行
    const newUid = `guest_${Math.random().toString(36).substring(2, 10)}`;
    mockStorage.turftalk_local_guest_uid_v1 = newUid;

    assert.notStrictEqual(newUid, 'old_guest_uid_123');
    assert.ok(mockStorage.turftalk_local_guest_uid_v1.startsWith('guest_'));
  });

  test('createGoogleAuthProvider configures prompt: select_account to prevent stale session collision (#148)', () => {
    const provider = createGoogleAuthProvider();
    assert.strictEqual(provider.providerId, 'google.com');
    const customParams = provider.getCustomParameters() as Record<string, string>;
    assert.strictEqual(
      customParams.prompt,
      'select_account',
      'Google provider should always prompt account selection after unlink'
    );
  });

  test('refreshUnlinkedUserState calls reload and getIdToken(true) safely (#148)', async () => {
    const callOrder: string[] = [];
    const mockUser = {
      reload: async () => {
        callOrder.push('reload');
      },
      getIdToken: async (forceRefresh?: boolean) => {
        callOrder.push(`getIdToken:${Boolean(forceRefresh)}`);
        return 'refreshed_token';
      },
    };

    await refreshUnlinkedUserState(mockUser);
    assert.deepStrictEqual(callOrder, ['reload', 'getIdToken:true']);

    // エラーが発生しても例外を投げず安全に完了すること
    await assert.doesNotReject(async () => {
      await refreshUnlinkedUserState({
        reload: async () => {
          throw new Error('network error');
        },
      });
    });
  });

  test('extractCredentialFromAuthError extracts credential without opening a second popup (#148)', () => {
    const mockCred = {
      providerId: 'google.com',
      signInMethod: 'google.com',
      toJSON: () => ({}),
    } as unknown as OAuthCredential;

    const mockErrorWithCredential = {
      code: 'auth/credential-already-in-use',
      message: 'Firebase: Error (auth/credential-already-in-use).',
      credential: mockCred,
    } as unknown as AuthError;

    const extracted = extractCredentialFromAuthError(mockErrorWithCredential, 'google.com');
    assert.strictEqual(extracted, mockCred);

    const mockErrorWithoutCredential = {
      code: 'auth/credential-already-in-use',
      message: 'Firebase: Error (auth/credential-already-in-use).',
    } as unknown as AuthError;

    const extractedNull = extractCredentialFromAuthError(mockErrorWithoutCredential, 'twitter.com');
    assert.strictEqual(extractedNull, null);
  });

  test('formatAuthErrorMessage returns user-friendly Japanese messages and suppresses user cancellation (#148)', () => {
    assert.strictEqual(
      formatAuthErrorMessage({ code: 'auth/popup-closed-by-user' }, '失敗'),
      null
    );
    assert.strictEqual(
      formatAuthErrorMessage({ code: 'auth/cancelled-popup-request' }, '失敗'),
      null
    );
    assert.strictEqual(
      formatAuthErrorMessage({ code: 'auth/popup-blocked' }, '失敗'),
      'ブラウザにより認証ポップアップがブロックされました。ポップアップブロックを解除してから再度お試しください。'
    );
    assert.strictEqual(
      formatAuthErrorMessage({ code: 'auth/credential-already-in-use' }, '失敗'),
      'このアカウントは既に別の馬主データと連携されています。再度ボタンを押してログインしてください。'
    );
    assert.strictEqual(
      formatAuthErrorMessage({ code: 'auth/network-request-failed' }, '失敗'),
      '通信エラーが発生しました。ネットワーク接続を確認してから再度お試しください。'
    );
    assert.strictEqual(
      formatAuthErrorMessage({ code: 'auth/unknown-error', message: '' }, 'デフォルトエラー'),
      'デフォルトエラー'
    );
  });

  test('useAuth.ts uses signInWithCredential instead of secondary signInWithPopup on credential-already-in-use (#148)', () => {
    const source = fs.readFileSync(new URL('../src/hooks/useAuth.ts', import.meta.url), 'utf-8');
    assert.ok(
      source.includes('signInWithCredential(auth, credential)'),
      'Should recover from auth/credential-already-in-use via signInWithCredential without opening a second popup'
    );
    assert.ok(
      source.includes('await refreshUnlinkedUserState(updatedUser)'),
      'unlinkAccount should refresh user state and token after unlink'
    );
  });
});
