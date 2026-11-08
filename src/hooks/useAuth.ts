import { useState, useEffect, useCallback } from 'react';
import {
  signInAnonymously,
  onAuthStateChanged,
  signOut,
  deleteUser,
  linkWithPopup,
  signInWithPopup,
  GoogleAuthProvider,
  TwitterAuthProvider,
  type User,
  type AuthError,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../lib/firebase.ts';
import { markAccountDeletedInFirestore } from '../lib/firestoreSync.ts';

export type AuthProviderType = 'anonymous' | 'google.com' | 'twitter.com' | 'offline';

export interface AppUser {
  uid: string;
  isAnonymous: boolean;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  providerId: AuthProviderType;
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

function mapFirebaseUser(user: User): AppUser {
  let providerId: AuthProviderType = 'anonymous';
  if (!user.isAnonymous && user.providerData.length > 0) {
    const rawProvider = user.providerData[0].providerId;
    if (rawProvider.includes('google')) providerId = 'google.com';
    else if (rawProvider.includes('twitter')) providerId = 'twitter.com';
  }

  return {
    uid: user.uid,
    isAnonymous: user.isAnonymous,
    displayName: user.displayName || (user.isAnonymous ? 'ゲスト馬主' : '馬主'),
    email: user.email,
    photoURL: user.photoURL,
    providerId,
  };
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
    const provider = new GoogleAuthProvider();

    try {
      if (rawFirebaseUser && rawFirebaseUser.isAnonymous) {
        // 匿名ユーザーの場合はデータを保持したままアカウント昇格
        const result = await linkWithPopup(rawFirebaseUser, provider);
        setRawFirebaseUser(result.user);
        setUser(mapFirebaseUser(result.user));
      } else {
        // 通常の新規ログインまたは再ログイン
        const result = await signInWithPopup(auth, provider);
        setRawFirebaseUser(result.user);
        setUser(mapFirebaseUser(result.user));
      }
    } catch (err: unknown) {
      const error = err as AuthError;
      if (error.code === 'auth/credential-already-in-use') {
        // すでに別アカウントで使用済みの場合は通常のログインを促す
        try {
          const result = await signInWithPopup(auth, provider);
          setRawFirebaseUser(result.user);
          setUser(mapFirebaseUser(result.user));
        } catch (fallbackErr: unknown) {
          const fbErr = fallbackErr as AuthError;
          setAuthError(fbErr.message || 'Googleログインに失敗しました。');
        }
      } else if (error.code !== 'auth/popup-closed-by-user') {
        setAuthError(error.message || 'Googleログインに失敗しました。');
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
      if (rawFirebaseUser && rawFirebaseUser.isAnonymous) {
        // 匿名ユーザーの場合はデータを保持したままアカウント昇格
        const result = await linkWithPopup(rawFirebaseUser, provider);
        setRawFirebaseUser(result.user);
        setUser(mapFirebaseUser(result.user));
      } else {
        const result = await signInWithPopup(auth, provider);
        setRawFirebaseUser(result.user);
        setUser(mapFirebaseUser(result.user));
      }
    } catch (err: unknown) {
      const error = err as AuthError;
      if (error.code === 'auth/credential-already-in-use') {
        try {
          const result = await signInWithPopup(auth, provider);
          setRawFirebaseUser(result.user);
          setUser(mapFirebaseUser(result.user));
        } catch (fallbackErr: unknown) {
          const fbErr = fallbackErr as AuthError;
          setAuthError(fbErr.message || 'X (Twitter) ログインに失敗しました。');
        }
      } else if (error.code !== 'auth/popup-closed-by-user') {
        setAuthError(error.message || 'X (Twitter) ログインに失敗しました。');
      }
    } finally {
      setIsLoading(false);
    }
  }, [rawFirebaseUser]);

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
    signOut: handleSignOut,
    deleteAccount,
    clearError: () => setAuthError(null),
  };
}
