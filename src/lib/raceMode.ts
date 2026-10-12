import type { PhraseItem, QuizOption } from '../data/phrases';

export const RACE_QUESTION_COUNT = 5;

export interface RacePhase {
  step: number; // 1 to 5
  phaseName: string;
  distanceRemaining: string;
  commentary: string;
  correctReaction: string;
  incorrectReaction: string;
}

export const RACE_PHASES: readonly RacePhase[] = [
  {
    step: 1,
    phaseName: 'スタート',
    distanceRemaining: '残り 2400m',
    commentary: '各馬綺麗に揃ったスタート！ポジション争いが始まります。',
    correctReaction: '好スタートから抜群の行き脚！好位の絶好ポジションを確保！🔥',
    incorrectReaction: 'やや立ち遅れ！後方からの追走を余儀なくされる…！💦',
  },
  {
    step: 2,
    phaseName: '向こう正面',
    distanceRemaining: '残り 1600m',
    commentary: '隊列が落ち着き向こう正面へ。ゆったりとしたペースで流れます。',
    correctReaction: '折り合いピタリ！ハミを取って理想的なリズムで追走！🔥',
    incorrectReaction: '少し力みが見られるか！？外から他馬にプレッシャーをかけられる…！💦',
  },
  {
    step: 3,
    phaseName: '第3〜4コーナー',
    distanceRemaining: '残り 800m',
    commentary: 'レースが動き出す勝負所！各騎手の手が激しく動き始めます！',
    correctReaction: '手応え抜群！持ったままの手応えで前を射程圏に捉える！🔥',
    incorrectReaction: '前の馬が壁になって進路が狭い…！外へ持ち出すロス！💦',
  },
  {
    step: 4,
    phaseName: '直線・叩き合い',
    distanceRemaining: '残り 400m',
    commentary: '最後の直線コースへ向いた！外か内か、先頭争いが激化！',
    correctReaction: '一気に加速！豪快なフットワークで先頭に躍り出る！🔥',
    incorrectReaction: '外から他馬の強烈なプレッシャー！脚色が少し鈍る…！💦',
  },
  {
    step: 5,
    phaseName: 'ゴール前・死闘',
    distanceRemaining: '残り 100m',
    commentary: '残り100m！栄冠をかけた最後の直線、渾身の叩き合い！',
    correctReaction: '内から力強く抜け出した！栄光のゴールへ一直線！🔥',
    incorrectReaction: '外の強襲に必死に食い下がる！最後まで粘れるか！？💦',
  },
];

export type RacePlacementType = '1st' | '2nd' | 'board' | 'unplaced';

export interface RacePlacement {
  type: RacePlacementType;
  rankText: string;
  title: string;
  comment: string;
  badgeBg: string;
  textColor: string;
}

/**
 * 正解数（0〜5問）に応じた着順判定
 */
export function calculateRacePlacement(score: number): RacePlacement {
  if (score === 5) {
    return {
      type: '1st',
      rankText: '1着 🥇 (優勝)',
      title: '海外G1制覇！歴史的勝利！',
      comment: '抜群のレース運びで世界最高峰の頂点に立ちました！完璧な仕上げの証明です。',
      badgeBg: 'bg-amber-400 text-amber-950 border-amber-300',
      textColor: 'text-amber-800',
    };
  }
  if (score === 4) {
    return {
      type: '2nd',
      rankText: '2着 🥈 (惜敗)',
      title: 'アタマ差の惜敗…！',
      comment: '勝ち馬と激しい叩き合いの末、惜しくも2着。しかし世界の強豪と互角に渡り合いました！',
      badgeBg: 'bg-zinc-200 text-zinc-900 border-zinc-300',
      textColor: 'text-zinc-700',
    };
  }
  if (score >= 2) {
    const rank = 6 - score; // score 3 -> 3着, score 2 -> 4着
    return {
      type: 'board',
      rankText: `${rank}着 🎖️ (掲示板)`,
      title: '掲示板確保！健闘の走り',
      comment: '世界の強豪相手に堂々の入着！平日の坂路調教の積み重ねがしっかりと発揮されました。',
      badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      textColor: 'text-emerald-800',
    };
  }
  return {
    type: 'unplaced',
    rankText: '着外 💦 (6着以下)',
    title: '悔しい着外…次走へ糧に',
    comment: '世界の壁は厚かった…！平日の坂路調教でさらに英語フレーズを磨き、次走のG1でリベンジしましょう！',
    badgeBg: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    textColor: 'text-zinc-600',
  };
}

/**
 * 疑似ランダムシャッフル（Fisher-Yates）
 */
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function shuffleOptions(options: readonly QuizOption[]): QuizOption[] {
  return shuffleArray(options as QuizOption[]);
}

/**
 * 週末レース用の5問を選出
 * - 履修済みフレーズを優先してピックアップし、足りない分は未履修から補充
 * - 各問題の選択肢を開くたびにシャッフル
 */
export function selectRaceQuestions(
  allPhrases: PhraseItem[],
  learnedPhraseIds: string[] = []
): PhraseItem[] {
  if (allPhrases.length === 0) return [];

  const learnedPool = allPhrases.filter((p) => learnedPhraseIds.includes(p.id));
  const unlearnedPool = allPhrases.filter((p) => !learnedPhraseIds.includes(p.id));

  const shuffledLearned = shuffleArray(learnedPool);
  const shuffledUnlearned = shuffleArray(unlearnedPool);

  const selected: PhraseItem[] = [];

  // 1. 履修済みから最大5問
  for (const item of shuffledLearned) {
    if (selected.length < RACE_QUESTION_COUNT) {
      selected.push(item);
    }
  }

  // 2. 足りなければ未履修から補充
  for (const item of shuffledUnlearned) {
    if (selected.length < RACE_QUESTION_COUNT) {
      selected.push(item);
    }
  }

  // それでも足りない場合（フレーズ総数が5問未満など）はプール全体から補填
  if (selected.length < RACE_QUESTION_COUNT) {
    for (const item of shuffleArray(allPhrases)) {
      if (selected.length < RACE_QUESTION_COUNT && !selected.some((s) => s.id === item.id)) {
        selected.push(item);
      }
    }
  }

  // 各問題の選択肢をシャッフルして返す
  return selected.map((item) => ({
    ...item,
    options: shuffleOptions(item.options),
  }));
}
