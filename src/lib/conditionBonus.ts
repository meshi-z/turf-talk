import type { QuizOption } from '../data/phrases';
import type { HorseCondition } from '../types';

export interface ConditionTierInfo {
  condition: HorseCondition;
  label: string;
  color: string;
  baseWeight: number;
  comment: string;
  hintCount: number;
}

/**
 * 平日調教消化日数（0〜5日）に応じた愛馬のコンディション・馬体重・ボーナス情報
 */
export function getConditionFromDays(days: number): ConditionTierInfo {
  const safeDays = Math.max(0, Math.min(5, Math.floor(days)));

  if (safeDays >= 4) {
    return {
      condition: 'peak',
      label: '絶好調 ⤴',
      color: 'text-amber-700 bg-amber-50 border-amber-200',
      baseWeight: 480,
      comment: '究極の仕上がり！毛ヅヤ抜群、無駄肉ゼロの完璧な馬体',
      hintCount: 2,
    };
  }

  if (safeDays === 3) {
    return {
      condition: 'up',
      label: '好調 ↗',
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      baseWeight: 484,
      comment: '順調な仕上がり。力は十分出せるデキ',
      hintCount: 1,
    };
  }

  if (safeDays >= 1) {
    return {
      condition: 'flat',
      label: '普通 ➡',
      color: 'text-zinc-600 bg-zinc-100 border-zinc-200',
      baseWeight: 492,
      comment: '少し動きが重いか。実戦を叩いて良化させたいところ',
      hintCount: 0,
    };
  }

  return {
    condition: 'heavy',
    label: '太め残り ↘',
    color: 'text-purple-700 bg-purple-50 border-purple-200',
    baseWeight: 500,
    comment: '完全に太め残り！息遣いが重く、厳しい戦いになりそう',
    hintCount: 0,
  };
}

/**
 * 不正解の選択肢からランダムに1つ選んで除外対象のIDを返す
 * - 正解の選択肢は絶対に除外しない
 * - 既に除外済みの選択肢は対象外
 * - 除外可能な不正解が残っていない場合は null を返す
 */
export function eliminateOneWrongOption(
  options: readonly QuizOption[],
  alreadyEliminatedIds: readonly string[] = []
): string | null {
  const remainingWrongOptions = options.filter(
    (opt) => !opt.isCorrect && !alreadyEliminatedIds.includes(opt.id)
  );

  if (remainingWrongOptions.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * remainingWrongOptions.length);
  return remainingWrongOptions[randomIndex].id;
}

export interface RaceFeedback {
  prevWeight: number;
  nextWeight: number;
  weightChange: number;
  prevCondition: HorseCondition;
  nextCondition: HorseCondition;
  comment: string;
}

/**
 * レース出走後の馬体重・調子のフィードバック計算
 * - 激闘により馬体重が -4kg 絞れる（下限460kg）
 * - 好走（4〜5問正解）した場合は絶好調（peak）へ
 * - 太め残り（heavy）だった場合も叩いて引き締まり普通（flat）へ良化
 */
export function calculateRaceFeedback(
  score: number,
  currentWeight: number,
  prevCondition: HorseCondition
): RaceFeedback {
  const weightChange = -4;
  const nextWeight = Math.max(460, currentWeight + weightChange);

  let nextCondition: HorseCondition = 'up';
  let comment = '激闘を終えて馬体が引き締まりました！';

  if (score >= 4) {
    nextCondition = 'peak';
    comment = '大舞台での好走を経て、心身ともに最高潮（絶好調）に研ぎ澄まされました！';
  } else if (prevCondition === 'heavy') {
    nextCondition = 'flat';
    comment = '実戦を叩いたことで無駄肉が落ち、太め残りが解消されました！';
  } else {
    nextCondition = 'up';
    comment = '世界の強豪相手に実戦の負荷をかけ、次走へ向けて気配が上向いています！';
  }

  return {
    prevWeight: currentWeight,
    nextWeight,
    weightChange,
    prevCondition,
    nextCondition,
    comment,
  };
}
