import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase.ts';
import {
  getLogicalDateString,
  getLogicalWeekMonday,
  isWeeklyRaceCompletedForWeek,
} from './logicalDate.ts';
import { evaluateStreakWithCarrotRescue } from './carrotBonus.ts';
import { MAX_WEEKLY_TRAINING_DAYS } from './conditionBonus.ts';
import { createDefaultCareerHorse, migrateToCareerHorse } from './careerCycle.ts';
import { validateAndSanitizeProgress } from './securityValidator.ts';
import type { UserProgress } from '../types/index.ts';

export interface CloudProgressResult {
  progress: UserProgress | null;
  isDeleted: boolean;
  exists?: boolean;
}

export interface CloudSaveGuardParams {
  userId: string | null | undefined;
  syncedUserId: string | null;
  currentSerialized: string;
  lastSyncedSerialized: string | null;
}

const DEFAULT_BASE_PROGRESS: UserProgress = {
  lastTrainingDate: null,
  streakDays: 0,
  condition: 'heavy',
  horseName: 'ターフスター',
  horseWeight: 500,
  completedToday: false,
  learnedPhraseIds: [],
  lapCount: 1,
  todayPhraseIds: [],
  todayWoodchipPhraseIds: [],
  completedCoursesToday: [],
  weekdayTrainingDays: 0,
  carrotCount: 1,
  lastCarrotUsedDate: null,
  currentWeekMonday: null,
  lastRaceWeekMonday: null,
  hasCompletedWeeklyRace: false,
  careerHorse: createDefaultCareerHorse(),
  hallOfFame: [],
  bookmarkedPhraseIds: [],
  phrasePartners: {},
};

/**
 * LocalStorage または Firestore から読み込んだ進捗データを、
 * 指定された論理日付・週替わり境界・愛馬マイグレーション・サニタイズルールに従って正規化する
 */
export function normalizeUserProgress(
  raw: Partial<UserProgress>,
  defaultProgress: UserProgress = DEFAULT_BASE_PROGRESS,
  today: string = getLogicalDateString()
): UserProgress {
  const todayMonday = getLogicalWeekMonday(today);
  const isSameDay = raw.lastTrainingDate === today;
  const savedStreak = typeof raw.streakDays === 'number' ? raw.streakDays : defaultProgress.streakDays;
  const savedCarrots = typeof raw.carrotCount === 'number' ? raw.carrotCount : defaultProgress.carrotCount;

  const evalResult = evaluateStreakWithCarrotRescue(
    savedStreak,
    raw.lastTrainingDate ?? null,
    today,
    savedCarrots
  );

  const migratedHorse = migrateToCareerHorse(raw);

  const savedWeekMonday =
    typeof raw.currentWeekMonday === 'string' ? raw.currentWeekMonday : null;
  const isNewWeek = savedWeekMonday !== null && savedWeekMonday !== todayMonday;

  const restoredWeeklyDays = isNewWeek
    ? 0
    : typeof raw.weekdayTrainingDays === 'number'
      ? Math.max(0, Math.min(MAX_WEEKLY_TRAINING_DAYS, raw.weekdayTrainingDays))
      : 0;

  const lastRaceWeekMonday =
    typeof raw.lastRaceWeekMonday === 'string' ? raw.lastRaceWeekMonday : null;
  const completedWeeklyRace = isWeeklyRaceCompletedForWeek(lastRaceWeekMonday, today);

  return validateAndSanitizeProgress({
    ...defaultProgress,
    ...raw,
    horseName: migratedHorse.name,
    horseWeight: migratedHorse.weight,
    streakDays: evalResult.streakDays,
    carrotCount: evalResult.carrotCount,
    lastCarrotUsedDate: evalResult.rescuedByCarrot ? today : raw.lastCarrotUsedDate ?? null,
    learnedPhraseIds: Array.isArray(raw.learnedPhraseIds) ? raw.learnedPhraseIds : [],
    lapCount: typeof raw.lapCount === 'number' ? raw.lapCount : 1,
    todayPhraseIds: isSameDay && Array.isArray(raw.todayPhraseIds) ? raw.todayPhraseIds : [],
    todayWoodchipPhraseIds:
      isSameDay && Array.isArray(raw.todayWoodchipPhraseIds)
        ? raw.todayWoodchipPhraseIds
        : [],
    completedCoursesToday:
      isSameDay && Array.isArray(raw.completedCoursesToday)
        ? raw.completedCoursesToday
        : [],
    completedToday: isSameDay,
    weekdayTrainingDays: restoredWeeklyDays,
    currentWeekMonday: todayMonday,
    lastRaceWeekMonday,
    hasCompletedWeeklyRace: completedWeeklyRace,
    careerHorse: migratedHorse,
    hallOfFame: Array.isArray(raw.hallOfFame) ? raw.hallOfFame : [],
    bookmarkedPhraseIds: Array.isArray(raw.bookmarkedPhraseIds) ? raw.bookmarkedPhraseIds : [],
    phrasePartners: raw.phrasePartners && typeof raw.phrasePartners === 'object' ? raw.phrasePartners : {},
  }).sanitized;
}

/**
 * 初回クラウド同期完了前の上書きや、クラウドから受信した直後の同一データの書き戻しを抑止すべきか判定する
 */
export function shouldSkipCloudSave({
  userId,
  syncedUserId,
  currentSerialized,
  lastSyncedSerialized,
}: CloudSaveGuardParams): boolean {
  if (!userId) return true;
  if (syncedUserId !== userId) return true;
  if (lastSyncedSerialized !== null && currentSerialized === lastSyncedSerialized) return true;
  return false;
}

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
): Promise<CloudProgressResult> {
  if (!isFirebaseConfigured() || !db || !uid) {
    return { progress: null, isDeleted: false };
  }

  try {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);

    if (!snap.exists()) {
      return { progress: null, isDeleted: false, exists: false };
    }

    const data = snap.data() as Partial<UserDocument>;
    if (data.isDeleted) {
      return { progress: null, isDeleted: true, exists: true };
    }

    return { progress: data.progressData || null, isDeleted: false, exists: true };
  } catch (error) {
    console.warn('[firestoreSync] Failed to fetch user progress:', error);
    return { progress: null, isDeleted: false };
  }
}

/**
 * Firestore のユーザー進捗ドキュメントをリアルタイム購読（onSnapshot）する
 */
export function subscribeUserProgressFromFirestore(
  uid: string,
  onUpdate: (result: CloudProgressResult) => void,
  onError?: (error: unknown) => void
): () => void {
  if (!isFirebaseConfigured() || !db || !uid) {
    return () => {};
  }

  try {
    const userDocRef = doc(db, 'users', uid);
    const unsubscribe = onSnapshot(
      userDocRef,
      (snap) => {
        if (!snap.exists()) {
          onUpdate({ progress: null, isDeleted: false, exists: false });
          return;
        }

        const data = snap.data() as Partial<UserDocument>;
        if (data.isDeleted) {
          onUpdate({ progress: null, isDeleted: true, exists: true });
          return;
        }

        onUpdate({
          progress: data.progressData || null,
          isDeleted: false,
          exists: true,
        });
      },
      (error) => {
        console.warn('[firestoreSync] Realtime user progress subscription error:', error);
        if (onError) {
          onError(error);
        }
      }
    );
    return unsubscribe;
  } catch (error) {
    console.warn('[firestoreSync] Failed to subscribe to user progress:', error);
    if (onError) {
      onError(error);
    }
    return () => {};
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

/**
 * ユーザーの認証連携メタデータ（isAnonymous, providerId）を Firestore に反映する
 */
export async function updateUserAuthMetaInFirestore(
  uid: string,
  meta: { isAnonymous: boolean; providerId: string }
): Promise<boolean> {
  if (!isFirebaseConfigured() || !db || !uid) {
    return false;
  }

  try {
    const userDocRef = doc(db, 'users', uid);
    await setDoc(
      userDocRef,
      {
        uid,
        isAnonymous: meta.isAnonymous,
        providerId: meta.providerId,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return true;
  } catch (error) {
    console.warn('[firestoreSync] Failed to update user auth metadata:', error);
    return false;
  }
}
