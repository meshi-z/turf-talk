import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase.ts';
import type { UserProgress } from '../types/index.ts';

export interface UserSummaryFields {
  learnedCount: number;
  progressPercent: number;
  streakDays: number;
  carrotCount: number;
  currentHorseName: string;
  currentHorseRoute: string;
  currentHorseWeek: number;
  totalRaceWins: number;
  totalHallOfFameCount: number;
}

export interface UserDocument extends UserSummaryFields {
  uid: string;
  isAnonymous: boolean;
  providerId: string;
  createdAt: unknown;
  updatedAt: unknown;
  lastActiveAt: unknown;
  isDeleted: boolean;
  deletedAt: string | null;
  progressData: UserProgress;
}

const TOTAL_QUESTION_COUNT = 120; // 坂路60 + ウッドチップ60

/**
 * UserProgress から管理者検索・ソート用のサマリー数値を算出する
 */
export function calculateUserSummary(progress: UserProgress): UserSummaryFields {
  const learnedCount = Array.isArray(progress.learnedPhraseIds)
    ? progress.learnedPhraseIds.length
    : 0;

  const progressPercent = Math.min(
    100,
    Math.round((learnedCount / TOTAL_QUESTION_COUNT) * 1000) / 10
  );

  const careerHorse = progress.careerHorse;
  const raceHistory = careerHorse?.raceHistory || [];
  const currentWins = raceHistory.filter((r) => r.placementText === '1着' || r.score === 5).length;
  const hallOfFame = progress.hallOfFame || [];
  const hallOfFameWins = hallOfFame.reduce((acc, h) => acc + (typeof h.wins === 'number' ? h.wins : 0), 0);
  const totalRaceWins = currentWins + hallOfFameWins;

  return {
    learnedCount,
    progressPercent,
    streakDays: typeof progress.streakDays === 'number' ? progress.streakDays : 0,
    carrotCount: typeof progress.carrotCount === 'number' ? progress.carrotCount : 1,
    currentHorseName: careerHorse?.name || progress.horseName || 'ターフスター',
    currentHorseRoute: careerHorse?.routeId || 'classic',
    currentHorseWeek: careerHorse?.currentWeek || 1,
    totalRaceWins,
    totalHallOfFameCount: hallOfFame.length,
  };
}

/**
 * Firestore からユーザーの進捗データを取得する
 */
export async function fetchUserProgressFromFirestore(
  uid: string
): Promise<{ progress: UserProgress | null; isDeleted: boolean }> {
  if (!isFirebaseConfigured() || !db || !uid) {
    return { progress: null, isDeleted: false };
  }

  try {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);

    if (!snap.exists()) {
      return { progress: null, isDeleted: false };
    }

    const data = snap.data() as Partial<UserDocument>;
    if (data.isDeleted) {
      return { progress: null, isDeleted: true };
    }

    return { progress: data.progressData || null, isDeleted: false };
  } catch (error) {
    console.warn('[firestoreSync] Failed to fetch user progress:', error);
    return { progress: null, isDeleted: false };
  }
}

/**
 * ユーザーの進捗データを Firestore に保存（サマリー値自動更新）する
 */
export async function saveUserProgressToFirestore(
  uid: string,
  progress: UserProgress,
  userMeta?: { isAnonymous?: boolean; providerId?: string }
): Promise<boolean> {
  if (!isFirebaseConfigured() || !db || !uid) {
    return false;
  }

  try {
    const summary = calculateUserSummary(progress);
    const userDocRef = doc(db, 'users', uid);

    const payload: Record<string, unknown> = {
      uid,
      ...summary,
      progressData: progress,
      updatedAt: serverTimestamp(),
      lastActiveAt: serverTimestamp(),
      isDeleted: false,
      deletedAt: null,
    };

    if (userMeta?.isAnonymous !== undefined) {
      payload.isAnonymous = userMeta.isAnonymous;
    }
    if (userMeta?.providerId) {
      payload.providerId = userMeta.providerId;
    }

    await setDoc(userDocRef, payload, { merge: true });
    return true;
  } catch (error) {
    console.warn('[firestoreSync] Failed to save user progress:', error);
    return false;
  }
}

/**
 * アカウントを論理削除（Soft Delete）として記録する（物理削除は行わない）
 */
export async function markAccountDeletedInFirestore(uid: string): Promise<boolean> {
  if (!isFirebaseConfigured() || !db || !uid) {
    return false;
  }

  try {
    const userDocRef = doc(db, 'users', uid);
    await setDoc(
      userDocRef,
      {
        isDeleted: true,
        deletedAt: new Date().toISOString(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return true;
  } catch (error) {
    console.warn('[firestoreSync] Failed to mark account as deleted:', error);
    return false;
  }
}

/**
 * 論理削除されたアカウントを復旧する
 */
export async function restoreAccountInFirestore(uid: string): Promise<boolean> {
  if (!isFirebaseConfigured() || !db || !uid) {
    return false;
  }

  try {
    const userDocRef = doc(db, 'users', uid);
    await setDoc(
      userDocRef,
      {
        isDeleted: false,
        deletedAt: null,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return true;
  } catch (error) {
    console.warn('[firestoreSync] Failed to restore account:', error);
    return false;
  }
}
