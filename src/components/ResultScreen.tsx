import type { FC } from 'react';
import type { PhraseItem } from '../data/phrases';
import type { UserProgress } from '../types';
import { TrendingUp, Home, Sparkles } from 'lucide-react';

interface ResultScreenProps {
  score: number;
  totalQuestions: number;
  progress: UserProgress;
  answeredHistory: {
    phrase: PhraseItem;
    selectedOptionId: string;
    isCorrect: boolean;
  }[];
  onGoHome: () => void;
}

export const ResultScreen: FC<ResultScreenProps> = ({
  score,
  totalQuestions,
  progress,
  answeredHistory,
  onGoHome,
}) => {
  const isPerfect = score === totalQuestions;
  const todayDateString = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return (
    <div className="flex-1 flex flex-col p-4 max-w-md mx-auto w-full space-y-4">
      {/* 完了ヘッダーカード & スタンプ演出 */}
      <div className="bg-white rounded-2xl border border-emerald-100 p-6 text-center shadow-xs relative overflow-hidden">
        <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full mb-3">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>本日の坂路調教 完了</span>
        </div>

        <h2 className="text-2xl font-black text-emerald-950 mb-1">
          {isPerfect ? '素晴らしい手応え！' : 'しっかり負荷をかけました！'}
        </h2>
        <p className="text-xs text-zinc-600 mb-6">
          愛馬「{progress.horseName}」の息遣いも良く、海外挑戦へ前進しています。
        </p>

        {/* 💮 調教済ハンコ風スタンプ */}
        <div className="inline-block relative">
          <div className="w-32 h-32 rounded-full border-4 border-red-600 flex flex-col items-center justify-center p-2 text-red-600 transform -rotate-12 select-none shadow-sm animate-in zoom-in-75 duration-300">
            <div className="text-[10px] font-black tracking-widest border-b border-red-500 pb-0.5">
              美浦・栗東 坂路
            </div>
            <div className="text-2xl font-black my-0.5 tracking-wider">
              調教済
            </div>
            <div className="text-[10px] font-bold border-t border-red-500 pt-0.5">
              {todayDateString}
            </div>
          </div>
        </div>

        {/* スコア・ステータス変動 */}
        <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-zinc-100 text-center">
          <div className="bg-zinc-50 rounded-xl p-3">
            <span className="text-[11px] text-zinc-500 block mb-0.5">調教正解率</span>
            <span className="text-xl font-black text-emerald-800">
              {score} / {totalQuestions}
            </span>
          </div>
          <div className="bg-emerald-50/60 rounded-xl p-3">
            <span className="text-[11px] text-emerald-700 block mb-0.5">愛馬の調子</span>
            <span className="text-base font-bold text-emerald-950 flex items-center justify-center gap-1">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>上昇気流 ↗</span>
            </span>
          </div>
        </div>
      </div>

      {/* 本日の履修フレーズ振り返り */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 shadow-xs">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">
          Review / 本日の履修フレーズ
        </h3>
        <div className="space-y-3">
          {answeredHistory.map((item, idx) => (
            <div
              key={item.phrase.id}
              className="p-3 rounded-xl bg-zinc-50 border border-zinc-100 text-left"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-bold text-zinc-900">
                  {idx + 1}. “{item.phrase.phrase}”
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  item.isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {item.isCorrect ? '正解' : '要復習'}
                </span>
              </div>
              <p className="text-xs text-zinc-600 leading-snug">
                {item.phrase.explanation}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ホームへ戻るボタン */}
      <button
        onClick={onGoHome}
        className="w-full bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] transition-all text-white font-bold py-3.5 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 text-base cursor-pointer mt-auto"
      >
        <Home className="w-5 h-5" />
        <span>厩舎（ホーム）へ戻る</span>
      </button>
    </div>
  );
};
