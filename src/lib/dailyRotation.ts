import type { PhraseItem } from '../data/phrases';

/**
 * 日付文字列（YYYY-MM-DD等）から決定論的な32bit数値ハッシュを算出
 */
export function hashDateString(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    const char = dateStr.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * 32bitシードから擬似乱数を生成するMulberry32 PRNG
 */
export function createMulberry32(seed: number): () => number {
  let s = seed;
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * シード付きシャッフル (Fisher-Yates)
 */
export function seededShuffle<T>(array: readonly T[], random: () => number): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

/**
 * 通常の乱数（Math.random）によるシャッフル (Fisher-Yates)
 */
export function shuffleArray<T>(array: readonly T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

/**
 * 問題の選択肢（options）を開くたびにランダムに並び替える
 */
export function shufflePhraseOptions(phrase: PhraseItem): PhraseItem {
  return {
    ...phrase,
    options: shuffleArray(phrase.options),
  };
}

export interface DailySelectionResult {
  questions: PhraseItem[];
  isReview: boolean;
}

/**
 * 日付シードと履修状況に基づき、日替わり3問を選出する
 * 
 * - 未履修フレーズを優先して選出
 * - 同一日・同一の履修状況であれば決定論的に同じ問題セットを返す
 * - 各問題の選択肢は開くたびにランダムにシャッフルされる
 */
export function selectDailyPhrases(
  allPhrases: readonly PhraseItem[],
  learnedIds: readonly string[],
  todayStr: string,
  count = 3
): DailySelectionResult {
  if (allPhrases.length === 0) {
    return { questions: [], isReview: false };
  }

  const learnedSet = new Set(learnedIds);
  const unlearned = allPhrases.filter((p) => !learnedSet.has(p.id));
  const learned = allPhrases.filter((p) => learnedSet.has(p.id));

  const seed = hashDateString(todayStr);
  const rng = createMulberry32(seed);

  let selected: PhraseItem[] = [];
  let isReview = false;

  if (unlearned.length >= count) {
    // 未履修が十分に存在する場合: 未履修群から日付シードでcount問選出
    const shuffledUnlearned = seededShuffle(unlearned, rng);
    selected = shuffledUnlearned.slice(0, count);
  } else if (unlearned.length > 0) {
    // 未履修が1〜(count-1)問存在する場合: 未履修を全て含め、不足分を既習フレーズから日付シードで補完
    const remainingCount = count - unlearned.length;
    const shuffledLearned = seededShuffle(learned, rng);
    selected = [...unlearned, ...shuffledLearned.slice(0, remainingCount)];
  } else {
    // 全問履修済みの場合: 全フレーズから日付シードで選出（復習出題）
    isReview = true;
    const shuffledAll = seededShuffle(allPhrases, rng);
    selected = shuffledAll.slice(0, count);
  }

  // 要件: 「回答の選択肢の並び順は、固定ではなく、同一の問題であっても開くたびに並び順が異なるようにしてください」
  const questionsWithOptionsShuffled = selected.map(shufflePhraseOptions);

  return {
    questions: questionsWithOptionsShuffled,
    isReview,
  };
}

/**
 * クイズ完了時に履修フレーズリストと周回数を更新する計算関数
 */
export function calculateNextProgressAfterCompletion(
  currentLearnedIds: readonly string[],
  currentLapCount: number,
  answeredPhraseIds: readonly string[],
  totalMasterCount: number
): { nextLearnedIds: string[]; nextLapCount: number } {
  const merged = Array.from(new Set([...currentLearnedIds, ...answeredPhraseIds]));

  if (merged.length >= totalMasterCount) {
    // 全問完走 -> 周回数インクリメントし、次回に向けて新周回開始
    return {
      nextLearnedIds: [],
      nextLapCount: currentLapCount + 1,
    };
  }

  return {
    nextLearnedIds: merged,
    nextLapCount: currentLapCount,
  };
}
