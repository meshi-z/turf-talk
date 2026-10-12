import { useState } from 'react';
import type { FC } from 'react';
import type { UserProgress } from '../types';
import {
  Play,
  CheckCircle2,
  Calendar,
  RotateCcw,
  Trophy,
  Sparkles,
  Info,
  X,
} from 'lucide-react';
import { INITIAL_PHRASES } from '../data/phrases';
import {
  type DayOfWeek,
  type AppMode,
  DAY_NAMES_JA,
} from '../lib/dayMode';

interface HomeScreenProps {
  progress: UserProgress;
  onStartTraining: () => void;
  onResetForDemo: () => void;
  appMode: AppMode;
  effectiveDayOfWeek: DayOfWeek;
  actualDayOfWeek: DayOfWeek;
  daysUntilWeekend: number;
  debugDayOfWeek: DayOfWeek | null;
  onSetDebugDayOfWeek: (day: DayOfWeek | null) => void;
}

// 月曜日〜日曜日順の曜日リスト
const ORDERED_DAYS: DayOfWeek[] = [1, 2, 3, 4, 5, 6, 0];

export const HomeScreen: FC<HomeScreenProps> = ({
  progress,
  onStartTraining,
  onResetForDemo,
  appMode,
  effectiveDayOfWeek,
  daysUntilWeekend,
  debugDayOfWeek,
  onSetDebugDayOfWeek,
}) => {
  const [showRaceModal, setShowRaceModal] = useState(false);

  const conditionLabel = {
    flat: { text: '普通 ➡', color: 'text-zinc-600 bg-zinc-100' },
    up: { text: '上昇 ↗', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    peak: { text: '絶好調 ⤴', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  }[progress.condition];

  const totalPhrases = INITIAL_PHRASES.length;
  const learnedCount = progress.learnedPhraseIds.length;
  const progressPercent = Math.min(100, Math.round((learnedCount / totalPhrases) * 100));

  const isWeekendMode = appMode === 'weekend';

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

      {/* 週末レース出走バナー（土日限定でメイン表示） */}
      {isWeekendMode ? (
        <div className="bg-linear-to-br from-amber-600 via-amber-700 to-amber-900 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden border border-amber-400/30">
          <div className="absolute -right-6 -bottom-6 text-amber-500/20 text-9xl font-black select-none pointer-events-none">
            🏆
          </div>

          <div className="flex items-center justify-between mb-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-400 text-amber-950 px-2.5 py-0.5 rounded-full shadow-xs">
              <Sparkles className="w-3 h-3 fill-amber-950" /> RACE DAY • 開催中
            </span>
            <span className="text-xs text-amber-200 font-semibold">土日限定</span>
          </div>

          <h3 className="text-xl font-extrabold text-white flex items-center gap-2 mt-1">
            <Trophy className="w-6 h-6 text-amber-300 shrink-0" />
            <span>週末・海外G1模擬レース</span>
          </h3>

          <p className="text-xs text-amber-100/90 mt-2 leading-relaxed">
            平日の坂路調教で培った英語力を実戦で試す時が来ました！海外強豪馬との白熱したレースに挑もう。
          </p>

          <button
            onClick={() => setShowRaceModal(true)}
            className="mt-4 w-full bg-amber-400 hover:bg-amber-300 active:scale-[0.98] transition-all text-amber-950 font-black py-3.5 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 text-base cursor-pointer"
          >
            <Trophy className="w-5 h-5 fill-amber-950" />
            <span>週末G1模擬レースに出走する（5問）</span>
          </button>
        </div>
      ) : null}

      {/* 本日の調教ステータス */}
      <div className="bg-white rounded-2xl border border-emerald-100 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌿</span>
            <h3 className="font-bold text-emerald-950 text-base">
              {isWeekendMode ? '週末の坂路調教メニュー' : '本日の調教メニュー'}
            </h3>
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
              {progress.lapCount > 1 && (
                <span className="ml-1 text-[11px] text-amber-700 font-semibold">
                  ({progress.lapCount}周目)
                </span>
              )}
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
              <span>【{isWeekendMode ? '週末・坂路調整' : '平日・坂路調教'}】 未完了</span>
            </p>
            <p className="text-xs text-amber-800 mt-1">
              勝利騎手インタビュー頻出の3フレーズを直感4択で解き、愛馬の調子を上げよう！
            </p>
          </div>
        )}

        <button
          onClick={onStartTraining}
          className={`mt-4 w-full transition-all text-white font-bold py-3.5 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 text-base cursor-pointer ${
            isWeekendMode
              ? 'bg-emerald-800 hover:bg-emerald-900 active:scale-[0.98]'
              : 'bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98]'
          }`}
        >
          <Play className="w-5 h-5 fill-white" />
          <span>
            {progress.completedToday
              ? '本日のフレーズを復習する'
              : isWeekendMode
              ? '坂路調教で調整する（3問）'
              : '本日の調教を始める（3問）'}
          </span>
        </button>
      </div>

      {/* 平日用の週末レース予告カード（平日の場合のみ表示） */}
      {!isWeekendMode ? (
        <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <span className="text-base">🏆</span>
              <h4 className="font-bold text-zinc-800 text-sm">週末・海外G1模擬レース</h4>
            </div>
            <span className="text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
              出走まで あと {daysUntilWeekend} 日
            </span>
          </div>
          <p className="text-xs text-zinc-600 leading-relaxed mt-1">
            平日の調教をこなすほど、週末レースでの好走確率や愛馬のコンディションがアップします（土日限定解放）。
          </p>
        </div>
      ) : null}

      {/* 模擬レース準備中モーダル (Phase 2先行案内) */}
      {showRaceModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl border border-amber-200 relative">
            <button
              onClick={() => setShowRaceModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 p-1 rounded-full cursor-pointer"
              aria-label="閉じる"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mb-3">
              <Trophy className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-1.5">
              <span>🏁 出走ゲート準備中！</span>
            </h3>

            <p className="text-xs text-zinc-600 mt-2 leading-relaxed">
              週末限定の「海外G1模擬レース（5問・着順判定演出）」は、次期アップデート（Phase 2 / Issue #13）にて登場予定です！
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-3 text-xs text-amber-900">
              <div className="font-semibold flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-amber-700" />
                <span>先行情報</span>
              </div>
              <p className="mt-1 text-[11px] text-amber-800 leading-normal">
                平日の坂路調教で習得したフレーズが実戦レースで出題されます。日々の調教で万全に仕上げておきましょう。
              </p>
            </div>

            <button
              onClick={() => setShowRaceModal(false)}
              className="mt-5 w-full bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-all cursor-pointer"
            >
              了解しました
            </button>
          </div>
        </div>
      )}

      {/* デバッグ・デモ用曜日切り替えコントロール */}
      <div className="mt-auto pt-4 border-t border-zinc-200/60 space-y-2">
        <div className="bg-zinc-100/80 rounded-xl p-2.5 border border-zinc-200/70 text-xs">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-zinc-700 flex items-center gap-1 text-[11px]">
              <span>🛠️</span> 曜日モード切替 (デモ・検証用)
            </span>
            {debugDayOfWeek !== null && (
              <button
                onClick={() => onSetDebugDayOfWeek(null)}
                className="text-[10px] text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer underline"
              >
                実日時に戻す
              </button>
            )}
          </div>

          {/* 月〜日 7つの曜日切り替えチップ */}
          <div className="grid grid-cols-7 gap-1">
            {ORDERED_DAYS.map((day) => {
              const isSelected = effectiveDayOfWeek === day;
              const isWeekendDay = day === 0 || day === 6;
              return (
                <button
                  key={day}
                  onClick={() => onSetDebugDayOfWeek(day)}
                  className={`py-1.5 px-0.5 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                    isSelected
                      ? isWeekendDay
                        ? 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-400'
                        : 'bg-emerald-700 text-white shadow-xs ring-2 ring-emerald-500'
                      : isWeekendDay
                      ? 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                      : 'bg-white text-zinc-700 hover:bg-zinc-50 border border-zinc-200'
                  }`}
                  title={`${DAY_NAMES_JA[day]}曜日に切り替え`}
                >
                  {DAY_NAMES_JA[day]}
                </button>
              );
            })}
          </div>

          <div className="mt-2 text-[10px] text-zinc-500 flex items-center justify-between">
            <span>
              現在: <strong className="text-zinc-800">{DAY_NAMES_JA[effectiveDayOfWeek]}曜日</strong>
              {debugDayOfWeek !== null && (
                <span className="text-amber-700 ml-1 font-semibold">(手動オーバーライド中)</span>
              )}
            </span>
            <span
              className={`font-semibold px-1.5 py-0.5 rounded-sm text-[9px] ${
                isWeekendMode
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}
            >
              {isWeekendMode ? '🏆 週末レースモード' : '🌿 平日調教モード'}
            </span>
          </div>
        </div>

        {/* デモ用データリセットボタン */}
        <div className="text-center pt-1">
          <button
            onClick={onResetForDemo}
            className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-600 transition-colors py-1 px-2 rounded-sm cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>学習状態をリセット（最初から試す）</span>
          </button>
        </div>
      </div>
    </div>
  );
};
