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
  BookOpen,
} from 'lucide-react';
import { soundManager } from '../lib/sound';
import {
  RACE_PHASES,
  getRacePhasesForWeek,
  getRaceThemeLabel,
  type RacePhase,
} from '../lib/raceMode';
import { eliminateOneWrongOption } from '../lib/conditionBonus';
import type { CareerRouteRace, HorseCoatColor } from '../types';
import { HorseSpriteAnimation } from './HorseSpriteAnimation';
import { SpeechButton } from './SpeechButton';
import { SpeechControls } from './SpeechControls';

interface RaceScreenProps {
  questions: PhraseItem[];
  currentIndex: number;
  horseColor?: HorseCoatColor;
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
  horseColor,
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
      {/* レース上部ヘッダー & プログレス（常時固定 sticky） */}
      <div className="sticky top-14 z-40 bg-[#FAF8F3]/95 backdrop-blur-xs -mt-4 pt-3 pb-2.5 -mx-4 px-4 border-b border-[#D8CEBE] shadow-2xs mb-3">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={onCancel}
            className="text-xs font-semibold text-stone-600 hover:text-stone-900 flex items-center gap-0.5 py-1 px-1.5 -ml-1.5 rounded-lg hover:bg-stone-200/60 transition-colors cursor-pointer shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>レース中止</span>
          </button>

          <div className="flex-1 flex flex-col items-end min-w-0">
            <div className="flex items-center justify-between w-full text-xs font-bold text-stone-900 mb-1 gap-2">
              <span className="text-[11px] text-[#6B3A1E] font-bold font-racing-serif flex items-center gap-1 truncate">
                <Trophy className="w-3.5 h-3.5 text-[#9A7418] shrink-0" />
                <span className="truncate">
                  {raceInfo
                    ? `Week ${raceInfo.week} • ${raceInfo.raceName}（${raceInfo.distanceText}）`
                    : '海外G1レース'}
                </span>
              </span>
              <span className="shrink-0 font-racing-num">
                {currentIndex + 1} / {questions.length} 展開
              </span>
            </div>
            <div className="w-full bg-[#DED6C6] h-2 rounded-full overflow-hidden">
              <div
                className="bg-linear-to-r from-[#6B3A1E] via-[#9A7418] to-[#C59B27] h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* レース展開・実況ステータスカード（本馬場ターフビジョン・着順掲示板仕様） */}
      <div className="bg-linear-to-r from-[#0F3926] via-[#0B2A1C] to-[#1D1508] text-[#FAF8F3] rounded-2xl p-3.5 mb-3 shadow-md border border-[#C59B27]/65 racing-stitch-border relative overflow-hidden">
        <div className="flex items-center justify-between mb-1.5 gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[11px] font-extrabold tracking-widest uppercase text-[#E6C762] flex items-center gap-1">
              <Radio className="w-3 h-3 text-red-400" />
              LIVE RACE COMMENTARY
            </span>
          </div>
          <span className="text-[10px] font-bold font-racing-num bg-black/45 text-[#E6C762] border border-[#C59B27]/50 px-2 py-0.5 rounded-xs shrink-0">
            {currentPhase.distanceRemaining}
          </span>
        </div>

        <div className="flex items-baseline justify-between gap-2 flex-wrap">
          <h3 className="text-base font-bold text-[#FAF8F3] font-racing-serif">
            【{currentPhase.phaseName}】
          </h3>
          {raceInfo && (
            <span className="text-[10px] font-semibold text-[#C8D8CE] bg-black/35 border border-[#C59B27]/35 px-2 py-0.5 rounded-xs">
              テーマ: {getRaceThemeLabel(raceInfo.themeCategory)}
            </span>
          )}
        </div>

        <p className="text-xs text-[#E5EDE8] mt-1 leading-relaxed">
          {currentPhase.commentary}
        </p>
      </div>

      {/* 週末レース全力疾走アニメーション（首振りモーション付き・濃紺ゼッケン1番・芝/ダート背景連動） */}
      {horseColor && (
        <div className="mb-3">
          <HorseSpriteAnimation
            color={horseColor}
            scene="race_gallop"
            raceSurface={raceInfo?.surface}
          />
        </div>
      )}

      {/* 英文問題カード（レーシングプログラム仕様） */}
      <div className="bg-[#FFFDF9] border border-[#C59B27]/60 rounded-2xl p-4 shadow-xs mb-3 relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-linear-to-r from-[#6B3A1E] via-[#C59B27] to-[#0D3322]" />
        <div className="flex items-center justify-between mb-2 gap-2 flex-wrap pt-0.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-extrabold text-[#8A6D1B] tracking-widest uppercase">
              {currentItem.type === 'vocabulary' ? 'TARGET VOCABULARY' : 'TARGET PHRASE'}
            </span>
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-xs border ${
                currentItem.type === 'vocabulary'
                  ? 'bg-[#FBF5E9] text-[#6B3A1E] border-[#DEC49A]'
                  : 'bg-[#EEF5F0] text-[#0D3322] border-[#B4CEBD]'
              }`}
            >
              <BookOpen className="w-2.5 h-2.5 shrink-0" />
              <span>{currentItem.type === 'vocabulary' ? '基礎単語' : '実戦フレーズ'}</span>
            </span>
          </div>
          <SpeechControls compact />
        </div>
        <div className="flex items-start justify-between gap-3">
          <blockquote className="text-xl font-bold text-stone-900 font-racing-serif leading-snug tracking-tight flex-1">
            “{currentItem.phrase}”
          </blockquote>
          <SpeechButton text={currentItem.phrase} size="sm" showLabel label="発音" />
        </div>
      </div>

      {/* 問いかけ & 調教ヒントボタン */}
      <div className="flex items-center justify-between mb-2 px-1 gap-2">
        <p className="text-xs font-bold text-stone-700">
          状況に最も適した日本語の意味を選んでください：
        </p>
        {initialHints > 0 && (
          <button
            onClick={handleUseHint}
            disabled={isAnswered || hintsRemaining <= 0 || eliminatedOptionIds.length >= 2}
            className={`inline-flex items-center gap-1 text-[11px] font-extrabold font-racing-num px-2.5 py-1 rounded-sm border transition-all cursor-pointer shrink-0 ${
              hintsRemaining > 0 && !isAnswered && eliminatedOptionIds.length < 2
                ? 'bg-[#FDF6E2] hover:bg-[#F8EBC7] text-[#5C3A08] border-[#C59B27] shadow-2xs active:scale-[0.96]'
                : 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed opacity-60'
            }`}
            title="平日の調教成果！不正解の選択肢を1つ除外します（温存してゴールするとにんじん🥕を獲得できます）"
          >
            <Zap className={`w-3 h-3 ${hintsRemaining > 0 ? 'text-[#9A7418] fill-[#C59B27]' : 'text-stone-400'}`} />
            <span>愛馬の余力 (残{hintsRemaining}回)</span>
          </button>
        )}
      </div>

      {/* 4択選択肢リスト（重賞仕様濃紺ゼッケンバッジ） */}
      <div className="space-y-2 mb-3">
        {currentItem.options.map((option, index) => {
          const isCurrentSelected = option.id === selectedOptionId;
          const isTargetCorrect = option.isCorrect;
          const isEliminated = eliminatedOptionIds.includes(option.id);

          let btnStyle =
            'bg-[#FFFDF9] border-[#D4C9B5] text-stone-900 hover:border-[#9A7418] hover:bg-[#FDF9F0]';
          let badgeStyle = 'bg-[#102542] text-[#FAF8F3] border border-[#C59B27]';

          if (isEliminated) {
            btnStyle =
              'bg-stone-100/70 border-stone-200 text-stone-400 opacity-35 line-through cursor-not-allowed select-none';
            badgeStyle = 'bg-stone-200 text-stone-400 border border-stone-300';
          } else if (isAnswered) {
            if (isTargetCorrect) {
              btnStyle =
                'bg-[#EEF6F0] border-[#0D3322] text-[#0D3322] font-semibold ring-1 ring-[#0D3322]/30';
              badgeStyle = 'bg-[#0D3322] text-[#E6C762] border border-[#C59B27]';
            } else if (isCurrentSelected) {
              btnStyle = 'bg-red-50 border-red-500 text-red-950 ring-1 ring-red-500/30';
              badgeStyle = 'bg-red-600 text-white border border-red-300';
            } else {
              btnStyle = 'bg-[#F5F2EB] border-[#E0D8C8] text-stone-400 opacity-60';
              badgeStyle = 'bg-stone-200 text-stone-400 border border-stone-300';
            }
          }

          const optionLabels = ['A', 'B', 'C', 'D'];

          return (
            <button
              key={option.id}
              onClick={() => handleSelectOption(option)}
              disabled={isAnswered || isEliminated}
              className={`group w-full min-h-[58px] p-3 rounded-xl border-2 text-left transition-all duration-150 flex items-center justify-between gap-3 text-sm cursor-pointer active:scale-[0.98] ${btnStyle}`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`saddle-cloth-badge w-7 h-7 text-xs shrink-0 transition-colors ${badgeStyle}`}
                >
                  {optionLabels[index]}
                </span>
                <span className="leading-snug font-medium">{option.text}</span>
              </div>

              {isEliminated && (
                <span className="text-[10px] font-bold text-stone-400 border border-stone-300 rounded-xs px-1.5 py-0.5 shrink-0">
                  除外
                </span>
              )}

              {isAnswered && isTargetCorrect && (
                <div className="w-6 h-6 rounded-full bg-[#0D3322] text-[#E6C762] flex items-center justify-center shrink-0">
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
        <div className="bg-[#FFFDF9] rounded-2xl border border-[#C59B27]/60 p-4 shadow-sm animate-in fade-in duration-200 space-y-3">
          {/* 実況リアクション */}
          <div
            className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs font-bold ${
              isCorrect
                ? 'bg-[#EEF6F0] text-[#0D3322] border-[#9EC5AC]'
                : 'bg-red-50 text-red-950 border-red-200'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white ${
                isCorrect ? 'bg-[#0D3322]' : 'bg-red-600'
              }`}
            >
              {isCorrect ? <Check className="w-4 h-4 text-[#E6C762]" /> : <X className="w-4 h-4" />}
            </div>
            <div>
              <p className="font-bold font-racing-serif text-[13px]">
                {isCorrect ? '実況: 好展開' : '実況: 苦しい展開'}
              </p>
              <p className="font-medium text-xs mt-0.5">
                {isCorrect ? currentPhase.correctReaction : currentPhase.incorrectReaction}
              </p>
            </div>
          </div>

          {/* 解説 */}
          <div className="bg-[#F7F4EC] rounded-xl p-3 border border-[#DFD6C5] text-xs text-stone-900 space-y-1">
            <div className="flex items-center gap-1 font-bold text-[#6B3A1E]">
              <Lightbulb className="w-3.5 h-3.5 text-[#9A7418]" />
              <span>ワンポイント解説</span>
            </div>
            <p className="text-stone-700 leading-relaxed text-[13px]">
              {currentItem.explanation}
            </p>
          </div>

          {/* 次へ進むボタン */}
          <button
            onClick={handleNextClick}
            className="w-full bg-linear-to-r from-[#6B3A1E] to-[#4A2511] hover:from-[#7D4423] hover:to-[#5C2E15] active:scale-[0.98] transition-all text-[#FAF8F3] border border-[#C59B27]/60 font-bold py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 text-sm cursor-pointer"
          >
            {isLastQuestion ? (
              <>
                <Flag className="w-4 h-4 text-[#E6C762]" />
                <span>ゴール — 着順確定へ</span>
              </>
            ) : (
              <>
                <span>次の展開へ</span>
                <ArrowRight className="w-4 h-4 text-[#E6C762]" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
