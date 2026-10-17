import { useEffect, type FC } from 'react';
import type { PhraseItem } from '../data/phrases';
import type { UserProgress } from '../types';
import { Trophy, Home, Check, X, Sparkles, Award, Flag, Crown } from 'lucide-react';
import { soundManager } from '../lib/sound';
import { calculateRacePlacement, type RacePlacement } from '../lib/raceMode';
import { calculateRaceFeedback, type RaceFeedback } from '../lib/conditionBonus';
import {
  getCareerRouteInfo,
  getCareerStageLabel,
  getCurrentWeekRaceInfo,
  type CareerRaceAdvanceResult,
} from '../lib/careerCycle';

interface RaceResultScreenProps {
  score: number;
  totalQuestions: number;
  progress: UserProgress;
  answeredHistory: {
    phrase: PhraseItem;
    selectedOptionId: string;
    isCorrect: boolean;
  }[];
  addedCarrots?: number;
  careerAdvance?: CareerRaceAdvanceResult | null;
  onGoHome: () => void;
  onProceedToRetirement?: () => void;
}

export const RaceResultScreen: FC<RaceResultScreenProps> = ({
  score,
  totalQuestions,
  progress,
  answeredHistory,
  addedCarrots = 0,
  careerAdvance = null,
  onGoHome,
  onProceedToRetirement,
}) => {
  const { careerHorse } = progress;
  const routeInfo = getCareerRouteInfo(careerHorse.routeId);
  const completedWeek = careerAdvance?.completedWeek ?? careerHorse.currentWeek;
  const completedRaceInfo = getCurrentWeekRaceInfo(careerHorse.routeId, completedWeek);
  const nextStageLabel = getCareerStageLabel(careerHorse.currentWeek, careerHorse.raceHistory);
  const isFinalCareerRace = Boolean(careerAdvance?.isFinalWeekCompleted || completedWeek === 4);

  const placement: RacePlacement = calculateRacePlacement(score, completedWeek);
  const feedback: RaceFeedback = calculateRaceFeedback(score, progress.horseWeight, progress.condition);
  const isWinner = placement.type === '1st';
  const isSecond = placement.type === '2nd';

  // 画面マウント時にファンファーレ等のSEを再生
  useEffect(() => {
    const timer = setTimeout(() => {
      if (addedCarrots > 0) {
        soundManager.playCarrot();
      }
      if (isWinner || isSecond) {
        soundManager.playFanfare();
      } else {
        soundManager.playStamp();
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [isWinner, isSecond, addedCarrots]);

  const conditionMap = {
    heavy: '太め残り ↘',
    flat: '普通 ➡',
    up: '好調 ↗',
    peak: '絶好調 ⤴',
  };

  return (
    <div className="flex-1 flex flex-col p-4 max-w-md mx-auto w-full space-y-4">
      {/* 着順判定ヘッダーカード */}
      <div className="bg-white rounded-2xl border border-amber-200/90 p-6 text-center shadow-md relative overflow-hidden">
        {/* 背景の装飾 */}
        <div className="absolute -right-4 -top-4 text-amber-500/10 text-9xl font-black select-none pointer-events-none">
          🏆
        </div>

        <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-900 border border-amber-200/80 text-xs font-bold px-3 py-1 rounded-full mb-3 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>
            Week {completedWeek} • {completedRaceInfo.raceName}（{completedRaceInfo.distanceText}） 確定
          </span>
        </div>

        {/* 着順表示バッジ */}
        <div className="my-2">
          <span
            className={`inline-flex items-center gap-1.5 text-lg font-black px-4 py-1.5 rounded-full border shadow-sm ${placement.badgeBg}`}
          >
            <Trophy className="w-5 h-5 shrink-0" />
            <span>{placement.rankText}</span>
          </span>
        </div>

        <h2 className="text-2xl font-black text-zinc-900 mt-2 mb-1">
          {placement.title}
        </h2>
        <p className="text-xs text-zinc-600 mb-4 px-2 leading-relaxed">
          {placement.comment}
        </p>

        {/* 成績・詳細スペック */}
        <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-zinc-100 text-center">
          <div className="bg-amber-50/60 rounded-xl p-3 border border-amber-100">
            <span className="text-[11px] text-amber-800 font-semibold block mb-0.5">
              出走馬（第{careerHorse.generation}世代）
            </span>
            <span className="text-sm font-black text-amber-950 flex items-center justify-center gap-1 flex-wrap">
              <span>{careerHorse.name}</span>
              <span className="text-[11px] font-normal text-amber-700">
                （{routeInfo.sexAgeLabel} / {careerHorse.color}）
              </span>
            </span>
          </div>
          <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-200/80">
            <span className="text-[11px] text-zinc-500 font-semibold block mb-0.5">
              レース正解率
            </span>
            <span className="text-base font-black text-zinc-900">
              {score} / {totalQuestions} 問
            </span>
          </div>
        </div>
      </div>

      {/* キャリアステージ進行カード */}
      {careerAdvance && (
        <div className="bg-linear-to-r from-emerald-800 to-emerald-950 text-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-700/70 border border-emerald-500/40 flex items-center justify-center shrink-0">
            <Flag className="w-5 h-5 text-amber-300" />
          </div>
          <div className="flex-1 text-left">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">
                Career Stage Progression
              </span>
              <span className="text-[11px] font-extrabold bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full">
                {nextStageLabel}
              </span>
            </div>
            {careerAdvance.steppedUp ? (
              <p className="text-xs font-bold text-white mt-1">
                Week {careerAdvance.completedWeek} を完走し、Week {careerAdvance.nextWeek} へステップアップしました！
              </p>
            ) : (
              <p className="text-xs font-bold text-white mt-1">
                Week 4 ラストラン（{completedRaceInfo.raceName}）を完走しました！
              </p>
            )}
          </div>
        </div>
      )}

      {/* 余力温存ボーナスカード（にんじん獲得） */}
      {addedCarrots > 0 && (
        <div className="bg-linear-to-r from-orange-50 via-amber-50 to-orange-100 border-2 border-orange-300 rounded-2xl p-4 shadow-sm flex items-center gap-3 animate-in fade-in zoom-in-95 duration-300">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-300 flex items-center justify-center text-3xl shrink-0">
            🥕
          </div>
          <div className="flex-1 text-left">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-800 bg-orange-200/60 px-2 py-0.5 rounded-full">
                余力温存ボーナス！
              </span>
              <span className="text-xs font-black text-orange-950">
                所持: {progress.carrotCount} / 3個
              </span>
            </div>
            <h4 className="text-sm font-bold text-orange-950 mt-1">
              にんじん 🥕 +{addedCarrots}個 を獲得！
            </h4>
            <p className="text-[11px] text-orange-900/80 leading-tight mt-0.5">
              余力を残してゴールした愛馬へのご褒美！万が一の未受講日を自動補填します。
            </p>
          </div>
        </div>
      )}

      {/* レース後フィードバックカード（馬体重・調子変動） */}
      <div className="bg-linear-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
            <span>🐴</span>
            <span>レース後フィードバック（愛馬の仕上がり）</span>
          </h3>
          <span className="text-[10px] font-bold bg-emerald-200/70 text-emerald-900 px-2 py-0.5 rounded-full">
            激闘の成果
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 my-2 text-xs">
          <div className="bg-white/80 rounded-xl p-2.5 border border-emerald-100">
            <span className="text-[10px] text-zinc-500 block">馬体重変動</span>
            <div className="font-extrabold text-zinc-800 flex items-baseline gap-1 mt-0.5">
              <span>{feedback.nextWeight} kg</span>
              <span className="text-[10px] text-emerald-700 font-bold">
                ({feedback.weightChange}kg 絞れました)
              </span>
            </div>
          </div>
          <div className="bg-white/80 rounded-xl p-2.5 border border-emerald-100">
            <span className="text-[10px] text-zinc-500 block">次走へ向けた調子</span>
            <div className="font-extrabold text-emerald-900 flex items-baseline gap-1 mt-0.5">
              <span>{conditionMap[feedback.nextCondition]}</span>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-emerald-900/90 leading-relaxed mt-1">
          💡 {feedback.comment}
        </p>
      </div>


      {/* レース出走フレーズ振り返り */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-600" />
            <span>Race Review / 出走フレーズ振り返り</span>
          </h3>
          <span className="text-[11px] font-bold text-zinc-500">
            全5問
          </span>
        </div>

        <div className="space-y-3">
          {answeredHistory.map((item, idx) => (
            <div
              key={item.phrase.id}
              className={`p-3 rounded-xl border transition-all text-xs ${
                item.isCorrect
                  ? 'bg-emerald-50/40 border-emerald-200'
                  : 'bg-red-50/40 border-red-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="text-[10px] font-bold text-zinc-500">
                  {idx + 1}展開目:
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.isCorrect
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {item.isCorrect ? (
                    <>
                      <Check className="w-3 h-3 stroke-[3]" /> 正解
                    </>
                  ) : (
                    <>
                      <X className="w-3 h-3 stroke-[3]" /> 不正解
                    </>
                  )}
                </span>
              </div>

              <blockquote className="font-extrabold text-sm text-zinc-900 mb-1 leading-snug">
                “{item.phrase.phrase}”
              </blockquote>
              <p className="text-[11px] font-semibold text-zinc-700 mb-1">
                意味: {item.phrase.options.find((o) => o.isCorrect)?.text}
              </p>
              <p className="text-[10px] text-zinc-500 leading-normal">
                💡 {item.phrase.explanation}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* アクションボタン */}
      <div className="space-y-2 pt-2">
        {isFinalCareerRace && onProceedToRetirement && (
          <button
            onClick={onProceedToRetirement}
            className="w-full bg-linear-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 active:scale-[0.98] transition-all text-amber-950 font-black py-4 px-4 rounded-xl shadow-md border border-amber-300 flex items-center justify-center gap-2 text-base cursor-pointer"
          >
            <Crown className="w-5 h-5 fill-amber-950 shrink-0" />
            <span>🌸 引退式セレモニーへ進む（第{careerHorse.generation}世代 完走）</span>
          </button>
        )}
        <button
          onClick={onGoHome}
          className={`w-full active:scale-[0.98] transition-all font-bold py-3.5 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 text-sm cursor-pointer ${
            isFinalCareerRace && onProceedToRetirement
              ? 'bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-300'
              : 'bg-emerald-700 hover:bg-emerald-800 text-white'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>ホーム（厩舎）に戻る</span>
        </button>
        <p className="text-[11px] text-center text-zinc-500">
          {isFinalCareerRace
            ? '※ 4週間のキャリアをすべて完走しました！引退式で称号を授与し、次世代の新馬を迎えましょう。'
            : '※ 週末レースの出走は1週末につき1回までです。次走へ向けて日々の坂路調教を重ねましょう！'}
        </p>
      </div>
    </div>
  );
};
