import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase.ts';
import { isDevOrLocalhost } from './environment.ts';
import { restoreAccountInFirestore, type UserDocument } from './firestoreSync.ts';
import {
  PHRASES_COLLECTION_NAME,
  saveCachedCloudPhrases,
  validatePhraseItem,
  type PhraseItem,
} from './phraseSync.ts';
import { INITIAL_PHRASES } from '../data/phrases.ts';

export const CONTENT_DEPLETION_THRESHOLD_REMAINING = 10;
export const CONTENT_DEPLETION_ALERT_PERCENT = 15.0;
const ADMIN_LOCAL_PHRASES_KEY = 'turftalk_admin_cloud_phrases_v1';

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

export interface InsightBucketItem {
  id: string;
  label: string;
  count: number;
  percent: number;
}

export interface AdminDashboardInsights {
  totalUsers: number;
  activeUsers: number;
  deletedUsers: number;
  linkedUsers: number;
  ssoLinkRatePercent: number;
  avgProgressPercent: number;
  avgStreakDays: number;
  totalRaceWins: number;
  totalHallOfFameHorses: number;
  hallOfFameUserCount: number;
  hallOfFameUserRatePercent: number;
  depletedUserCount: number;
  completedAllUserCount: number;
  depletionRatePercent: number;
  needsNewContentPack: boolean;
  progressDistribution: InsightBucketItem[];
  routeDistribution: InsightBucketItem[];
  weekDistribution: InsightBucketItem[];
  providerDistribution: InsightBucketItem[];
  streakDistribution: InsightBucketItem[];
}

export interface AdminCloudPhrase extends PhraseItem {
  isPublished: boolean;
  updatedAtText: string;
}

const ROUTE_LABELS: Record<string, string> = {
  classic: 'クラシック路線',
  'classic-colt': '3歳牡馬クラシック',
  'classic-filly': '3歳牝馬クラシック',
  sprint: '古馬短距離（スプリント）',
  middle: '古馬マイル・中距離',
  stayer: '古馬長距離（ステイヤー）',
  dirt: 'ダート路線',
  'dirt-mile': 'ダート短中距離（マイル）',
  'dirt-classic': 'ダート王道中距離',
  jump: '障害（ジャンプ）路線',
};

export function getRouteLabel(routeId: string): string {
  return ROUTE_LABELS[routeId] ?? routeId;
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
 * （ソースコード上へのUIDハードコードを排除し、ビルド時環境変数 VITE_ADMIN_UIDS のみを参照）
 */
export function isAdminUser(
  user: { uid?: string } | null,
  options?: { bypassDevCheck?: boolean; adminUidsEnv?: string }
): boolean {
  // 開発環境または localhost では管理画面へのアクセスを許可
  if (!options?.bypassDevCheck && isDevOrTestEnvironment()) {
    return true;
  }

  if (!user || !user.uid) {
    return false;
  }

  const rawAdminUids = options?.adminUidsEnv ?? import.meta.env?.VITE_ADMIN_UIDS ?? '';
  const envAdminUids = rawAdminUids
    .split(',')
    .map((s: string) => s.trim())
    .filter(Boolean);

  return envAdminUids.includes(user.uid);
}

/**
 * Firestore の Timestamp または任意の日時表現をフォーマット文字列に変換する
 */
export function formatTimestamp(raw: unknown): { text: string; ms: number } {
  if (!raw) {
    return { text: '-', ms: 0 };
  }

  let date: Date | null = null;

  if (
    typeof raw === 'object' &&
    raw !== null &&
    'toDate' in raw &&
    typeof (raw as { toDate: () => Date }).toDate === 'function'
  ) {
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
  const currentHorseName =
    typeof data.currentHorseName === 'string' ? data.currentHorseName : '未設定';
  const currentHorseRoute =
    typeof data.currentHorseRoute === 'string' ? data.currentHorseRoute : 'classic';
  const currentHorseWeek = typeof data.currentHorseWeek === 'number' ? data.currentHorseWeek : 1;
  const totalRaceWins = typeof data.totalRaceWins === 'number' ? data.totalRaceWins : 0;
  const totalHallOfFameCount =
    typeof data.totalHallOfFameCount === 'number' ? data.totalHallOfFameCount : 0;
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

function round1(val: number): number {
  return Math.round(val * 10) / 10;
}

/**
 * ユーザー一覧データから管理者ダッシュボード用の詳細統計・分布インサイトを算出する
 */
export function calculateAdminInsights(
  users: readonly AdminUserSummary[],
  totalMasterPhrases: number = INITIAL_PHRASES.length
): AdminDashboardInsights {
  const totalUsers = users.length;
  const activeList = users.filter((u) => !u.isDeleted);
  const activeUsers = activeList.length;
  const deletedUsers = totalUsers - activeUsers;
  const linkedUsers = users.filter((u) => !u.isAnonymous).length;
  const ssoLinkRatePercent = totalUsers > 0 ? round1((linkedUsers / totalUsers) * 100) : 0;

  const avgProgressPercent =
    totalUsers > 0
      ? round1(users.reduce((acc, u) => acc + u.progressPercent, 0) / totalUsers)
      : 0;

  const avgStreakDays =
    totalUsers > 0
      ? round1(users.reduce((acc, u) => acc + u.streakDays, 0) / totalUsers)
      : 0;

  const totalRaceWins = users.reduce((acc, u) => acc + u.totalRaceWins, 0);
  const totalHallOfFameHorses = users.reduce((acc, u) => acc + u.totalHallOfFameCount, 0);
  const hallOfFameUserCount = users.filter((u) => u.totalHallOfFameCount > 0).length;
  const hallOfFameUserRatePercent =
    totalUsers > 0 ? round1((hallOfFameUserCount / totalUsers) * 100) : 0;

  // コンテンツ枯渇判定（アクティブユーザーのうち未消化フレーズが10問以下の人数）
  const safeTotalPhrases = Math.max(1, totalMasterPhrases);
  const depletedUserCount = activeList.filter(
    (u) => safeTotalPhrases - u.learnedCount <= CONTENT_DEPLETION_THRESHOLD_REMAINING
  ).length;
  const completedAllUserCount = activeList.filter(
    (u) => u.learnedCount >= safeTotalPhrases || u.progressPercent >= 100
  ).length;
  const depletionRatePercent =
    activeUsers > 0 ? round1((depletedUserCount / activeUsers) * 100) : 0;
  const needsNewContentPack = depletionRatePercent >= CONTENT_DEPLETION_ALERT_PERCENT;

  // 1. 消化率ヒストグラム（全ユーザー対象）
  const progBuckets = [
    { id: '0-25', label: '0〜25% (序盤)', count: 0 },
    { id: '26-50', label: '26〜50% (中盤)', count: 0 },
    { id: '51-75', label: '51〜75% (後半)', count: 0 },
    { id: '76-99', label: '76〜99% (終盤・枯渇圏)', count: 0 },
    { id: '100', label: '100% (全問制覇)', count: 0 },
  ];

  for (const u of users) {
    const p = u.progressPercent;
    if (p >= 100 || u.learnedCount >= safeTotalPhrases) {
      progBuckets[4].count += 1;
    } else if (p > 75) {
      progBuckets[3].count += 1;
    } else if (p > 50) {
      progBuckets[2].count += 1;
    } else if (p > 25) {
      progBuckets[1].count += 1;
    } else {
      progBuckets[0].count += 1;
    }
  }

  const progressDistribution: InsightBucketItem[] = progBuckets.map((b) => ({
    ...b,
    percent: totalUsers > 0 ? round1((b.count / totalUsers) * 100) : 0,
  }));

  // 2. 路線別人気分布（全ユーザー対象）
  const routeCounts = new Map<string, number>();
  for (const u of users) {
    const key = u.currentHorseRoute || 'classic';
    routeCounts.set(key, (routeCounts.get(key) ?? 0) + 1);
  }
  const routeDistribution: InsightBucketItem[] = Array.from(routeCounts.entries())
    .map(([routeId, count]) => ({
      id: routeId,
      label: getRouteLabel(routeId),
      count,
      percent: totalUsers > 0 ? round1((count / totalUsers) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // 3. キャリア週（Week 1〜4）分布
  const weekBuckets = [1, 2, 3, 4].map((w) => {
    const count = users.filter((u) => u.currentHorseWeek === w).length;
    return {
      id: `week-${w}`,
      label: `Week ${w}`,
      count,
      percent: totalUsers > 0 ? round1((count / totalUsers) * 100) : 0,
    };
  });

  // 4. 認証プロバイダ内訳
  const googleCount = users.filter((u) => u.providerId === 'google.com').length;
  const twitterCount = users.filter((u) => u.providerId === 'twitter.com').length;
  const guestCount = users.filter(
    (u) => u.providerId !== 'google.com' && u.providerId !== 'twitter.com'
  ).length;
  const providerDistribution: InsightBucketItem[] = [
    {
      id: 'google.com',
      label: 'Google 連携',
      count: googleCount,
      percent: totalUsers > 0 ? round1((googleCount / totalUsers) * 100) : 0,
    },
    {
      id: 'twitter.com',
      label: 'X (Twitter) 連携',
      count: twitterCount,
      percent: totalUsers > 0 ? round1((twitterCount / totalUsers) * 100) : 0,
    },
    {
      id: 'anonymous',
      label: 'ゲスト (未連携)',
      count: guestCount,
      percent: totalUsers > 0 ? round1((guestCount / totalUsers) * 100) : 0,
    },
  ];

  // 5. ストリーク継続日数分布
  const streakBuckets = [
    { id: 'streak-0', label: '0日 (未継続)', count: 0 },
    { id: 'streak-1-6', label: '1〜6日 (初週継続)', count: 0 },
    { id: 'streak-7-29', label: '7〜29日 (週間習慣化)', count: 0 },
    { id: 'streak-30+', label: '30日以上 (長期定着)', count: 0 },
  ];
  for (const u of users) {
    if (u.streakDays >= 30) {
      streakBuckets[3].count += 1;
    } else if (u.streakDays >= 7) {
      streakBuckets[2].count += 1;
    } else if (u.streakDays >= 1) {
      streakBuckets[1].count += 1;
    } else {
      streakBuckets[0].count += 1;
    }
  }
  const streakDistribution: InsightBucketItem[] = streakBuckets.map((b) => ({
    ...b,
    percent: totalUsers > 0 ? round1((b.count / totalUsers) * 100) : 0,
  }));

  return {
    totalUsers,
    activeUsers,
    deletedUsers,
    linkedUsers,
    ssoLinkRatePercent,
    avgProgressPercent,
    avgStreakDays,
    totalRaceWins,
    totalHallOfFameHorses,
    hallOfFameUserCount,
    hallOfFameUserRatePercent,
    depletedUserCount,
    completedAllUserCount,
    depletionRatePercent,
    needsNewContentPack,
    progressDistribution,
    routeDistribution,
    weekDistribution: weekBuckets,
    providerDistribution,
    streakDistribution,
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

function loadLocalAdminPhrases(): AdminCloudPhrase[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(ADMIN_LOCAL_PHRASES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AdminCloudPhrase[]) : [];
  } catch {
    return [];
  }
}

function saveLocalAdminPhrases(items: readonly AdminCloudPhrase[]): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  try {
    window.localStorage.setItem(ADMIN_LOCAL_PHRASES_KEY, JSON.stringify(items));
    const publishedOnly = items
      .filter((item) => item.isPublished)
      .map(({ isPublished: _pub, updatedAtText: _upd, ...phrase }) => phrase);
    saveCachedCloudPhrases(publishedOnly);
  } catch (e) {
    console.warn('[AdminService] Failed to save local admin phrases:', e);
  }
}

/**
 * 管理者向けにクラウド配信フレーズ（phrases コレクション）一覧を取得する
 */
export async function fetchAllCloudPhrasesForAdmin(): Promise<AdminCloudPhrase[]> {
  if (!isFirebaseConfigured() || !db) {
    return loadLocalAdminPhrases();
  }

  try {
    const colRef = collection(db, PHRASES_COLLECTION_NAME);
    const snapshot = await getDocs(colRef);
    const items: AdminCloudPhrase[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const isPublished = data.isPublished !== false;
      const validated = validatePhraseItem({
        id: docSnap.id,
        ...data,
        isPublished: true,
      });
      if (validated) {
        const formatted = formatTimestamp(data.updatedAt);
        items.push({
          ...validated,
          isPublished,
          updatedAtText: formatted.text,
        });
      }
    });

    return items;
  } catch (err) {
    console.warn('[AdminService] Firestore phrases fetch failed:', err);
    return loadLocalAdminPhrases();
  }
}

/**
 * 管理者が新規または更新フレーズを Firestore（未接続時はローカル）へ保存・配信する
 */
export async function saveCloudPhraseByAdmin(
  phraseInput: PhraseItem,
  isPublished: boolean = true
): Promise<{ ok: boolean; error?: string }> {
  const validated = validatePhraseItem({ ...phraseInput, isPublished: true });
  if (!validated) {
    return {
      ok: false,
      error:
        '入力内容がフレーズ仕様を満たしていません（ID・英語フレーズ・4つの選択肢・正解1つ・解説を確認してください）。',
    };
  }

  const nowFormatted = formatTimestamp(new Date().toISOString());

  if (!isFirebaseConfigured() || !db) {
    const current = loadLocalAdminPhrases();
    const nextItem: AdminCloudPhrase = {
      ...validated,
      isPublished,
      updatedAtText: nowFormatted.text,
    };
    const existingIdx = current.findIndex((item) => item.id === validated.id);
    if (existingIdx >= 0) {
      current[existingIdx] = nextItem;
    } else {
      current.unshift(nextItem);
    }
    saveLocalAdminPhrases(current);
    return { ok: true };
  }

  try {
    const docRef = doc(db, PHRASES_COLLECTION_NAME, validated.id);
    await setDoc(
      docRef,
      {
        ...validated,
        isPublished,
        version: 1,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return { ok: true };
  } catch (err) {
    console.warn('[AdminService] Failed to save cloud phrase to Firestore:', err);
    return {
      ok: false,
      error: 'Firestore への書き込みに失敗しました。管理者権限および通信状態を確認してください。',
    };
  }
}

/**
 * 管理者がクラウド配信フレーズの公開/非公開ステータスを切り替える
 */
export async function toggleCloudPhrasePublishByAdmin(
  phraseId: string,
  nextPublished: boolean
): Promise<boolean> {
  if (!phraseId) return false;

  if (!isFirebaseConfigured() || !db) {
    const current = loadLocalAdminPhrases();
    const target = current.find((item) => item.id === phraseId);
    if (!target) return false;
    target.isPublished = nextPublished;
    target.updatedAtText = formatTimestamp(new Date().toISOString()).text;
    saveLocalAdminPhrases(current);
    return true;
  }

  try {
    const docRef = doc(db, PHRASES_COLLECTION_NAME, phraseId);
    await updateDoc(docRef, {
      isPublished: nextPublished,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (err) {
    console.warn('[AdminService] Failed to toggle phrase publish state:', err);
    return false;
  }
}
