import React, { useState } from 'react';
import type { PhraseItem, QuizOption } from '../data/phrases';
import {
  Trophy,
  ChevronLeft,
  Check,
  X,
  ArrowRight,
  Lightbulb,
  Radio,
  Flag,
  Zap,
} from 'lucide-react';
import { soundManager } from '../lib/sound';
import {
  RACE_PHASES,
  getRacePhasesForWeek,
  getRaceThemeLabel,
  type RacePhase,
} from '../lib/raceMode';
import { eliminateOneWrongOption } from '../lib/conditionBonus';
import type { CareerRouteRace } from '../types';

interface RaceScreenProps {
  questions: PhraseItem[];
  currentIndex: number;
  initialHints?: number;
  raceInfo?: CareerRouteRace;
  onAnswer: (optionId: string, isCorrect: boolean) => void;
  onNext: () => void;
  onCancel: () => void;
  onHintsRemainingChange?: (remaining: number) => void;
}

export const RaceScreen: React.FC<RaceScreenProps> = ({
  questions,
  currentIndex,
  initialHints = 0,
  raceInfo,
  onAnswer,
  onNext,
  onCancel,
  onHintsRemainingChange,
}) => {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [hintsRemaining, setHintsRemaining] = useState<number>(initialHints);
  const [eliminatedOptionIds, setEliminatedOptionIds] = useState<string[]>([]);

  const currentItem = questions[currentIndex];
  const isAnswered = selectedOptionId !== null;

  const phases: readonly RacePhase[] = raceInfo
    ? getRacePhasesForWeek(raceInfo.week, raceInfo)
    : RACE_PHASES;
  const currentPhase: RacePhase =
    phases[currentIndex] ?? phases[phases.length - 1];

  const handleSelectOption = (option: QuizOption) => {
    if (isAnswered || eliminatedOptionIds.includes(option.id)) return;
    setSelectedOptionId(option.id);
    onAnswer(option.id, option.isCorrect);

    if (option.isCorrect) {
      soundManager.playCorrect();
    } else {
      soundManager.playIncorrect();
    }
  };

  const handleUseHint = () => {
    if (isAnswered || hintsRemaining <= 0) return;
    const toEliminate = eliminateOneWrongOption(currentItem.options, eliminatedOptionIds);
    if (!toEliminate) return;

    soundManager.playHint();
    setEliminatedOptionIds((prev) => [...prev, toEliminate]);
    const nextRemaining = hintsRemaining - 1;
    setHintsRemaining(nextRemaining);
    onHintsRemainingChange?.(nextRemaining);
  };

  const handleNextClick = () => {
    setSelectedOptionId(null);
    setEliminatedOptionIds([]);
    onNext();
  };

  const selectedOption = currentItem.options.find((opt) => opt.id === selectedOptionId);
  const isCorrect = selectedOption?.isCorrect ?? false;
  const progressPercent = ((currentIndex + 1) / questions.length) * 100;
  const isLastQuestion = currentIndex + 1 === questions.length;

  return (
    <div className="flex-1 flex flex-col p-4 max-w-md mx-auto w-full">
      {/* レース上部ヘッダー & プログレス */}
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <button
          onClick={onCancel}
          className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 flex items-center gap-0.5 py-1 px-1.5 -ml-1.5 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer shrink-0"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>レース中止</span>
        </button>

        <div className="flex-1 flex flex-col items-end min-w-0">
          <div className="flex items-center justify-between w-full text-xs font-bold text-amber-950 mb-1 gap-2">
            <span className="text-[11px] text-amber-800 font-bold flex items-center gap-1 truncate">
              <Trophy className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="truncate">
                {raceInfo
                  ? `Week ${raceInfo.week} • ${raceInfo.raceName}（${raceInfo.distanceText}）`
                  : '海外G1レース'}
              </span>
            </span>
            <span className="shrink-0">
              {currentIndex + 1} / {questions.length} 展開
            </span>
          </div>
          <div className="w-full bg-amber-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-amber-600 h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* レース展開・実況ステータスカード */}
      <div className="bg-linear-to-r from-amber-700 via-amber-800 to-amber-900 text-white rounded-2xl p-3.5 mb-3 shadow-md border border-amber-600/40 relative overflow-hidden">
        <div className="flex items-center justify-between mb-1.5 gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            <span className="text-[11px] font-extrabold tracking-wider uppercase text-amber-200 flex items-center gap-1">
              <Radio className="w-3 h-3 text-red-400" />
              LIVE RACE COMMENTARY
            </span>
          </div>
          <span className="text-[10px] font-bold bg-amber-950/60 text-amber-200 border border-amber-400/30 px-2 py-0.5 rounded-full shrink-0">
            {currentPhase.distanceRemaining}
          </span>
        </div>

        <div className="flex items-baseline justify-between gap-2 flex-wrap">
          <h3 className="text-base font-extrabold text-white">
            【{currentPhase.phaseName}】
          </h3>
          {raceInfo && (
            <span className="text-[10px] font-semibold text-amber-200/95 bg-amber-950/50 border border-amber-500/30 px-2 py-0.5 rounded-md">
              テーマ: {getRaceThemeLabel(raceInfo.themeCategory)}
            </span>
          )}
        </div>

        <p className="text-xs text-amber-100/90 mt-1 leading-relaxed">
          {currentPhase.commentary}
        </p>
      </div>

      {/* 英文フレーズカード */}
      <div className="bg-white border-2 border-amber-600/30 rounded-2xl p-4 shadow-2xs mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase">
            TARGET PHRASE
          </span>
          <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
            {currentItem.situation}
          </span>
        </div>
        <blockquote className="text-xl font-extrabold text-zinc-900 leading-snug tracking-tight">
          “{currentItem.phrase}”
        </blockquote>
      </div>

      {/* 問いかけ & 調教ヒントボタン */}
      <div className="flex items-center justify-between mb-2 px-1">
        <p className="text-xs font-bold text-zinc-600">
          状況に最も適した日本語の意味を選んでください：
        </p>
        {initialHints > 0 && (
          <button
            onClick={handleUseHint}
            disabled={isAnswered || hintsRemaining <= 0 || eliminatedOptionIds.length >= 2}
            className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
              hintsRemaining > 0 && !isAnswered && eliminatedOptionIds.length < 2
                ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300 shadow-2xs active:scale-[0.96]'
                : 'bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed opacity-60'
            }`}
            title="平日の調教成果！不正解の選択肢を1つ除外します（温存してゴールするとにんじん🥕を獲得できます）"
          >
            <Zap className={`w-3 h-3 ${hintsRemaining > 0 ? 'text-amber-600 fill-amber-500' : 'text-zinc-400'}`} />
            <span>愛馬の余力 (残{hintsRemaining}回)</span>
          </button>
        )}
      </div>

      {/* 4択選択肢リスト */}
      <div className="space-y-2 mb-3">
        {currentItem.options.map((option, index) => {
          const isCurrentSelected = option.id === selectedOptionId;
          const isTargetCorrect = option.isCorrect;
          const isEliminated = eliminatedOptionIds.includes(option.id);

          let btnStyle = 'bg-white border-zinc-200/90 text-zinc-800 hover:border-amber-400 hover:bg-amber-50/30';
          let badgeStyle = 'bg-zinc-100 text-zinc-600 group-hover:bg-amber-100 group-hover:text-amber-900';

          if (isEliminated) {
            btnStyle = 'bg-zinc-100/70 border-zinc-200 text-zinc-400 opacity-35 line-through cursor-not-allowed select-none';
            badgeStyle = 'bg-zinc-200 text-zinc-400';
          } else if (isAnswered) {
            if (isTargetCorrect) {
              btnStyle = 'bg-emerald-50 border-emerald-500 text-emerald-950 font-semibold ring-1 ring-emerald-500/30';
              badgeStyle = 'bg-emerald-600 text-white';
            } else if (isCurrentSelected) {
              btnStyle = 'bg-red-50 border-red-500 text-red-950 ring-1 ring-red-500/30';
              badgeStyle = 'bg-red-600 text-white';
            } else {
              btnStyle = 'bg-zinc-50 border-zinc-200 text-zinc-400 opacity-60';
              badgeStyle = 'bg-zinc-200 text-zinc-400';
            }
          }

          const optionLabels = ['A', 'B', 'C', 'D'];

          return (
            <button
              key={option.id}
              onClick={() => handleSelectOption(option)}
              disabled={isAnswered || isEliminated}
              className={`group w-full min-h-[58px] p-3 rounded-xl border text-left transition-all duration-150 flex items-center justify-between gap-3 text-sm cursor-pointer active:scale-[0.98] ${btnStyle}`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${badgeStyle}`}
                >
                  {optionLabels[index]}
                </span>
                <span className="leading-snug">{option.text}</span>
              </div>

              {isEliminated && (
                <span className="text-[10px] font-bold text-zinc-400 border border-zinc-300 rounded px-1.5 py-0.5 shrink-0">
                  除外
                </span>
              )}

              {isAnswered && isTargetCorrect && (
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
              )}
              {isAnswered && isCurrentSelected && !isTargetCorrect && (
                <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0">
                  <X className="w-4 h-4 stroke-[3]" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* 解答後の実況リアクション & 解説エリア */}
      {isAnswered && (
        <div className="bg-white rounded-2xl border border-amber-200/90 p-4 shadow-sm animate-in fade-in duration-200 space-y-3">
          {/* 実況リアクション */}
          <div
            className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs font-bold ${
              isCorrect
                ? 'bg-emerald-50 text-emerald-950 border-emerald-200'
                : 'bg-red-50 text-red-950 border-red-200'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white ${
                isCorrect ? 'bg-emerald-600' : 'bg-red-600'
              }`}
            >
              {isCorrect ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
            </div>
            <div>
              <p className="font-extrabold text-[13px]">
                {isCorrect ? '実況: 好展開！' : '実況: ピンチ！'}
              </p>
              <p className="font-medium text-xs mt-0.5">
                {isCorrect ? currentPhase.correctReaction : currentPhase.incorrectReaction}
              </p>
            </div>
          </div>

          {/* 解説 */}
          <div className="bg-amber-50/50 rounded-xl p-3 border border-amber-100 text-xs text-amber-950 space-y-1">
            <div className="flex items-center gap-1 font-bold text-amber-900">
              <Lightbulb className="w-3.5 h-3.5 text-amber-700" />
              <span>ワンポイント解説</span>
            </div>
            <p className="text-zinc-700 leading-relaxed text-[13px]">
              {currentItem.explanation}
            </p>
          </div>

          {/* 次へ進むボタン */}
          <button
            onClick={handleNextClick}
            className="w-full bg-amber-600 hover:bg-amber-700 active:scale-[0.98] transition-all text-white font-bold py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 text-sm cursor-pointer"
          >
            {isLastQuestion ? (
              <>
                <Flag className="w-4 h-4 fill-white" />
                <span>ゴール！着順判定へ 🏁</span>
              </>
            ) : (
              <>
                <span>次の展開へ</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
