import { useEffect, type FC } from 'react';
import type { PhraseItem } from '../data/phrases';
import type { UserProgress } from '../types';
import { Trophy, Home, RotateCcw, Check, X, Sparkles, Award } from 'lucide-react';
import { soundManager } from '../lib/sound';
import { calculateRacePlacement, type RacePlacement } from '../lib/raceMode';

interface RaceResultScreenProps {
  score: number;
  totalQuestions: number;
  progress: UserProgress;
  answeredHistory: {
    phrase: PhraseItem;
    selectedOptionId: string;
    isCorrect: boolean;
  }[];
  onGoHome: () => void;
  onRetryRace: () => void;
}

export const RaceResultScreen: FC<RaceResultScreenProps> = ({
  score,
  totalQuestions,
  progress,
  answeredHistory,
  onGoHome,
  onRetryRace,
}) => {
  const placement: RacePlacement = calculateRacePlacement(score);
  const isWinner = placement.type === '1st';
  const isSecond = placement.type === '2nd';

  // 画面マウント時にファンファーレ等のSEを再生
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isWinner || isSecond) {
        soundManager.playFanfare();
      } else {
        soundManager.playStamp();
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [isWinner, isSecond]);

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
          <span>ロンシャン 芝2400m（海外G1） 確定</span>
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
              出走馬
            </span>
            <span className="text-sm font-black text-amber-950 flex items-center justify-center gap-1">
              <span>{progress.horseName}</span>
              <span className="text-[11px] font-normal text-amber-700">（牡3）</span>
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
        <button
          onClick={onRetryRace}
          className="w-full bg-amber-600 hover:bg-amber-700 active:scale-[0.98] transition-all text-white font-bold py-3.5 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 text-sm cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>もう一度レースに出走する</span>
        </button>

        <button
          onClick={onGoHome}
          className="w-full bg-white hover:bg-zinc-100 active:scale-[0.98] transition-all text-zinc-700 font-bold py-3 px-4 rounded-xl border border-zinc-200 flex items-center justify-center gap-2 text-sm cursor-pointer"
        >
          <Home className="w-4 h-4" />
          <span>ホーム（厩舎）に戻る</span>
        </button>
      </div>
    </div>
  );
};
