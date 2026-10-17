import { useEffect, useState, type FC, type FormEvent } from 'react';
import type { CareerHorse, CareerRouteId, HorseCoatColor } from '../types';
import {
  Trophy,
  Sparkles,
  Award,
  Dices,
  Pencil,
  Check,
  X,
  Compass,
  Home,
  ArrowRight,
  BookOpen,
  Flag,
} from 'lucide-react';
import { soundManager } from '../lib/sound';
import {
  CAREER_ROUTES,
  MAX_HORSE_NAME_LENGTH,
  evaluateRetirementSummary,
  generateRandomHorseName,
  getCareerRouteInfo,
  rollHorseCoatColor,
  validateHorseName,
} from '../lib/careerCycle';

interface RetirementScreenProps {
  careerHorse: CareerHorse;
  onConfirmNextGeneration: (nextOverrides: {
    name: string;
    color: HorseCoatColor;
    routeId: CareerRouteId;
  }) => void;
  onBackToHome: () => void;
}

export const RetirementScreen: FC<RetirementScreenProps> = ({
  careerHorse,
  onConfirmNextGeneration,
  onBackToHome,
}) => {
  const summary = evaluateRetirementSummary(careerHorse);
  const currentRouteInfo = getCareerRouteInfo(careerHorse.routeId);
  const nextGenNumber = careerHorse.generation + 1;

  // 次世代の新馬候補ステータス（初期値はランダム馬名＋重み付き抽選毛色＋現在路線）
  const [nextName, setNextName] = useState<string>(() =>
    generateRandomHorseName(careerHorse.name)
  );
  const [nextColor, setNextColor] = useState<HorseCoatColor>(() => rollHorseCoatColor());
  const [nextRouteId, setNextRouteId] = useState<CareerRouteId>(careerHorse.routeId);

  const [isEditingNextName, setIsEditingNextName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);

  const nextRouteInfo = getCareerRouteInfo(nextRouteId);

  useEffect(() => {
    const timer = setTimeout(() => {
      soundManager.playFanfare();
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  const handleRerollNextIdentity = () => {
    setNextName((prev) => generateRandomHorseName(prev));
    setNextColor(rollHorseCoatColor());
    setIsEditingNextName(false);
    setNameError(null);
  };

  const handleStartEditName = () => {
    setNameInput(nextName);
    setNameError(null);
    setIsEditingNextName(true);
  };

  const handleSubmitName = (e: FormEvent) => {
    e.preventDefault();
    const validation = validateHorseName(nameInput);
    if (!validation.isValid) {
      setNameError(validation.error ?? '有効な馬名を入力してください。');
      return;
    }
    setNextName(validation.sanitized);
    setNameError(null);
    setIsEditingNextName(false);
  };

  const handleConfirm = () => {
    soundManager.playStamp();
    onConfirmNextGeneration({
      name: nextName,
      color: nextColor,
      routeId: nextRouteId,
    });
  };

  return (
    <div className="flex-1 flex flex-col p-4 max-w-md mx-auto w-full space-y-4">
      {/* 引退セレモニー＆二つ名表彰ヘッダーカード */}
      <div className="bg-linear-to-br from-amber-700 via-amber-800 to-amber-950 text-white rounded-2xl p-6 text-center shadow-lg relative overflow-hidden border border-amber-400/40">
        <div className="absolute -right-4 -top-4 text-amber-400/15 text-9xl font-black select-none pointer-events-none">
          👑
        </div>

        <div className="inline-flex items-center gap-1.5 bg-amber-400 text-amber-950 text-xs font-extrabold px-3 py-1 rounded-full mb-3 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 fill-amber-950" />
          <span>RETIREMENT CEREMONY • 第{careerHorse.generation}世代 引退式</span>
        </div>

        {/* 授与された二つ名・称号プレート */}
        <div className="my-2 bg-amber-950/70 border border-amber-400/50 rounded-xl py-2.5 px-4 inline-block shadow-inner">
          <span className="text-[10px] font-bold text-amber-300 uppercase tracking-widest block">
            AWARDED EPITHET / 授与称号
          </span>
          <span className="text-lg font-black text-amber-200 tracking-wide">
            【{summary.titleName}】
          </span>
        </div>

        <h2 className="text-2xl font-black text-white mt-2">
          {careerHorse.name}
        </h2>
        <p className="text-xs text-amber-200 font-semibold mt-0.5">
          {currentRouteInfo.sexAgeLabel} • {careerHorse.color} • {currentRouteInfo.name}
        </p>

        <p className="text-xs text-amber-100/90 mt-3 leading-relaxed">
          4週間にわたるキャリアを無事に完走しました！日々の坂路調教と週末の激闘を駆け抜けた愛馬の栄誉を称えます。
        </p>

        {/* サマリー3指標 */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-amber-600/40 text-center">
          <div className="bg-amber-950/50 rounded-xl p-2.5 border border-amber-500/30">
            <span className="text-[10px] text-amber-300 font-semibold block">生涯戦績</span>
            <span className="text-sm font-black text-white mt-0.5 block">
              {summary.totalRaces}戦 {summary.wins}勝
            </span>
          </div>
          <div className="bg-amber-950/50 rounded-xl p-2.5 border border-amber-500/30">
            <span className="text-[10px] text-amber-300 font-semibold block">レース正答</span>
            <span className="text-sm font-black text-white mt-0.5 block">
              {summary.totalScore} / {summary.maxPossibleScore}問
            </span>
          </div>
          <div className="bg-amber-950/50 rounded-xl p-2.5 border border-amber-500/30">
            <span className="text-[10px] text-amber-300 font-semibold block">習得フレーズ</span>
            <span className="text-sm font-black text-amber-200 mt-0.5 flex items-center justify-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span>{summary.learnedCount}語</span>
            </span>
          </div>
        </div>
      </div>

      {/* 獲得タイトル & 4週間戦績一覧カード */}
      <div className="bg-white rounded-2xl border border-amber-200/90 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-600" />
            <span>獲得タイトル & 生涯戦績（全4週）</span>
          </h3>
          <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
            {currentRouteInfo.shortName}
          </span>
        </div>

        {/* 獲得タイトルバッジ一覧 */}
        <div className="flex flex-wrap gap-1.5">
          {summary.titles.length > 0 ? (
            summary.titles.map((title) => (
              <span
                key={title}
                className="inline-flex items-center gap-1 text-xs font-extrabold bg-amber-400 text-amber-950 border border-amber-300 px-2.5 py-1 rounded-full shadow-2xs"
              >
                <Award className="w-3.5 h-3.5 shrink-0" />
                <span>{title}</span>
              </span>
            ))
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-50 text-emerald-900 border border-emerald-200 px-2.5 py-1 rounded-full">
              <Flag className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span>キャリア完走表彰 🎖️（無事故完走）</span>
            </span>
          )}
        </div>

        {/* Week 1〜4 戦績リスト */}
        <div className="space-y-1.5 pt-1">
          {currentRouteInfo.races.map((routeRace) => {
            const record = careerHorse.raceHistory.find((r) => r.week === routeRace.week);
            const isWin = record?.score === 5;
            return (
              <div
                key={routeRace.week}
                className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs ${
                  isWin
                    ? 'bg-amber-50/70 border-amber-300 text-amber-950'
                    : record
                      ? 'bg-zinc-50 border-zinc-200 text-zinc-800'
                      : 'bg-zinc-50/50 border-zinc-200/60 text-zinc-400'
                }`}
              >
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-zinc-500 block">
                    Week {routeRace.week} • {routeRace.distanceText}
                  </span>
                  <span className="font-extrabold text-sm truncate block">
                    {record ? record.raceName : routeRace.raceName}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  {record ? (
                    <>
                      <span
                        className={`inline-block font-black text-xs px-2 py-0.5 rounded-full ${
                          isWin
                            ? 'bg-amber-400 text-amber-950'
                            : 'bg-zinc-200 text-zinc-800'
                        }`}
                      >
                        {record.placementText}
                      </span>
                      <span className="block text-[10px] text-zinc-500 mt-0.5 font-semibold">
                        正解: {record.score} / 5問
                      </span>
                    </>
                  ) : (
                    <span className="text-[11px] font-semibold text-zinc-400">未出走</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 次世代（第N+1世代）新馬指名・引き継ぎカード */}
      <div className="bg-linear-to-br from-emerald-800 to-emerald-950 text-white rounded-2xl p-5 shadow-md border border-emerald-700/60 space-y-3">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold bg-amber-400 text-amber-950 px-2.5 py-0.5 rounded-full">
            🌱 NEXT GENERATION • 第{nextGenNumber}世代
          </span>
          <span className="text-[11px] text-emerald-200 font-semibold">
            新馬プロフィール設定
          </span>
        </div>

        <div>
          <p className="text-xs text-emerald-100/90 leading-relaxed">
            先輩馬の経験を受け継ぐ、第{nextGenNumber}世代の新馬を指名しましょう！（育成開始後も初回調教前まで変更可能です）
          </p>
        </div>

        {/* 次世代の馬名・毛色設定 */}
        <div className="bg-emerald-900/70 border border-emerald-700/70 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
              新馬名 & 毛色（8種抽選）
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleRerollNextIdentity}
                className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-800 hover:bg-emerald-700 text-emerald-100 border border-emerald-600/60 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                title="馬名と毛色を同時にランダム再抽選"
              >
                <Dices className="w-3.5 h-3.5 text-amber-300" />
                <span>🎲 命名・毛色抽選</span>
              </button>
              {!isEditingNextName && (
                <button
                  type="button"
                  onClick={handleStartEditName}
                  className="inline-flex items-center justify-center w-7 h-7 bg-emerald-800 hover:bg-emerald-700 text-emerald-100 border border-emerald-600/60 rounded-lg transition-colors cursor-pointer"
                  title="馬名を手動編集"
                  aria-label="次世代の馬名を手動編集"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {isEditingNextName ? (
            <form onSubmit={handleSubmitName} className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  maxLength={MAX_HORSE_NAME_LENGTH}
                  placeholder="新馬名を入力 (カタカナ9文字 / 英字18文字以内)"
                  aria-label="次世代の馬名を入力"
                  className="flex-1 min-w-0 bg-emerald-950/90 text-white text-sm font-bold px-2.5 py-1.5 rounded-lg border border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <button
                  type="submit"
                  className="p-1.5 rounded-lg bg-amber-400 text-amber-950 hover:bg-amber-300 font-bold cursor-pointer shrink-0"
                  title="馬名を確定"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingNextName(false);
                    setNameError(null);
                  }}
                  className="p-1.5 rounded-lg bg-emerald-800 text-emerald-200 hover:bg-emerald-700 cursor-pointer shrink-0"
                  title="編集をキャンセル"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {nameError && (
                <p className="text-[11px] text-amber-300 font-semibold">{nameError}</p>
              )}
            </form>
          ) : (
            <div className="flex items-baseline justify-between gap-2 flex-wrap">
              <span className="text-xl font-extrabold text-white tracking-tight">
                {nextName}
              </span>
              <span className="text-xs font-bold text-amber-300 bg-emerald-950/80 border border-emerald-700 px-2.5 py-0.5 rounded-full">
                {nextRouteInfo.sexAgeLabel} / {nextColor}
              </span>
            </div>
          )}
        </div>

        {/* 次世代の路線選択（全8路線） */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 text-emerald-200 font-semibold text-[11px]">
              <Compass className="w-3.5 h-3.5 text-emerald-300" />
              <span>挑戦するキャリア路線を選択（全8路線）:</span>
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {CAREER_ROUTES.map((route) => {
              const isSelected = route.id === nextRouteId;
              return (
                <button
                  key={route.id}
                  type="button"
                  onClick={() => setNextRouteId(route.id)}
                  className={`text-left px-2.5 py-1.5 rounded-lg text-[11px] transition-all cursor-pointer border ${
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

        {/* 世代交代確定ボタン */}
        <button
          type="button"
          onClick={handleConfirm}
          className="mt-2 w-full bg-amber-400 hover:bg-amber-300 active:scale-[0.98] transition-all text-amber-950 font-black py-3.5 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 text-sm cursor-pointer"
        >
          <span>第{nextGenNumber}世代「{nextName}」の育成を始める</span>
          <ArrowRight className="w-4 h-4 stroke-[3]" />
        </button>
      </div>

      {/* まだ引退せずホームへ戻るサブボタン */}
      <button
        type="button"
        onClick={onBackToHome}
        className="w-full bg-white hover:bg-zinc-100 active:scale-[0.98] transition-all text-zinc-600 font-bold py-3 px-4 rounded-xl border border-zinc-200 flex items-center justify-center gap-2 text-xs cursor-pointer"
      >
        <Home className="w-4 h-4" />
        <span>まだ引退せずホーム（厩舎）に戻る</span>
      </button>
    </div>
  );
};
