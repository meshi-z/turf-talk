import type { PhraseItem } from '../data/phrases';
import type { TrainingCourse } from '../types';

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
 * コース種別に応じて対象フレーズをフィルタリングする
 */
export function filterPhrasesByCourse(
  allPhrases: readonly PhraseItem[],
  course: TrainingCourse = 'uphill'
): PhraseItem[] {
  if (course === 'woodchip') {
    return allPhrases.filter((p) => p.type === 'vocabulary');
  }
  return allPhrases.filter((p) => p.type !== 'vocabulary');
}

/**
 * 日付シードと履修状況に基づき、日替わり3問を選出する
 * 
 * - 未履修フレーズを優先して選出
 * - 同一日・同一の履修状況であれば決定論的に同じ問題セットを返す
 * - コース（uphill / woodchip）ごとに独立した候補プールと日付シードで選出
 * - 各問題の選択肢は開くたびにランダムにシャッフルされる
 */
export function selectDailyPhrases(
  allPhrases: readonly PhraseItem[],
  learnedIds: readonly string[],
  todayStr: string,
  count = 3,
  course: TrainingCourse = 'uphill'
): DailySelectionResult {
  const coursePhrases = filterPhrasesByCourse(allPhrases, course);
  if (coursePhrases.length === 0) {
    return { questions: [], isReview: false };
  }

  const learnedSet = new Set(learnedIds);
  const unlearned = coursePhrases.filter((p) => !learnedSet.has(p.id));
  const learned = coursePhrases.filter((p) => learnedSet.has(p.id));

  // コースごとに異なるシード値を生成
  const seed = hashDateString(`${todayStr}_${course}`);
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
    // 全問履修済みの場合: コース全フレーズから日付シードで選出（復習出題）
    isReview = true;
    const shuffledAll = seededShuffle(coursePhrases, rng);
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
 * 指定されたフレーズIDリストに対応するフレーズを取得し、各問題の選択肢をランダムにシャッフルして返す（復習用）
 */
export function getPhrasesByIds(
  allPhrases: readonly PhraseItem[],
  phraseIds: readonly string[]
): PhraseItem[] {
  const map = new Map(allPhrases.map((p) => [p.id, p]));
  const results: PhraseItem[] = [];
  for (const id of phraseIds) {
    const item = map.get(id);
    if (item) {
      results.push(shufflePhraseOptions(item));
    }
  }
  return results;
}

/**
 * 当日調教完了後の追加トレーニング（未習得フレーズの継続学習）用フレーズを選出する
 * 
 * - コース（uphill / woodchip）ごとのプールから選出
 * - 原則「未習得プールから2問 ＋ 習得済みプールから1問」の計3問を選出
 * - 未習得プールが2問以下の場合は習得済みプールから補充して計3問を維持
 * - 全問習得済みの場合は全フレーズからランダムに3問選出（全問復習モード）
 * - 習得済みが0問の場合は未習得から3問選出
 * - 各問題の選択肢はランダムにシャッフルされる
 */
export function selectExtraTrainingPhrases(
  allPhrases: readonly PhraseItem[],
  learnedIds: readonly string[],
  count = 3,
  course: TrainingCourse = 'uphill'
): DailySelectionResult {
  const coursePhrases = filterPhrasesByCourse(allPhrases, course);
  if (coursePhrases.length === 0) {
    return { questions: [], isReview: false };
  }

  const learnedSet = new Set(learnedIds);
  const unlearned = coursePhrases.filter((p) => !learnedSet.has(p.id));
  const learned = coursePhrases.filter((p) => learnedSet.has(p.id));

  let selected: PhraseItem[] = [];
  let isReview = false;

  const shuffledUnlearned = shuffleArray(unlearned);
  const shuffledLearned = shuffleArray(learned);

  if (unlearned.length === 0) {
    // 全問習得済みの場合: 全フレーズから選出（復習出題）
    isReview = true;
    selected = shuffleArray(coursePhrases).slice(0, count);
  } else if (unlearned.length === 1) {
    // 未習得が1問のみの場合: 未習得1問 ＋ 習得済みから補充
    const neededFromLearned = Math.min(count - 1, shuffledLearned.length);
    selected = [shuffledUnlearned[0], ...shuffledLearned.slice(0, neededFromLearned)];
  } else {
    // 未習得が2問以上ある場合: 未習得から2問選出し、残りを習得済みから選出
    const unlearnedCount = Math.min(2, shuffledUnlearned.length);
    const neededFromLearned = count - unlearnedCount;

    if (shuffledLearned.length >= neededFromLearned) {
      selected = [
        ...shuffledUnlearned.slice(0, unlearnedCount),
        ...shuffledLearned.slice(0, neededFromLearned),
      ];
    } else {
      // 習得済みが不足している場合（全問未習得等）: 未習得からcount問確保
      selected = shuffledUnlearned.slice(0, count);
    }
  }

  // 出題順序をシャッフルし、選択肢を動的にシャッフル
  const shuffledSelected = shuffleArray(selected);
  const questionsWithOptionsShuffled = shuffledSelected.map(shufflePhraseOptions);

  return {
    questions: questionsWithOptionsShuffled,
    isReview,
  };
}

/**
 * クイズ完了時に、正解したフレーズIDをもとに履修フレーズリストと周回数を更新する計算関数
 */
export function calculateNextProgressAfterCompletion(
  currentLearnedIds: readonly string[],
  currentLapCount: number,
  correctPhraseIds: readonly string[],
  totalMasterCount: number
): { nextLearnedIds: string[]; nextLapCount: number } {
  const merged = Array.from(new Set([...currentLearnedIds, ...correctPhraseIds]));

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
