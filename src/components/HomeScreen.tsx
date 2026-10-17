import { useState, type FC, type FormEvent } from 'react';
import type { CareerRouteId, CareerWeek, UserProgress } from '../types';
import {
  Play,
  CheckCircle2,
  Calendar,
  RotateCcw,
  Trophy,
  Sparkles,
  Dices,
  Pencil,
  Check,
  X,
  Compass,
  Lock,
} from 'lucide-react';
import { INITIAL_PHRASES } from '../data/phrases';
import {
  type DayOfWeek,
  type AppMode,
  DAY_NAMES_JA,
} from '../lib/dayMode';
import {
  CAREER_ROUTES,
  MAX_HORSE_NAME_LENGTH,
  getCareerRouteInfo,
  getCareerStageLabel,
  getCurrentWeekRaceInfo,
  isHorseProfileLocked,
  validateHorseName,
} from '../lib/careerCycle';
import { getRaceThemeLabel } from '../lib/raceMode';

interface HomeScreenProps {
  progress: UserProgress;
  onStartTraining: () => void;
  onStartExtraTraining: () => void;
  onStartRace: () => void;
  onResetForDemo: () => void;
  onUpdateHorseName?: (newName: string) => void;
  onRegenerateHorseName?: () => void;
  onUpdateCareerRoute?: (routeId: CareerRouteId) => void;
  onRerollCoatColor?: () => void;
  appMode: AppMode;
  effectiveDayOfWeek: DayOfWeek;
  actualDayOfWeek: DayOfWeek;
  daysUntilWeekend: number;
  debugDayOfWeek: DayOfWeek | null;
  onSetDebugDayOfWeek: (day: DayOfWeek | null) => void;
  debugWeekdayDays: number | null;
  onSetDebugWeekdayDays: (days: number | null) => void;
  effectiveWeekdayDays: number;
  debugCarrotCount?: number | null;
  onSetDebugCarrotCount?: (count: number | null) => void;
  debugCareerWeek?: CareerWeek | null;
  onSetDebugCareerWeek?: (week: CareerWeek | null) => void;
  debugRaceCompleted?: boolean | null;
  onSetDebugRaceCompleted?: (completed: boolean | null) => void;
}

// 月曜日〜日曜日順の曜日リスト
const ORDERED_DAYS: DayOfWeek[] = [1, 2, 3, 4, 5, 6, 0];
const CAREER_WEEKS: CareerWeek[] = [1, 2, 3, 4];

export const HomeScreen: FC<HomeScreenProps> = ({
  progress,
  onStartTraining,
  onStartExtraTraining,
  onStartRace,
  onResetForDemo,
  onUpdateHorseName,
  onRegenerateHorseName,
  onUpdateCareerRoute,
  onRerollCoatColor,
  appMode,
  effectiveDayOfWeek,
  daysUntilWeekend,
  debugDayOfWeek,
  onSetDebugDayOfWeek,
  debugWeekdayDays,
  onSetDebugWeekdayDays,
  effectiveWeekdayDays,
  debugCarrotCount = null,
  onSetDebugCarrotCount,
  debugCareerWeek = null,
  onSetDebugCareerWeek,
  debugRaceCompleted = null,
  onSetDebugRaceCompleted,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(progress.careerHorse.name);
  const [nameError, setNameError] = useState<string | null>(null);
  const [isRouteSelectorOpen, setIsRouteSelectorOpen] = useState(false);

  const conditionLabel = {
    heavy: { text: '太め残り ↘', color: 'text-purple-700 bg-purple-50 border-purple-200' },
    flat: { text: '普通 ➡', color: 'text-zinc-600 bg-zinc-100 border-zinc-200' },
    up: { text: '好調 ↗', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    peak: { text: '絶好調 ⤴', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  }[progress.condition];

  const totalPhrases = INITIAL_PHRASES.length;
  const learnedCount = progress.learnedPhraseIds.length;
  const progressPercent = Math.min(100, Math.round((learnedCount / totalPhrases) * 100));

  const isWeekendMode = appMode === 'weekend';

  const { careerHorse } = progress;
  const routeInfo = getCareerRouteInfo(careerHorse.routeId);
  const currentWeekRace = getCurrentWeekRaceInfo(careerHorse.routeId, careerHorse.currentWeek);
  const careerStageLabel = getCareerStageLabel(careerHorse.currentWeek, careerHorse.raceHistory);
  const isProfileLocked = isHorseProfileLocked(careerHorse);

  const handleOpenNameEdit = () => {
    if (isProfileLocked) return;
    setNameInput(careerHorse.name);
    setNameError(null);
    setIsEditingName(true);
  };

  const handleCancelNameEdit = () => {
    setIsEditingName(false);
    setNameError(null);
  };

  const handleSubmitNameEdit = (e: FormEvent) => {
    e.preventDefault();
    if (isProfileLocked) {
      setIsEditingName(false);
      return;
    }
    const result = validateHorseName(nameInput);
    if (!result.isValid) {
      setNameError(result.error ?? '無効な馬名です。');
      return;
    }
    onUpdateHorseName?.(result.sanitized);
    setIsEditingName(false);
    setNameError(null);
  };

  return (
    <div className="flex-1 flex flex-col p-4 space-y-4 max-w-md mx-auto w-full">
      {/* 愛馬ステータスカード */}
      <div className="bg-linear-to-br from-emerald-800 to-emerald-950 text-white rounded-2xl p-4 shadow-md relative overflow-hidden">
        <div className="absolute -right-4 -bottom-4 text-emerald-800/30 text-8xl font-black select-none pointer-events-none">
          🏇
        </div>

        {/* キャリア世代 & ステージバッジ */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold tracking-wider bg-emerald-700/80 text-emerald-100 border border-emerald-500/40 px-2 py-0.5 rounded-full">
              第{careerHorse.generation}世代
            </span>
            <span className="text-[11px] font-extrabold bg-amber-400/95 text-amber-950 px-2.5 py-0.5 rounded-full shadow-2xs">
              {careerStageLabel}
            </span>
          </div>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border shadow-xs shrink-0 ${conditionLabel.color}`}>
            {conditionLabel.text}
          </span>
        </div>

        {/* 馬名 & 毛色・ランダム生成・手動編集 */}
        <div className="mt-1">
          {!isProfileLocked && isEditingName ? (
            <form onSubmit={handleSubmitNameEdit} className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => {
                    setNameInput(e.target.value);
                    if (nameError) setNameError(null);
                  }}
                  maxLength={MAX_HORSE_NAME_LENGTH}
                  aria-label="愛馬名を入力"
                  placeholder="馬名を入力 (18文字以内)"
                  className="flex-1 min-w-0 bg-emerald-950/90 border border-emerald-400/60 rounded-lg px-2.5 py-1.5 text-sm font-bold text-white placeholder:text-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  autoFocus
                />
                <button
                  type="submit"
                  className="bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold p-1.5 rounded-lg cursor-pointer shrink-0"
                  title="馬名を保存"
                  aria-label="馬名を保存"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleCancelNameEdit}
                  className="bg-emerald-900 hover:bg-emerald-800 text-emerald-200 p-1.5 rounded-lg border border-emerald-600 cursor-pointer shrink-0"
                  title="キャンセル"
                  aria-label="編集をキャンセル"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {nameError && (
                <p role="alert" className="text-[11px] text-amber-300 font-semibold">
                  ⚠️ {nameError}
                </p>
              )}
            </form>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xl font-bold text-white flex items-baseline gap-1.5 flex-wrap">
                <span>{careerHorse.name}</span>
                <span className="text-xs font-normal text-emerald-200">
                  （{routeInfo.sexAgeLabel} / {careerHorse.color}）
                </span>
              </h2>
              {!isProfileLocked && (
                <div className="flex items-center gap-1 shrink-0">
                  {onRegenerateHorseName && (
                    <button
                      type="button"
                      onClick={onRegenerateHorseName}
                      className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-700/80 hover:bg-emerald-600/80 active:scale-95 text-emerald-100 border border-emerald-500/40 px-2 py-1 rounded-lg transition-all cursor-pointer"
                      title="馬名と毛色をランダム再抽選"
                      aria-label="馬名と毛色をランダム再抽選"
                    >
                      <Dices className="w-3.5 h-3.5 text-amber-300" />
                      <span>命名</span>
                    </button>
                  )}
                  {onUpdateHorseName && (
                    <button
                      type="button"
                      onClick={handleOpenNameEdit}
                      className="inline-flex items-center justify-center bg-emerald-800/80 hover:bg-emerald-700/80 active:scale-95 text-emerald-200 border border-emerald-600/50 p-1.5 rounded-lg transition-all cursor-pointer"
                      title="馬名を手動編集"
                      aria-label="馬名を手動編集"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 馬体重 & 今週の目標レース */}
        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-emerald-700/50 text-xs">
          <div>
            <span className="text-emerald-300 block text-[10px]">馬体重</span>
            <span className="text-base font-bold text-white">{progress.horseWeight} kg</span>
          </div>
          <div>
            <span className="text-emerald-300 block text-[10px]">
              Week {careerHorse.currentWeek} 目標レース
            </span>
            <span className="text-sm font-bold text-white block truncate" title={`${currentWeekRace.raceName} (${currentWeekRace.distanceText})`}>
              {currentWeekRace.raceName}
              <span className="text-[11px] font-normal text-emerald-200 ml-1">
                ({currentWeekRace.distanceText})
              </span>
            </span>
          </div>
        </div>

        {/* キャリア路線（8大路線）表示 & 変更パネル */}
        <div className="mt-2.5 pt-2.5 border-t border-emerald-700/40 text-xs">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <Compass className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
              <span className="text-[11px] text-emerald-200 shrink-0">歩む路線:</span>
              <strong className="text-white text-[11px] truncate">{routeInfo.name}</strong>
            </div>
            {!isProfileLocked && onUpdateCareerRoute ? (
              <button
                type="button"
                onClick={() => setIsRouteSelectorOpen((prev) => !prev)}
                aria-expanded={isRouteSelectorOpen}
                className="text-[10px] font-bold bg-emerald-900/90 hover:bg-emerald-700 text-emerald-200 border border-emerald-600/60 px-2 py-0.5 rounded-md transition-colors cursor-pointer shrink-0"
              >
                {isRouteSelectorOpen ? '閉じる' : '路線変更'}
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-300/90 shrink-0">
                <Lock className="w-3 h-3" />
                <span>確定済</span>
              </span>
            )}
          </div>

          {!isProfileLocked && (
            <p className="mt-1.5 text-[10px] text-amber-200/95 flex items-center gap-1">
              <span>💡</span>
              <span>調教を開始すると馬名・毛色・路線が確定します</span>
            </p>
          )}

          {!isProfileLocked && isRouteSelectorOpen && onUpdateCareerRoute && (
            <div className="mt-2 p-2 bg-emerald-950/85 border border-emerald-600/50 rounded-xl space-y-1.5">
              <p className="text-[10px] text-emerald-300 font-semibold">
                挑戦するキャリア路線を選択（全8路線）:
              </p>
              <div className="grid grid-cols-2 gap-1">
                {CAREER_ROUTES.map((route) => {
                  const isSelected = route.id === careerHorse.routeId;
                  return (
                    <button
                      key={route.id}
                      type="button"
                      onClick={() => {
                        onUpdateCareerRoute(route.id);
                        setIsRouteSelectorOpen(false);
                      }}
                      className={`text-left px-2 py-1.5 rounded-lg text-[11px] transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-amber-400 text-amber-950 font-extrabold border-amber-300 shadow-2xs'
                          : 'bg-emerald-900/60 text-emerald-100 hover:bg-emerald-800/80 border-emerald-700/60'
                      }`}
                    >
                      <span className="block truncate font-bold">{route.shortName}</span>
                      <span
                        className={`block text-[9px] truncate ${
                          isSelected ? 'text-amber-900' : 'text-emerald-300/90'
                        }`}
                      >
                        最終: {route.races[3].raceName}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 週間調教仕上がり & レースボーナス状況 */}
        <div className="mt-2.5 pt-2.5 border-t border-emerald-700/40 text-[11px] text-emerald-100 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <span>🏋️ 調教消化:</span>
            <strong className="text-white">{progress.weekdayTrainingDays} / 7日</strong>
          </span>
          {progress.weekdayTrainingDays >= 5 && (
            <span className="text-amber-300 font-extrabold flex items-center gap-0.5">
              <span>⚡</span> 愛馬の余力2回付与
            </span>
          )}
          {progress.weekdayTrainingDays >= 3 && progress.weekdayTrainingDays < 5 && (
            <span className="text-emerald-200 font-bold flex items-center gap-0.5">
              <span>⚡</span> 愛馬の余力1回付与
            </span>
          )}
          {progress.weekdayTrainingDays > 0 && progress.weekdayTrainingDays < 3 && (
            <span className="text-emerald-300/80">余力なし (要3日以上)</span>
          )}
          {progress.weekdayTrainingDays === 0 && (
            <span className="text-purple-300 font-bold">⚠️ 太め残り注意</span>
          )}
        </div>

        {/* にんじんストック状況 */}
        <div className="mt-2 pt-2 border-t border-emerald-700/30 text-[11px] text-emerald-100 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <span>🥕 にんじんストック:</span>
            <strong className="text-amber-200 font-bold">{progress.carrotCount} / 3個</strong>
          </span>
          <span className="text-[10px] text-emerald-300">
            {progress.carrotCount > 0 ? '未受講日を自動救済' : 'レースで余力を温存して獲得'}
          </span>
        </div>
      </div>

      {/* にんじん救済発動バナー（直近で救済された場合） */}
      {progress.lastCarrotUsedDate && (
        <div className="bg-orange-50 border border-orange-200 text-orange-950 rounded-2xl p-3 shadow-xs flex items-center gap-2.5 text-xs">
          <span className="text-xl">🥕</span>
          <div className="flex-1 leading-snug">
            <strong className="block font-bold text-orange-900">ストリーク救済発動！</strong>
            <span className="text-orange-800 text-[11px]">
              愛馬がにんじんを食べて調教記録を維持しました（連続{progress.streakDays}日継続中）。
            </span>
          </div>
        </div>
      )}

      {/* 週末レース出走バナー（土日限定でメイン表示） */}
      {isWeekendMode ? (
        <div className="bg-linear-to-br from-amber-600 via-amber-700 to-amber-900 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden border border-amber-400/30">
          <div className="absolute -right-6 -bottom-6 text-amber-500/20 text-9xl font-black select-none pointer-events-none">
            🏆
          </div>

          <div className="flex items-center justify-between mb-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-400 text-amber-950 px-2.5 py-0.5 rounded-full shadow-xs">
              <Sparkles className="w-3 h-3 fill-amber-950" /> RACE DAY • Week {careerHorse.currentWeek}
            </span>
            <span className="text-xs text-amber-200 font-semibold">{currentWeekRace.distanceText}</span>
          </div>

          <h3 className="text-xl font-extrabold text-white flex items-center gap-2 mt-1">
            <Trophy className="w-6 h-6 text-amber-300 shrink-0" />
            <span>週末・{currentWeekRace.raceName}</span>
          </h3>

          <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold bg-amber-950/60 text-amber-200 border border-amber-400/30 px-2.5 py-0.5 rounded-md">
            <span>🎯 出題テーマ: {getRaceThemeLabel(currentWeekRace.themeCategory)}</span>
          </div>

          <p className="text-xs text-amber-100/90 mt-2 leading-relaxed">
            {progress.hasCompletedWeeklyRace
              ? '今週の週末レースは出走完了しました！土日も坂路調教や復習を続けて、来週末の次走に向けて愛馬を仕上げましょう。'
              : '坂路調教で培った英語力を実戦で試す時が来ました！今週の目標レース（週末1回限定）を完走して次のステージへ進もう。'}
          </p>

          {progress.hasCompletedWeeklyRace ? (
            <button
              type="button"
              disabled
              className="mt-4 w-full bg-amber-950/70 text-amber-200/90 border border-amber-500/40 font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm cursor-not-allowed"
            >
              <span>出走完了 🏁（次回出走は来週末）</span>
            </button>
          ) : (
            <button
              onClick={onStartRace}
              className="mt-4 w-full bg-amber-400 hover:bg-amber-300 active:scale-[0.98] transition-all text-amber-950 font-black py-3.5 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 text-base cursor-pointer"
            >
              <Trophy className="w-5 h-5 fill-amber-950" />
              <span>{currentWeekRace.raceName}に出走する（5問）</span>
            </button>
          )}
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
                息遣いも良く、素晴らしい仕上がりです。さらに未習得フレーズを学んだり、今日の復習ができます。
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

        {progress.completedToday ? (
          <div className="mt-4 space-y-2">
            <button
              onClick={onStartExtraTraining}
              className="w-full bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] transition-all text-white font-bold py-3.5 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 text-base cursor-pointer"
            >
              <Sparkles className="w-5 h-5 text-amber-300" />
              <span>追加トレーニング（新しい3問）</span>
            </button>
            <button
              onClick={onStartTraining}
              className="w-full bg-white hover:bg-zinc-50 active:scale-[0.98] transition-all text-zinc-700 font-bold py-2.5 px-4 rounded-xl border border-zinc-300 flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-zinc-500" />
              <span>本日のフレーズを復習する</span>
            </button>
          </div>
        ) : (
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
              {isWeekendMode
                ? '坂路調教で調整する（3問）'
                : '本日の調教を始める（3問）'}
            </span>
          </button>
        )}
      </div>

      {/* 平日用の週末レース予告カード（平日の場合のみ表示） */}
      {!isWeekendMode ? (
        <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <span className="text-base">🏆</span>
              <h4 className="font-bold text-zinc-800 text-sm">
                週末・{currentWeekRace.raceName}（{currentWeekRace.distanceText}）
              </h4>
            </div>
            <span className="text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full shrink-0">
              出走まで あと {daysUntilWeekend} 日
            </span>
          </div>
          <p className="text-[11px] font-semibold text-amber-800 mt-1">
            🎯 出題テーマ: {getRaceThemeLabel(currentWeekRace.themeCategory)}
          </p>
          <p className="text-xs text-zinc-600 leading-relaxed mt-1">
            平日の調教をこなすほど、週末レースでの好走確率や愛馬のコンディションがアップします（土日限定解放）。
          </p>
        </div>
      ) : null}

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

          {/* 週間調教日数 (0〜7日) シミュレート */}
          <div className="mt-3 pt-2 border-t border-zinc-200/60">
            <div className="flex justify-between items-center mb-1.5">
              <span className="font-bold text-zinc-700 text-[11px] flex items-center gap-1">
                <span>🏋️</span> 調教日数切替 (0〜7日)
              </span>
              {debugWeekdayDays !== null && (
                <button
                  onClick={() => onSetDebugWeekdayDays(null)}
                  className="text-[10px] text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer underline"
                >
                  実数に戻す
                </button>
              )}
            </div>
            <div className="grid grid-cols-8 gap-1">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((d) => (
                <button
                  key={d}
                  onClick={() => onSetDebugWeekdayDays(d)}
                  className={`py-1 rounded text-xs font-bold transition-all text-center cursor-pointer ${
                    effectiveWeekdayDays === d
                      ? 'bg-emerald-700 text-white shadow-xs ring-2 ring-emerald-500'
                      : 'bg-white text-zinc-700 hover:bg-zinc-50 border border-zinc-200'
                  }`}
                  title={`${d}日消化に切り替え`}
                >
                  {d}日
                </button>
              ))}
            </div>
          </div>

          {/* キャリア週 (Week 1〜4) シミュレート & 毛色再抽選 */}
          {onSetDebugCareerWeek && (
            <div className="mt-3 pt-2 border-t border-zinc-200/60">
              <div className="flex justify-between items-center mb-1.5">
                <span className="font-bold text-zinc-700 text-[11px] flex items-center gap-1">
                  <span>🗓️</span> キャリア週切替 (Week 1〜4)
                </span>
                <div className="flex items-center gap-2">
                  {onRerollCoatColor && (
                    <button
                      type="button"
                      onClick={onRerollCoatColor}
                      className="text-[10px] text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer underline"
                    >
                      🎨 毛色抽選 ({careerHorse.color})
                    </button>
                  )}
                  {debugCareerWeek !== null && (
                    <button
                      onClick={() => onSetDebugCareerWeek(null)}
                      className="text-[10px] text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer underline"
                    >
                      実週に戻す
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {CAREER_WEEKS.map((w) => (
                  <button
                    key={w}
                    onClick={() => onSetDebugCareerWeek(w)}
                    className={`py-1 rounded text-xs font-bold transition-all text-center cursor-pointer ${
                      careerHorse.currentWeek === w
                        ? 'bg-emerald-700 text-white shadow-xs ring-2 ring-emerald-500'
                        : 'bg-white text-zinc-700 hover:bg-zinc-50 border border-zinc-200'
                    }`}
                    title={`Week ${w} に切り替え`}
                  >
                    Week {w}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 週末レース出走状態 (未出走 / 出走済) シミュレート */}
          {onSetDebugRaceCompleted && (
            <div className="mt-3 pt-2 border-t border-zinc-200/60">
              <div className="flex justify-between items-center mb-1.5">
                <span className="font-bold text-zinc-700 text-[11px] flex items-center gap-1">
                  <span>🏁</span> 週末レース出走状態切替
                </span>
                {debugRaceCompleted !== null && (
                  <button
                    onClick={() => onSetDebugRaceCompleted(null)}
                    className="text-[10px] text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer underline"
                  >
                    実状態に戻す
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => onSetDebugRaceCompleted(false)}
                  className={`py-1 rounded text-xs font-bold transition-all text-center cursor-pointer ${
                    !progress.hasCompletedWeeklyRace
                      ? 'bg-emerald-700 text-white shadow-xs ring-2 ring-emerald-500'
                      : 'bg-white text-zinc-700 hover:bg-zinc-50 border border-zinc-200'
                  }`}
                >
                  未出走 (出走可能)
                </button>
                <button
                  type="button"
                  onClick={() => onSetDebugRaceCompleted(true)}
                  className={`py-1 rounded text-xs font-bold transition-all text-center cursor-pointer ${
                    progress.hasCompletedWeeklyRace
                      ? 'bg-amber-700 text-white shadow-xs ring-2 ring-amber-400'
                      : 'bg-white text-zinc-700 hover:bg-zinc-50 border border-zinc-200'
                  }`}
                >
                  出走済 🏁 (制限中)
                </button>
              </div>
            </div>
          )}

          {/* にんじん所持数 (0〜3個) シミュレート */}
          {onSetDebugCarrotCount && (
            <div className="mt-3 pt-2 border-t border-zinc-200/60">
              <div className="flex justify-between items-center mb-1.5">
                <span className="font-bold text-zinc-700 text-[11px] flex items-center gap-1">
                  <span>🥕</span> にんじん所持数切替 (0〜3個)
                </span>
                {debugCarrotCount !== null && (
                  <button
                    onClick={() => onSetDebugCarrotCount(null)}
                    className="text-[10px] text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer underline"
                  >
                    実数に戻す
                  </button>
                )}
              </div>
              <div className="grid grid-cols-4 gap-1">
                {[0, 1, 2, 3].map((c) => (
                  <button
                    key={c}
                    onClick={() => onSetDebugCarrotCount(c)}
                    className={`py-1 rounded text-xs font-bold transition-all text-center cursor-pointer ${
                      progress.carrotCount === c
                        ? 'bg-orange-600 text-white shadow-xs ring-2 ring-orange-400'
                        : 'bg-white text-zinc-700 hover:bg-zinc-50 border border-zinc-200'
                    }`}
                    title={`にんじん${c}個に切り替え`}
                  >
                    🥕 {c}個
                  </button>
                ))}
              </div>
            </div>
          )}
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

