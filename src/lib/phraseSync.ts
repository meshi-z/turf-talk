import { collection, getDocs } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase.ts';
import {
  INITIAL_PHRASES,
  type PhraseItem,
  type PhraseCategory,
  type PhraseLevel,
  type PhraseType,
  type QuizOption,
} from '../data/phrases.ts';

export type { PhraseItem, PhraseCategory, PhraseLevel, PhraseType, QuizOption };

export const PHRASES_COLLECTION_NAME = 'phrases';
export const PHRASES_CACHE_KEY = 'turftalk_cached_cloud_phrases_v1';
export const PHRASES_CACHE_TIMESTAMP_KEY = 'turftalk_phrases_cache_timestamp_v1';

export interface CloudPhraseDocument extends PhraseItem {
  isPublished?: boolean;
  version?: number;
  updatedAt?: unknown;
}

const VALID_CATEGORIES: readonly PhraseCategory[] = ['feel', 'tactics', 'reaction', 'comment'];
const VALID_LEVELS: readonly PhraseLevel[] = ['beginner', 'intermediate'];
const VALID_TYPES: readonly PhraseType[] = ['phrase', 'vocabulary'];

/**
 * 外部（Firestore / キャッシュ）から読み込んだオブジェクトが
 * 妥当な PhraseItem 形式を満たしているかバリデーションする
 */
export function validatePhraseItem(raw: unknown): PhraseItem | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const obj = raw as Record<string, unknown>;

  // isPublished が明示的に false の場合は配信対象外
  if (obj.isPublished === false) {
    return null;
  }

  if (typeof obj.id !== 'string' || obj.id.trim() === '') {
    return null;
  }

  if (typeof obj.situation !== 'string') {
    return null;
  }

  if (typeof obj.phrase !== 'string' || obj.phrase.trim() === '') {
    return null;
  }

  if (typeof obj.explanation !== 'string') {
    return null;
  }

  const category = obj.category as PhraseCategory;
  if (!VALID_CATEGORIES.includes(category)) {
    return null;
  }

  const level = obj.level as PhraseLevel;
  if (!VALID_LEVELS.includes(level)) {
    return null;
  }

  let type: PhraseType = 'phrase';
  if (typeof obj.type === 'string') {
    if (!VALID_TYPES.includes(obj.type as PhraseType)) {
      return null;
    }
    type = obj.type as PhraseType;
  }

  if (!Array.isArray(obj.options) || obj.options.length !== 4) {
    return null;
  }

  const options: QuizOption[] = [];
  let correctCount = 0;

  for (const opt of obj.options) {
    if (!opt || typeof opt !== 'object') {
      return null;
    }
    const o = opt as Record<string, unknown>;
    if (typeof o.id !== 'string' || typeof o.text !== 'string' || typeof o.isCorrect !== 'boolean') {
      return null;
    }
    if (o.isCorrect) {
      correctCount += 1;
    }
    options.push({
      id: o.id,
      text: o.text,
      isCorrect: o.isCorrect,
    });
  }

  if (correctCount !== 1) {
    return null;
  }

  const result: PhraseItem = {
    id: obj.id,
    situation: obj.situation,
    phrase: obj.phrase,
    explanation: obj.explanation,
    category,
    level,
    type,
    options,
  };

  if (typeof obj.literalTranslation === 'string') {
    result.literalTranslation = obj.literalTranslation;
  }

  return result;
}

/**
 * 静的マスターフレーズとクラウドフレーズをID基準でハイブリッドマージする
 * - IDが重複する場合: クラウド側データ（最新修正・解説改訂等）で上書き
 * - 新規IDの場合: 配列末尾に追加
 * - 元の静的マスターの順序を保つ
 */
export function mergePhrases(
  staticPhrases: readonly PhraseItem[],
  cloudPhrases: readonly PhraseItem[]
): PhraseItem[] {
  if (!cloudPhrases || cloudPhrases.length === 0) {
    return [...staticPhrases];
  }

  const cloudMap = new Map<string, PhraseItem>();
  for (const cp of cloudPhrases) {
    if (cp && cp.id) {
      cloudMap.set(cp.id, cp);
    }
  }

  const merged: PhraseItem[] = [];
  const processedCloudIds = new Set<string>();

  for (const sp of staticPhrases) {
    const override = cloudMap.get(sp.id);
    if (override) {
      merged.push(override);
      processedCloudIds.add(sp.id);
    } else {
      merged.push(sp);
    }
  }

  // 静的マスターにない新規クラウドフレーズを末尾に追加
  for (const cp of cloudPhrases) {
    if (cp && cp.id && !processedCloudIds.has(cp.id)) {
      merged.push(cp);
      processedCloudIds.add(cp.id);
    }
  }

  return merged;
}

/**
 * LocalStorage からキャッシュ済みクラウドフレーズを読み出す
 */
export function loadCachedCloudPhrases(): PhraseItem[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(PHRASES_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const validated: PhraseItem[] = [];
    for (const item of parsed) {
      const v = validatePhraseItem(item);
      if (v) {
        validated.push(v);
      }
    }
    return validated;
  } catch (e) {
    console.warn('[PhraseSync] Failed to load cached phrases from localStorage:', e);
    return [];
  }
}

/**
 * クラウドフレーズを LocalStorage にキャッシュ保存する
 */
export function saveCachedCloudPhrases(phrases: readonly PhraseItem[]): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.setItem(PHRASES_CACHE_KEY, JSON.stringify(phrases));
    window.localStorage.setItem(PHRASES_CACHE_TIMESTAMP_KEY, new Date().toISOString());
  } catch (e) {
    console.warn('[PhraseSync] Failed to save phrases cache to localStorage:', e);
  }
}

/**
 * キャッシュまたは指定クラウドフレーズと静的マスターをマージした
 * 完全なフレーズ一覧を同期的に取得する
 */
export function getMergedPhrases(cloudPhrases?: readonly PhraseItem[]): PhraseItem[] {
  const effectiveCloud = cloudPhrases ?? loadCachedCloudPhrases();
  return mergePhrases(INITIAL_PHRASES, effectiveCloud);
}

/**
 * Firestore の phrases コレクションから動的配信フレーズを全件取得する
 */
export function fetchCloudPhrasesFromFirestore(): Promise<PhraseItem[]> {
  return new Promise((resolve) => {
    if (!isFirebaseConfigured() || !db) {
      resolve([]);
      return;
    }

    const colRef = collection(db, PHRASES_COLLECTION_NAME);
    getDocs(colRef)
      .then((snapshot) => {
        const cloudPhrases: PhraseItem[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          // ドキュメントIDを id フィールドのフォールバックとして利用
          const candidate = {
            id: docSnap.id,
            ...data,
          };
          const validated = validatePhraseItem(candidate);
          if (validated) {
            cloudPhrases.push(validated);
          }
        });
        resolve(cloudPhrases);
      })
      .catch((err) => {
        console.warn('[PhraseSync] Firestore fetch failed (offline or network error):', err);
        resolve([]);
      });
  });
}
