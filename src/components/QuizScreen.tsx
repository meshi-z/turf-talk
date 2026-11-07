import React, { useState } from 'react';
import type { PhraseItem, QuizOption } from '../data/phrases';
import {
  Check,
  X,
  ArrowRight,
  Lightbulb,
  ChevronLeft,
  Radio,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { soundManager } from '../lib/sound';
import type { HorseCoatColor, TrainingCourse } from '../types';
import { HorseSpriteAnimation } from './HorseSpriteAnimation';
import { SpeechButton } from './SpeechButton';
import { SpeechControls } from './SpeechControls';

interface QuizScreenProps {
  questions: PhraseItem[];
  currentIndex: number;
  horseColor?: HorseCoatColor;
  course?: TrainingCourse;
  onAnswer: (optionId: string, isCorrect: boolean) => void;
  onNext: () => void;
  onCancel: () => void;
}

export const QuizScreen: React.FC<QuizScreenProps> = ({
  questions,
  currentIndex,
  horseColor,
  course,
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
      <div className="sticky top-14 z-40 bg-[#FAF8F3]/95 backdrop-blur-xs -mt-4 pt-3 pb-2.5 -mx-4 px-4 border-b border-[#D8CEBE] shadow-2xs mb-3">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={onCancel}
            className="text-xs font-semibold text-stone-600 hover:text-stone-900 flex items-center gap-0.5 py-1 px-1.5 -ml-1.5 rounded-lg hover:bg-stone-200/60 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>中断</span>
          </button>

          <div className="flex-1 flex flex-col items-end">
            <div className="flex items-center justify-between w-full text-xs font-bold text-[#0D3322] mb-1">
              <span className="text-[11px] text-stone-600 font-semibold font-racing-serif">
                {currentItem?.type === 'vocabulary' ? '第2コース：ウッドチップ調教' : '第1コース：坂路調教'}
              </span>
              <span className="font-racing-num">{currentIndex + 1} / {questions.length} 問</span>
            </div>
            <div className="w-full bg-[#DED6C6] h-2 rounded-full overflow-hidden">
              <div
                className="bg-linear-to-r from-[#0D3322] to-[#1D6344] h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 平日調教疾走アニメーション（白ゼッケン・コース背景連動） */}
      {horseColor && (
        <div className="mb-3">
          <HorseSpriteAnimation
            color={horseColor}
            scene="training_gallop"
            courseType={course}
          />
        </div>
      )}

      {/* シチュエーションバッジ */}
      <div className="mb-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-[#EEF5F0] text-[#0D3322] border border-[#B4CEBD] px-2.5 py-0.5 rounded-xs shadow-2xs">
          <Radio className="w-3 h-3 text-[#0D3322] shrink-0" />
          <span>{currentItem.situation}</span>
        </span>
      </div>

      {/* 英文フレーズカード（レーシングプログラム仕様） */}
      <div className="bg-[#FFFDF9] border border-[#C59B27]/50 rounded-2xl p-4 shadow-xs mb-3 relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-linear-to-r from-[#0D3322] via-[#C59B27] to-[#0D3322]" />
        <div className="flex items-center justify-between gap-2 mb-2 pt-0.5">
          <p className="text-[10px] font-extrabold text-[#8A6D1B] tracking-widest uppercase">
            {currentItem.type === 'vocabulary' ? 'Target Vocabulary' : 'Target Phrase'}
          </p>
          <SpeechControls compact />
        </div>
        <div className="flex items-start justify-between gap-3">
          <blockquote className="text-xl font-bold text-stone-900 font-racing-serif leading-snug tracking-tight flex-1">
            “{currentItem.phrase}”
          </blockquote>
          <SpeechButton text={currentItem.phrase} size="sm" showLabel label="発音" />
        </div>
      </div>

      {/* 問いかけ */}
      <p className="text-xs font-bold text-stone-700 mb-2 px-1">
        最もふさわしい日本語の意味を選んでください：
      </p>

      {/* 4択選択肢リスト（ゼッケン番号バッジ仕様） */}
      <div className="space-y-2 mb-3">
        {currentItem.options.map((option, index) => {
          const isCurrentSelected = option.id === selectedOptionId;
          const isTargetCorrect = option.isCorrect;

          let buttonStyle =
            'bg-[#FFFDF9] border-[#D4C9B5] hover:border-[#0D3322] hover:bg-[#F3F7F4] text-stone-900 shadow-2xs active:scale-[0.98] transition-transform duration-100';
          let badgeStyle = 'bg-[#0D3322] text-[#FAF8F3] border border-[#C59B27]/70';
          let animationStyle = '';

          if (isAnswered) {
            if (isTargetCorrect) {
              buttonStyle =
                'bg-[#EEF6F0] border-[#0D3322] text-[#0D3322] ring-2 ring-[#0D3322]/20 scale-[1.01]';
              badgeStyle = 'bg-[#0D3322] text-[#E6C762] border border-[#C59B27]';
              animationStyle = 'animate-pop';
            } else if (isCurrentSelected && !isTargetCorrect) {
              buttonStyle = 'bg-rose-50 border-rose-500 text-rose-950 ring-2 ring-rose-400/20';
              badgeStyle = 'bg-rose-600 text-white border border-rose-300';
              animationStyle = 'animate-shake';
            } else {
              buttonStyle = 'bg-[#F5F2EB] border-[#E0D8C8] text-stone-400 opacity-60';
              badgeStyle = 'bg-stone-200 text-stone-400 border border-stone-300';
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
              <span
                className={`saddle-cloth-badge w-6.5 h-6.5 text-xs shrink-0 mt-0.5 transition-colors ${badgeStyle}`}
              >
                {optionLabels[index]}
              </span>
              <span className="text-sm font-semibold leading-relaxed flex-1 select-none">
                {option.text}
              </span>
              {isAnswered && isTargetCorrect && (
                <Check className="w-5 h-5 text-[#0D3322] shrink-0 mt-0.5 animate-in zoom-in-50" />
              )}
              {isAnswered && isCurrentSelected && !isTargetCorrect && (
                <X className="w-5 h-5 text-rose-600 shrink-0 mt-0.5 animate-in zoom-in-50" />
              )}
            </button>
          );
        })}
      </div>

      {/* 解答後フィードバック・解説カード */}
      {isAnswered && (
        <div
          className={`mt-auto rounded-2xl p-3.5 border shadow-xs animate-in fade-in-50 slide-in-from-bottom-3 duration-200 ${
            isCorrect ? 'bg-[#EEF6F0] border-[#9EC5AC]' : 'bg-rose-50/95 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            {isCorrect ? (
              <span className="inline-flex items-center gap-1.5 font-bold font-racing-serif text-[#0D3322] text-sm">
                <CheckCircle2 className="w-4 h-4 text-[#0D3322] shrink-0" />
                <span>見事な手応え — 正解</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 font-bold font-racing-serif text-rose-900 text-sm">
                <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>惜しい — 次走へ向けて復習</span>
              </span>
            )}
          </div>

          <div className="bg-[#FFFDF9] rounded-xl p-3 border border-[#D8CEBE] mb-2.5">
            <div className="flex items-start gap-2 text-xs text-stone-800 leading-relaxed">
              <Lightbulb className="w-4 h-4 text-[#9A7418] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-[#0D3322] mb-0.5">
                  競馬ファンのワンポイント解説
                </span>
                <span>{currentItem.explanation}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleNextClick}
            className="w-full bg-[#0D3322] hover:bg-[#164B33] active:scale-[0.98] transition-all text-[#FAF8F3] border border-[#C59B27]/50 font-bold py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 text-sm cursor-pointer"
          >
            <span>{currentIndex + 1 < questions.length ? '次の問題へ' : '調教結果を見る'}</span>
            <ArrowRight className="w-4 h-4 text-[#E6C762]" />
          </button>
        </div>
      )}
    </div>
  );
};
