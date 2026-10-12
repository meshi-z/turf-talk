import type { FC } from 'react';
import type { UserProgress } from '../types';
import { Play, CheckCircle2, Calendar, RotateCcw } from 'lucide-react';
import { INITIAL_PHRASES } from '../data/phrases';

interface HomeScreenProps {
  progress: UserProgress;
  onStartTraining: () => void;
  onResetForDemo: () => void;
}

export const HomeScreen: FC<HomeScreenProps> = ({
  progress,
  onStartTraining,
  onResetForDemo,
}) => {
  const conditionLabel = {
    flat: { text: '普通 ➡', color: 'text-zinc-600 bg-zinc-100' },
    up: { text: '上昇 ↗', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    peak: { text: '絶好調 ⤴', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  }[progress.condition];

  const totalPhrases = INITIAL_PHRASES.length;
  const learnedCount = progress.learnedPhraseIds.length;
  const progressPercent = Math.min(100, Math.round((learnedCount / totalPhrases) * 100));

  return (
    <div className="flex-1 flex flex-col p-4 space-y-4 max-w-md mx-auto w-full">
      {/* 愛馬ステータスカード */}
      <div className="bg-linear-to-br from-emerald-800 to-emerald-950 text-white rounded-2xl p-4 shadow-md relative overflow-hidden">
        <div className="absolute -right-4 -bottom-4 text-emerald-800/30 text-8xl font-black select-none pointer-events-none">
          🏇
        </div>
        
        <div className="flex justify-between items-start mb-2">
          <div>
            <span className="text-[11px] font-semibold tracking-wider text-emerald-300 uppercase">
              My Stable / 担当馬
            </span>
            <h2 className="text-xl font-bold text-white flex items-center gap-1.5 mt-0.5">
              <span>{progress.horseName}</span>
              <span className="text-xs font-normal text-emerald-200">（牡3 / 鹿毛）</span>
            </h2>
          </div>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border shadow-xs ${conditionLabel.color}`}>
            {conditionLabel.text}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-emerald-700/50 text-xs">
          <div>
            <span className="text-emerald-300 block text-[10px]">馬体重</span>
            <span className="text-base font-bold text-white">{progress.horseWeight} kg</span>
          </div>
          <div>
            <span className="text-emerald-300 block text-[10px]">目標レース</span>
            <span className="text-base font-bold text-white">海外G1初制覇</span>
          </div>
        </div>
      </div>

      {/* 本日の調教ステータス */}
      <div className="bg-white rounded-2xl border border-emerald-100 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌿</span>
            <h3 className="font-bold text-emerald-950 text-base">本日の調教メニュー</h3>
          </div>
          <span className="text-xs text-zinc-500 font-medium flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> 1日3問 (約1分)
          </span>
        </div>

        {/* フレーズ習得プログレスバー */}
        <div className="mb-4 bg-emerald-50/60 rounded-xl p-3 border border-emerald-100">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="font-semibold text-emerald-950 flex items-center gap-1">
              <span>📖</span> 習得フレーズ
            </span>
            <span className="font-bold text-emerald-800">
              {learnedCount} / {totalPhrases} 問
              {progress.lapCount > 1 && <span className="ml-1 text-[11px] text-amber-700 font-semibold">({progress.lapCount}周目)</span>}
            </span>
          </div>
          <div className="w-full bg-emerald-200/50 rounded-full h-2 overflow-hidden">
            <div
              className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {progress.completedToday ? (
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-emerald-950 text-sm">本日の坂路調教 完了！💮</p>
              <p className="text-xs text-emerald-700 mt-0.5">
                息遣いも良く、素晴らしい仕上がりです。何度でも復習できます。
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3.5">
            <p className="font-bold text-amber-950 text-sm flex items-center gap-1.5">
              <span>【平日・坂路調教】 未完了</span>
            </p>
            <p className="text-xs text-amber-800 mt-1">
              勝利騎手インタビュー頻出の3フレーズを直感4択で解き、愛馬の調子を上げよう！
            </p>
          </div>
        )}

        <button
          onClick={onStartTraining}
          className="mt-4 w-full bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] transition-all text-white font-bold py-3.5 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 text-base cursor-pointer"
        >
          <Play className="w-5 h-5 fill-white" />
          <span>{progress.completedToday ? '本日のフレーズを復習する' : '本日の調教を始める（3問）'}</span>
        </button>
      </div>

      {/* 週末レース予告カード (Phase 2先行UI) */}
      <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <span className="text-base">🏆</span>
            <h4 className="font-bold text-zinc-800 text-sm">週末・海外G1模擬レース</h4>
          </div>
          <span className="text-[10px] font-bold bg-zinc-200 text-zinc-700 px-2 py-0.5 rounded-full">
            土日限定
          </span>
        </div>
        <p className="text-xs text-zinc-600 leading-relaxed mt-1">
          平日の調教を消化するほど、週末のレースで好走しやすくなります（Phase 2にて解放予定）。
        </p>
      </div>

      {/* デモ用リセットボタン（画面最下部・控えめに配置） */}
      <div className="mt-auto pt-4 text-center">
        <button
          onClick={onResetForDemo}
          className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-600 transition-colors py-1 px-2 rounded-sm"
        >
          <RotateCcw className="w-3 h-3" />
          <span>デモ状態をリセット（最初から試す）</span>
        </button>
      </div>
    </div>
  );
};
