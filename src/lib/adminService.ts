import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase.ts';
import { isDevOrLocalhost } from './environment.ts';
import { restoreAccountInFirestore, type UserDocument } from './firestoreSync.ts';

export interface AdminUserSummary {
  uid: string;
  isAnonymous: boolean;
  providerId: string;
  learnedCount: number;
  progressPercent: number;
  streakDays: number;
  carrotCount: number;
  currentHorseName: string;
  currentHorseRoute: string;
  currentHorseWeek: number;
  totalRaceWins: number;
  totalHallOfFameCount: number;
  isDeleted: boolean;
  deletedAt: string | null;
  createdAtText: string;
  lastActiveAtText: string;
  rawLastActiveAtMs: number;
}

/**
 * 開発・デモ用のサンプルユーザー一覧データ
 */
export const MOCK_ADMIN_USERS: AdminUserSummary[] = [
  {
    uid: 'demo-user-001-admin',
    isAnonymous: false,
    providerId: 'google.com',
    learnedCount: 118,
    progressPercent: 98.3,
    streakDays: 45,
    carrotCount: 3,
    currentHorseName: 'トウカイテイオー',
    currentHorseRoute: 'classic',
    currentHorseWeek: 4,
    totalRaceWins: 12,
    totalHallOfFameCount: 3,
    isDeleted: false,
    deletedAt: null,
    createdAtText: '2026-10-01 10:00',
    lastActiveAtText: '2026-11-08 17:30',
    rawLastActiveAtMs: Date.now() - 1000 * 60 * 30,
  },
  {
    uid: 'demo-user-002-twitter',
    isAnonymous: false,
    providerId: 'twitter.com',
    learnedCount: 65,
    progressPercent: 54.2,
    streakDays: 14,
    carrotCount: 2,
    currentHorseName: 'サイレンススズカ',
    currentHorseRoute: 'sprint',
    currentHorseWeek: 2,
    totalRaceWins: 5,
    totalHallOfFameCount: 1,
    isDeleted: false,
    deletedAt: null,
    createdAtText: '2026-10-20 14:15',
    lastActiveAtText: '2026-11-08 12:00',
    rawLastActiveAtMs: Date.now() - 1000 * 60 * 360,
  },
  {
    uid: 'demo-user-003-guest',
    isAnonymous: true,
    providerId: 'anonymous',
    learnedCount: 12,
    progressPercent: 10.0,
    streakDays: 3,
    carrotCount: 1,
    currentHorseName: 'メジロマックイーン',
    currentHorseRoute: 'classic',
    currentHorseWeek: 1,
    totalRaceWins: 1,
    totalHallOfFameCount: 0,
    isDeleted: false,
    deletedAt: null,
    createdAtText: '2026-11-05 09:20',
    lastActiveAtText: '2026-11-07 20:00',
    rawLastActiveAtMs: Date.now() - 1000 * 60 * 60 * 22,
  },
  {
    uid: 'demo-user-004-deleted',
    isAnonymous: false,
    providerId: 'google.com',
    learnedCount: 88,
    progressPercent: 73.3,
    streakDays: 0,
    carrotCount: 0,
    currentHorseName: 'オグリキャップ',
    currentHorseRoute: 'dirt',
    currentHorseWeek: 3,
    totalRaceWins: 8,
    totalHallOfFameCount: 2,
    isDeleted: true,
    deletedAt: '2026-11-06 18:00',
    createdAtText: '2026-10-10 11:00',
    lastActiveAtText: '2026-11-06 18:00',
    rawLastActiveAtMs: Date.now() - 1000 * 60 * 60 * 48,
  },
];

/**
 * 開発・テスト環境判定（ローカルサーバー、DEVフラグ、または Node.js テスト環境）
 */
export function isDevOrTestEnvironment(): boolean {
  if (isDevOrLocalhost()) {
    return true;
  }
  const g = globalThis as { process?: { versions?: { node?: string } } };
  if (typeof g.process !== 'undefined' && Boolean(g.process.versions?.node)) {
    return true;
  }
  return false;
}

/**
 * ユーザーが管理者権限を有しているかを判定する
 */
export function isAdminUser(user: { uid?: string } | null): boolean {
  // 開発環境または localhost では管理画面へのアクセスを許可
  if (isDevOrTestEnvironment()) {
    return true;
  }

  if (!user || !user.uid) {
    return false;
  }

  const rawAdminUids = import.meta.env?.VITE_ADMIN_UIDS ?? '';
  const adminUids = rawAdminUids
    .split(',')
    .map((s: string) => s.trim())
    .filter(Boolean);

  return adminUids.includes(user.uid);
}

/**
 * Firestore の Timestamp または任意の日時表現をフォーマット文字列に変換する
 */
export function formatTimestamp(raw: unknown): { text: string; ms: number } {
  if (!raw) {
    return { text: '-', ms: 0 };
  }

  let date: Date | null = null;

  if (typeof raw === 'object' && raw !== null && 'toDate' in raw && typeof (raw as { toDate: () => Date }).toDate === 'function') {
    date = (raw as { toDate: () => Date }).toDate();
  } else if (typeof raw === 'string' || typeof raw === 'number') {
    const parsed = new Date(raw);
    if (!isNaN(parsed.getTime())) {
      date = parsed;
    }
  }

  if (!date) {
    return { text: '-', ms: 0 };
  }

  const pad = (n: number) => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const min = pad(date.getMinutes());

  return {
    text: `${y}-${m}-${d} ${h}:${min}`,
    ms: date.getTime(),
  };
}

/**
 * Firestore のドキュメントデータを AdminUserSummary 形式に整形する
 */
export function parseUserDocumentToAdminSummary(
  uid: string,
  data: Partial<UserDocument> | Record<string, unknown>
): AdminUserSummary {
  const isAnonymous = Boolean(data.isAnonymous ?? false);
  const providerId = typeof data.providerId === 'string' ? data.providerId : 'anonymous';
  const learnedCount = typeof data.learnedCount === 'number' ? data.learnedCount : 0;
  const progressPercent = typeof data.progressPercent === 'number' ? data.progressPercent : 0;
  const streakDays = typeof data.streakDays === 'number' ? data.streakDays : 0;
  const carrotCount = typeof data.carrotCount === 'number' ? data.carrotCount : 0;
  const currentHorseName = typeof data.currentHorseName === 'string' ? data.currentHorseName : '未設定';
  const currentHorseRoute = typeof data.currentHorseRoute === 'string' ? data.currentHorseRoute : 'classic';
  const currentHorseWeek = typeof data.currentHorseWeek === 'number' ? data.currentHorseWeek : 1;
  const totalRaceWins = typeof data.totalRaceWins === 'number' ? data.totalRaceWins : 0;
  const totalHallOfFameCount = typeof data.totalHallOfFameCount === 'number' ? data.totalHallOfFameCount : 0;
  const isDeleted = Boolean(data.isDeleted ?? false);
  const deletedAt = typeof data.deletedAt === 'string' ? data.deletedAt : null;

  const createdFormatted = formatTimestamp(data.createdAt);
  const lastActiveFormatted = formatTimestamp(data.lastActiveAt);

  return {
    uid,
    isAnonymous,
    providerId,
    learnedCount,
    progressPercent,
    streakDays,
    carrotCount,
    currentHorseName,
    currentHorseRoute,
    currentHorseWeek,
    totalRaceWins,
    totalHallOfFameCount,
    isDeleted,
    deletedAt,
    createdAtText: createdFormatted.text,
    lastActiveAtText: lastActiveFormatted.text,
    rawLastActiveAtMs: lastActiveFormatted.ms,
  };
}

/**
 * 管理者向けに全ユーザーの進捗・愛馬一覧を Firestore から取得する
 */
export async function fetchAllUsersForAdmin(): Promise<AdminUserSummary[]> {
  const isDev = isDevOrTestEnvironment();
  if (!isFirebaseConfigured() || !db) {
    if (isDev) {
      return [...MOCK_ADMIN_USERS];
    }
    return [];
  }

  try {
    const usersCol = collection(db, 'users');
    const q = query(usersCol, orderBy('lastActiveAt', 'desc'));
    const snapshot = await getDocs(q);

    const summaries: AdminUserSummary[] = [];
    snapshot.forEach((docSnap) => {
      const summary = parseUserDocumentToAdminSummary(docSnap.id, docSnap.data());
      summaries.push(summary);
    });

    return summaries;
  } catch (err) {
    console.warn('[AdminService] Firestore users fetch failed:', err);
    if (isDev) {
      return [...MOCK_ADMIN_USERS];
    }
    return [];
  }
}

/**
 * 管理者が誤って退会したユーザーアカウントを復元する
 */
export async function restoreUserAccountByAdmin(uid: string): Promise<boolean> {
  return restoreAccountInFirestore(uid);
}
