import React, { useState } from 'react';
import type { PhraseItem, QuizOption } from '../data/phrases';
import { Check, X, ArrowRight, Lightbulb, ChevronLeft } from 'lucide-react';
import { soundManager } from '../lib/sound';

interface QuizScreenProps {
  questions: PhraseItem[];
  currentIndex: number;
  onAnswer: (optionId: string, isCorrect: boolean) => void;
  onNext: () => void;
  onCancel: () => void;
}

export const QuizScreen: React.FC<QuizScreenProps> = ({
  questions,
  currentIndex,
  onAnswer,
  onNext,
  onCancel,
}) => {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const currentItem = questions[currentIndex];
  const isAnswered = selectedOptionId !== null;

  const handleSelectOption = (option: QuizOption) => {
    if (isAnswered) return;
    setSelectedOptionId(option.id);
    onAnswer(option.id, option.isCorrect);

    // SE再生 (Web Audio API)
    if (option.isCorrect) {
      soundManager.playCorrect();
    } else {
      soundManager.playIncorrect();
    }
  };

  const handleNextClick = () => {
    setSelectedOptionId(null);
    onNext();
  };

  const selectedOption = currentItem.options.find((opt) => opt.id === selectedOptionId);
  const isCorrect = selectedOption?.isCorrect ?? false;
  const progressPercent = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="flex-1 flex flex-col p-4 max-w-md mx-auto w-full">
      {/* 上部ヘッダー & プログレス（常時固定 sticky） */}
      <div className="sticky top-14 z-40 bg-zinc-50/95 backdrop-blur-xs -mt-4 pt-3 pb-2.5 -mx-4 px-4 border-b border-zinc-200/60 shadow-2xs mb-3">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={onCancel}
            className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 flex items-center gap-0.5 py-1 px-1.5 -ml-1.5 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>中断</span>
          </button>

          <div className="flex-1 flex flex-col items-end">
            <div className="flex items-center justify-between w-full text-xs font-bold text-emerald-950 mb-1">
              <span className="text-[11px] text-zinc-500 font-medium">
                {currentItem?.type === 'vocabulary' ? 'ウッドチップ調教' : '坂路調教'}
              </span>
              <span>{currentIndex + 1} / {questions.length} 問</span>
            </div>
            <div className="w-full bg-zinc-200/70 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* シチュエーションバッジ */}
      <div className="mb-2">
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2.5 py-0.5 rounded-full shadow-2xs">
          <span>🎙️</span>
          <span>{currentItem.situation}</span>
        </span>
      </div>

      {/* 英文フレーズカード */}
      <div className="bg-white border-2 border-emerald-700/20 rounded-2xl p-4 shadow-2xs mb-3">
        <p className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase mb-1">
          Target Phrase
        </p>
        <blockquote className="text-xl font-extrabold text-zinc-900 leading-snug tracking-tight">
          “{currentItem.phrase}”
        </blockquote>
      </div>

      {/* 問いかけ */}
      <p className="text-xs font-bold text-zinc-600 mb-2 px-1">
        最もふさわしい日本語の意味を選んでください：
      </p>

      {/* 4択選択肢リスト */}
      <div className="space-y-2 mb-3">
        {currentItem.options.map((option, index) => {
          const isCurrentSelected = option.id === selectedOptionId;
          const isTargetCorrect = option.isCorrect;

          let buttonStyle = 'bg-white border-zinc-200 hover:border-emerald-500 hover:bg-emerald-50/30 text-zinc-800 shadow-2xs active:scale-[0.98] transition-transform duration-100';
          let badgeStyle = 'bg-zinc-100 text-zinc-600';
          let animationStyle = '';

          if (isAnswered) {
            if (isTargetCorrect) {
              buttonStyle = 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/20 scale-[1.01]';
              badgeStyle = 'bg-emerald-600 text-white';
              animationStyle = 'animate-pop';
            } else if (isCurrentSelected && !isTargetCorrect) {
              buttonStyle = 'bg-rose-50 border-rose-400 text-rose-950 ring-2 ring-rose-400/20';
              badgeStyle = 'bg-rose-500 text-white';
              animationStyle = 'animate-shake';
            } else {
              buttonStyle = 'bg-zinc-50 border-zinc-200 text-zinc-400 opacity-60';
              badgeStyle = 'bg-zinc-100 text-zinc-400';
            }
          }

          const optionLabels = ['A', 'B', 'C', 'D'];

          return (
            <button
              key={option.id}
              onClick={() => handleSelectOption(option)}
              disabled={isAnswered}
              className={`w-full min-h-[58px] text-left p-3.5 rounded-xl border-2 transition-all flex items-start gap-3 cursor-pointer ${buttonStyle} ${animationStyle}`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 transition-colors ${badgeStyle}`}>
                {optionLabels[index]}
              </span>
              <span className="text-sm font-semibold leading-relaxed flex-1 select-none">
                {option.text}
              </span>
              {isAnswered && isTargetCorrect && (
                <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5 animate-in zoom-in-50" />
              )}
              {isAnswered && isCurrentSelected && !isTargetCorrect && (
                <X className="w-5 h-5 text-rose-500 shrink-0 mt-0.5 animate-in zoom-in-50" />
              )}
            </button>
          );
        })}
      </div>

      {/* 解答後フィードバック・解説カード */}
      {isAnswered && (
        <div className={`mt-auto rounded-2xl p-3.5 border shadow-xs animate-in fade-in-50 slide-in-from-bottom-3 duration-200 ${
          isCorrect ? 'bg-emerald-50/95 border-emerald-200' : 'bg-rose-50/95 border-rose-200'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {isCorrect ? (
              <span className="inline-flex items-center gap-1 font-black text-emerald-900 text-sm">
                <span className="text-lg">⭕</span> 見事な手応え！ 正解
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-black text-rose-900 text-sm">
                <span className="text-lg">❌</span> 惜しい！
              </span>
            )}
          </div>

          <div className="bg-white/90 rounded-xl p-3 border border-zinc-200/60 mb-2.5">
            <div className="flex items-start gap-1.5 text-xs text-zinc-800 leading-relaxed">
              <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-zinc-900 mb-0.5">競馬ファンのワンポイント解説</span>
                <span>{currentItem.explanation}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleNextClick}
            className="w-full bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] transition-all text-white font-bold py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 text-sm cursor-pointer"
          >
            <span>{currentIndex + 1 < questions.length ? '次の問題へ' : '調教結果を見る'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
