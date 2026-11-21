import { useState, useEffect, useCallback } from 'react';
import {
  signInAnonymously,
  onAuthStateChanged,
  signOut,
  deleteUser,
  linkWithPopup,
  unlink,
  signInWithPopup,
  signInWithCredential,
  GoogleAuthProvider,
  TwitterAuthProvider,
  type User,
  type AuthError,
  type OAuthCredential,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../lib/firebase.ts';
import {
  markAccountDeletedInFirestore,
  updateUserAuthMetaInFirestore,
} from '../lib/firestoreSync.ts';

export type AuthProviderType = 'anonymous' | 'google.com' | 'twitter.com' | 'offline';

export interface AppUser {
  uid: string;
  isAnonymous: boolean;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  providerId: AuthProviderType;
}

export interface FirebaseUserLike {
  uid: string;
  isAnonymous: boolean;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  providerData: Array<{
    providerId: string;
    displayName?: string | null;
    email?: string | null;
    photoURL?: string | null;
  }>;
}

const LOCAL_GUEST_UID_KEY = 'turftalk_local_guest_uid_v1';

function getOrCreateLocalGuestUid(): string {
  if (typeof window === 'undefined') return 'mock-guest-uid';
  let uid = localStorage.getItem(LOCAL_GUEST_UID_KEY);
  if (!uid) {
    uid = `guest_${Math.random().toString(36).substring(2, 10)}`;
    localStorage.setItem(LOCAL_GUEST_UID_KEY, uid);
  }
  return uid;
}

/**
 * Firebase Auth ユーザーが未連携（匿名認証または全プロバイダ解除後）かどうかを判定する。
 * 一度プロバイダ連携した後に unlink で全プロバイダを解除した場合、
 * user.isAnonymous が false のまま providerData が空になるケースにも対応する。
 */
export function isUnlinkedOrAnonymousUser(
  user: Pick<FirebaseUserLike, 'isAnonymous' | 'providerData'>
): boolean {
  if (user.isAnonymous) return true;
  const hasSocialProvider = user.providerData.some(
    (p) => p.providerId.includes('google') || p.providerId.includes('twitter')
  );
  return !hasSocialProvider;
}

export function mapFirebaseUser(user: FirebaseUserLike): AppUser {
  const isEffectivelyAnonymous = isUnlinkedOrAnonymousUser(user);
  let providerId: AuthProviderType = 'anonymous';
  let linkedProfile: FirebaseUserLike['providerData'][number] | undefined;

  if (!isEffectivelyAnonymous) {
    linkedProfile = user.providerData.find(
      (p) => p.providerId.includes('google') || p.providerId.includes('twitter')
    );
    if (linkedProfile) {
      if (linkedProfile.providerId.includes('google')) providerId = 'google.com';
      else if (linkedProfile.providerId.includes('twitter')) providerId = 'twitter.com';
    }
  }

  return {
    uid: user.uid,
    isAnonymous: isEffectivelyAnonymous,
    displayName: isEffectivelyAnonymous
      ? 'ゲスト馬主'
      : linkedProfile?.displayName || user.displayName || '馬主',
    email: isEffectivelyAnonymous ? null : linkedProfile?.email || user.email,
    photoURL: isEffectivelyAnonymous ? null : linkedProfile?.photoURL || user.photoURL,
    providerId,
  };
}

/**
 * Google 認証プロバイダを生成する。
 * 連携解除直後の再連携時にキャッシュされたセッションが自動再利用されて
 * auth/credential-already-in-use が発生するのを防ぐため、常にアカウント選択画面を表示する。
 */
export function createGoogleAuthProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return provider;
}

/**
 * auth/credential-already-in-use エラー等から既存の OAuthCredential を安全に抽出する。
 * 2回目の signInWithPopup を呼ぶとユーザージェスチャー失効により auth/popup-blocked になるため、
 * 抽出したクレデンシャルで signInWithCredential を行うために使用する。
 */
export function extractCredentialFromAuthError(
  error: AuthError,
  providerType: 'google.com' | 'twitter.com'
): OAuthCredential | null {
  try {
    const extracted =
      providerType === 'google.com'
        ? GoogleAuthProvider.credentialFromError(error)
        : TwitterAuthProvider.credentialFromError(error);
    if (extracted) return extracted;
  } catch {
    // Firebase Error インスタンスでないモック等の場合はフォールバックへ進む
  }

  const customError = error as AuthError & { credential?: OAuthCredential | null };
  return customError?.credential ?? null;
}

/**
 * Firebase Auth エラーをユーザー向けの日本語メッセージに変換する。
 * ユーザーが自らポップアップを閉じた場合など、エラー表示が不要なケースでは null を返す。
 */
export function formatAuthErrorMessage(
  error: { code?: string; message?: string } | null | undefined,
  fallbackMessage: string
): string | null {
  const code = error?.code;
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return null;
  }
  if (code === 'auth/popup-blocked') {
    return 'ブラウザにより認証ポップアップがブロックされました。ポップアップブロックを解除してから再度お試しください。';
  }
  if (code === 'auth/credential-already-in-use') {
    return 'このアカウントは既に別の馬主データと連携されています。再度ボタンを押してログインしてください。';
  }
  if (code === 'auth/network-request-failed') {
    return '通信エラーが発生しました。ネットワーク接続を確認してから再度お試しください。';
  }
  if (code === 'auth/requires-recent-login') {
    return 'セキュリティ保護のため、一度ログインし直してから再度お試しください。';
  }
  return error?.message || fallbackMessage;
}

/**
 * unlink 完了後に Firebase User インスタンスのプロバイダ状態および ID トークンを最新化する。
 */
export async function refreshUnlinkedUserState(user: {
  reload?: () => Promise<void>;
  getIdToken?: (forceRefresh?: boolean) => Promise<string>;
}): Promise<void> {
  try {
    if (typeof user.reload === 'function') {
      await user.reload();
    }
    if (typeof user.getIdToken === 'function') {
      await user.getIdToken(true);
    }
  } catch (err) {
    console.warn('[useAuth] Failed to refresh user token after unlink:', err);
  }
}

export function useAuth() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [rawFirebaseUser, setRawFirebaseUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Firebase 未設定（ローカル開発・未登録状態）の場合はオフラインゲストとして安全に起動
    if (!isFirebaseConfigured() || !auth) {
      const localUid = getOrCreateLocalGuestUid();
      setUser({
        uid: localUid,
        isAnonymous: true,
        displayName: 'ゲスト馬主 (オフライン)',
        email: null,
        photoURL: null,
        providerId: 'offline',
      });
      setIsLoading(false);
      return;
    }

    const currentAuth = auth;

    const unsubscribe = onAuthStateChanged(currentAuth, async (firebaseUser) => {
      if (firebaseUser) {
        setRawFirebaseUser(firebaseUser);
        setUser(mapFirebaseUser(firebaseUser));
        setIsLoading(false);
      } else {
        // 未ログイン時は自動的に匿名ユーザーとしてサインイン（参入障壁ゼロ）
        try {
          const cred = await signInAnonymously(currentAuth);
          setRawFirebaseUser(cred.user);
          setUser(mapFirebaseUser(cred.user));
        } catch (error) {
          console.warn('[useAuth] Anonymous sign-in failed, falling back to local guest:', error);
          const localUid = getOrCreateLocalGuestUid();
          setUser({
            uid: localUid,
            isAnonymous: true,
            displayName: 'ゲスト馬主',
            email: null,
            photoURL: null,
            providerId: 'anonymous',
          });
        } finally {
          setIsLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  /**
   * Google アカウントでログイン / アカウント昇格
   */
  const loginWithGoogle = useCallback(async () => {
    if (!auth) {
      setAuthError('Firebaseが未設定です。設定ガイドを参照してください。');
      return;
    }

    setIsLoading(true);
    setAuthError(null);
    const provider = createGoogleAuthProvider();

    try {
      if (rawFirebaseUser && isUnlinkedOrAnonymousUser(rawFirebaseUser)) {
        // 匿名ユーザーまたは連携解除済みユーザーの場合はデータを保持したままアカウント連携（昇格）
        const result = await linkWithPopup(rawFirebaseUser, provider);
        const mapped = mapFirebaseUser(result.user);
        setRawFirebaseUser(result.user);
        setUser(mapped);
        await updateUserAuthMetaInFirestore(result.user.uid, {
          isAnonymous: mapped.isAnonymous,
          providerId: mapped.providerId,
        });
      } else {
        // 通常の新規ログインまたは再ログイン
        const result = await signInWithPopup(auth, provider);
        const mapped = mapFirebaseUser(result.user);
        setRawFirebaseUser(result.user);
        setUser(mapped);
        await updateUserAuthMetaInFirestore(result.user.uid, {
          isAnonymous: mapped.isAnonymous,
          providerId: mapped.providerId,
        });
      }
    } catch (err: unknown) {
      const error = err as AuthError;
      if (error.code === 'auth/credential-already-in-use') {
        // 2回目の signInWithPopup を呼ぶとユーザージェスチャー失効で auth/popup-blocked になるため、
        // 1回目のポップアップで取得済みのクレデンシャルを用いて signInWithCredential を実行する
        const credential = extractCredentialFromAuthError(error, 'google.com');
        if (credential) {
          try {
            const result = await signInWithCredential(auth, credential);
            const mapped = mapFirebaseUser(result.user);
            setRawFirebaseUser(result.user);
            setUser(mapped);
            await updateUserAuthMetaInFirestore(result.user.uid, {
              isAnonymous: mapped.isAnonymous,
              providerId: mapped.providerId,
            });
          } catch (fallbackErr: unknown) {
            const fbErr = fallbackErr as AuthError;
            setAuthError(formatAuthErrorMessage(fbErr, 'Googleログインに失敗しました。'));
          }
        } else {
          setAuthError(formatAuthErrorMessage(error, 'Googleログインに失敗しました。'));
        }
      } else {
        setAuthError(formatAuthErrorMessage(error, 'Googleログインに失敗しました。'));
      }
    } finally {
      setIsLoading(false);
    }
  }, [rawFirebaseUser]);

  /**
   * X (Twitter) アカウントでログイン / アカウント昇格
   */
  const loginWithTwitter = useCallback(async () => {
    if (!auth) {
      setAuthError('Firebaseが未設定です。設定ガイドを参照してください。');
      return;
    }

    setIsLoading(true);
    setAuthError(null);
    const provider = new TwitterAuthProvider();

    try {
      if (rawFirebaseUser && isUnlinkedOrAnonymousUser(rawFirebaseUser)) {
        // 匿名ユーザーまたは連携解除済みユーザーの場合はデータを保持したままアカウント連携（昇格）
        const result = await linkWithPopup(rawFirebaseUser, provider);
        const mapped = mapFirebaseUser(result.user);
        setRawFirebaseUser(result.user);
        setUser(mapped);
        await updateUserAuthMetaInFirestore(result.user.uid, {
          isAnonymous: mapped.isAnonymous,
          providerId: mapped.providerId,
        });
      } else {
        const result = await signInWithPopup(auth, provider);
        const mapped = mapFirebaseUser(result.user);
        setRawFirebaseUser(result.user);
        setUser(mapped);
        await updateUserAuthMetaInFirestore(result.user.uid, {
          isAnonymous: mapped.isAnonymous,
          providerId: mapped.providerId,
        });
      }
    } catch (err: unknown) {
      const error = err as AuthError;
      if (error.code === 'auth/credential-already-in-use') {
        // 2回目の signInWithPopup ではなく、取得済みクレデンシャルによる signInWithCredential で復帰する
        const credential = extractCredentialFromAuthError(error, 'twitter.com');
        if (credential) {
          try {
            const result = await signInWithCredential(auth, credential);
            const mapped = mapFirebaseUser(result.user);
            setRawFirebaseUser(result.user);
            setUser(mapped);
            await updateUserAuthMetaInFirestore(result.user.uid, {
              isAnonymous: mapped.isAnonymous,
              providerId: mapped.providerId,
            });
          } catch (fallbackErr: unknown) {
            const fbErr = fallbackErr as AuthError;
            setAuthError(formatAuthErrorMessage(fbErr, 'X (Twitter) ログインに失敗しました。'));
          }
        } else {
          setAuthError(formatAuthErrorMessage(error, 'X (Twitter) ログインに失敗しました。'));
        }
      } else {
        setAuthError(formatAuthErrorMessage(error, 'X (Twitter) ログインに失敗しました。'));
      }
    } finally {
      setIsLoading(false);
    }
  }, [rawFirebaseUser]);

  /**
   * アカウント連携の解除（アンリンク）
   * 現在の UID および育成データ（愛馬・学習進捗）を維持したまま、未連携（ゲスト）状態に戻す
   */
  const unlinkAccount = useCallback(async () => {
    if (!auth || !rawFirebaseUser) return;

    setIsLoading(true);
    setAuthError(null);

    try {
      const targetProviders = rawFirebaseUser.providerData
        .map((p) => p.providerId)
        .filter((id) => id.includes('google') || id.includes('twitter'));

      if (
        targetProviders.length === 0 &&
        user &&
        !user.isAnonymous &&
        user.providerId !== 'anonymous' &&
        user.providerId !== 'offline'
      ) {
        targetProviders.push(user.providerId);
      }

      let updatedUser: User = rawFirebaseUser;
      for (const providerId of targetProviders) {
        updatedUser = await unlink(updatedUser, providerId);
      }

      // クライアント側のプロバイダ状態およびIDトークンを最新化し、直後の再連携時の状態競合を防止する
      await refreshUnlinkedUserState(updatedUser);
      const currentUser = auth.currentUser ?? updatedUser;

      const mapped = mapFirebaseUser(currentUser);
      setRawFirebaseUser(currentUser);
      setUser(mapped);

      await updateUserAuthMetaInFirestore(currentUser.uid, {
        isAnonymous: true,
        providerId: 'anonymous',
      });
    } catch (err: unknown) {
      const error = err as AuthError;
      if (error.code === 'auth/requires-recent-login') {
        setAuthError('セキュリティ保護のため、一度ログインし直してから連携解除を行ってください。');
      } else {
        setAuthError(error.message || 'アカウント連携の解除に失敗しました。');
      }
    } finally {
      setIsLoading(false);
    }
  }, [rawFirebaseUser, user]);

  /**
   * ログアウト
   */
  const handleSignOut = useCallback(async () => {
    if (!auth) return;
    setIsLoading(true);
    setAuthError(null);
    try {
      await signOut(auth);
      // ログアウト後は自動的に新規の匿名ユーザーに切り替わる
    } catch (err: unknown) {
      const error = err as AuthError;
      setAuthError(error.message || 'ログアウトに失敗しました。');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * アカウント削除・退会処理
   */
  const deleteAccount = useCallback(async () => {
    setIsLoading(true);
    setAuthError(null);

    try {
      if (rawFirebaseUser) {
        // Firestore 側を論理削除（Soft Delete）として記録
        await markAccountDeletedInFirestore(rawFirebaseUser.uid);
        await deleteUser(rawFirebaseUser);
      }
      // ローカルの全進捗・セッションデータを初期化
      if (typeof window !== 'undefined') {
        localStorage.removeItem(LOCAL_GUEST_UID_KEY);
        localStorage.removeItem('turftalk_user_progress_v1');
      }

      // 退会後は自動的に新しいゲストとして再初期化
      if (auth && isFirebaseConfigured()) {
        const cred = await signInAnonymously(auth);
        setRawFirebaseUser(cred.user);
        setUser(mapFirebaseUser(cred.user));
      } else {
        const localUid = getOrCreateLocalGuestUid();
        setUser({
          uid: localUid,
          isAnonymous: true,
          displayName: 'ゲスト馬主',
          email: null,
          photoURL: null,
          providerId: 'anonymous',
        });
      }
    } catch (err: unknown) {
      const error = err as AuthError;
      if (error.code === 'auth/requires-recent-login') {
        setAuthError('セキュリティ保護のため、一度ログインし直してから再度退会手続きを行ってください。');
      } else {
        setAuthError(error.message || 'アカウントの削除に失敗しました。');
      }
    } finally {
      setIsLoading(false);
    }
  }, [rawFirebaseUser]);

  return {
    user,
    rawFirebaseUser,
    isLoading,
    authError,
    loginWithGoogle,
    loginWithTwitter,
    unlinkAccount,
    signOut: handleSignOut,
    deleteAccount,
    clearError: () => setAuthError(null),
  };
}
