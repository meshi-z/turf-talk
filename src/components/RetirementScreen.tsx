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
  Crown,
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
      {/* 引退セレモニー＆二つ名表彰ヘッダーカード（クラブハウス表彰レリーフ仕様） */}
      <div className="bg-linear-to-br from-[#4A2511] via-[#381B0B] to-[#1F0F06] text-[#FAF8F3] rounded-2xl p-6 text-center shadow-lg relative overflow-hidden border border-[#C59B27]/70 racing-stitch-border">
        <div className="inline-flex items-center gap-1.5 bg-[#E6C762] text-stone-950 text-xs font-extrabold font-racing-num px-3 py-1 rounded-xs mb-3 shadow-xs">
          <Crown className="w-3.5 h-3.5 fill-stone-950" />
          <span>RETIREMENT CEREMONY • 第{careerHorse.generation}世代 引退式</span>
        </div>

        {/* 授与された二つ名・称号プレート */}
        <div className="my-2 bg-black/40 border border-[#C59B27]/60 rounded-xl py-2.5 px-5 inline-block shadow-inner">
          <span className="text-[10px] font-bold text-[#E6C762] uppercase tracking-widest block">
            AWARDED EPITHET / 授与称号
          </span>
          <span className="text-lg font-bold text-[#FAF8F3] font-racing-serif tracking-wide mt-0.5 block">
            【 {summary.titleName} 】
          </span>
        </div>

        <h2 className="text-2xl font-bold text-[#FAF8F3] font-racing-serif mt-2">
          {careerHorse.name}
        </h2>
        <p className="text-xs text-[#E6C762] font-semibold mt-0.5">
          {currentRouteInfo.sexAgeLabel} • {careerHorse.color} • {currentRouteInfo.name}
        </p>

        <p className="text-xs text-amber-100/90 mt-3 leading-relaxed">
          4週間にわたるキャリアを無事に完走しました。日々の調教と週末の激闘を駆け抜けた愛馬の栄誉を称えます。
        </p>

        {/* サマリー3指標 */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-[#C59B27]/35 text-center">
          <div className="bg-black/35 rounded-xl p-2.5 border border-[#C59B27]/35">
            <span className="text-[10px] text-[#E6C762] font-semibold block">生涯戦績</span>
            <span className="text-sm font-black text-[#FAF8F3] font-racing-num mt-0.5 block">
              {summary.totalRaces}戦 {summary.wins}勝
            </span>
          </div>
          <div className="bg-black/35 rounded-xl p-2.5 border border-[#C59B27]/35">
            <span className="text-[10px] text-[#E6C762] font-semibold block">レース正答</span>
            <span className="text-sm font-black text-[#FAF8F3] font-racing-num mt-0.5 block">
              {summary.totalScore} / {summary.maxPossibleScore}問
            </span>
          </div>
          <div className="bg-black/35 rounded-xl p-2.5 border border-[#C59B27]/35">
            <span className="text-[10px] text-[#E6C762] font-semibold block">習得フレーズ</span>
            <span className="text-sm font-black text-[#E6C762] font-racing-num mt-0.5 flex items-center justify-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-[#E6C762] shrink-0" />
              <span>{summary.learnedCount}語</span>
            </span>
          </div>
        </div>
      </div>

      {/* 獲得タイトル & 4週間戦績一覧カード */}
      <div className="bg-[#FFFDF9] rounded-2xl border border-[#D4C9B5] p-4 shadow-xs space-y-3 relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-linear-to-r from-[#6B3A1E] via-[#C59B27] to-[#0D3322]" />

        <div className="flex items-center justify-between pt-0.5">
          <h3 className="text-xs font-bold text-[#0D3322] font-racing-serif flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-[#9A7418]" />
            <span>獲得タイトル & 生涯戦績（全4週）</span>
          </h3>
          <span className="text-[10px] font-bold bg-[#F5F1E6] text-[#6B3A1E] border border-[#D8CEBE] px-2 py-0.5 rounded-xs">
            {currentRouteInfo.shortName}
          </span>
        </div>

        {/* 獲得タイトルバッジ一覧 */}
        <div className="flex flex-wrap gap-1.5">
          {summary.titles.length > 0 ? (
            summary.titles.map((title) => (
              <span
                key={title}
                className="inline-flex items-center gap-1 text-xs font-bold bg-[#FDF6E2] text-[#5C3A08] border border-[#C59B27] px-2.5 py-1 rounded-xs shadow-2xs"
              >
                <Award className="w-3.5 h-3.5 text-[#9A7418] shrink-0" />
                <span>{title}</span>
              </span>
            ))
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-bold bg-[#EEF5F0] text-[#0D3322] border border-[#B4CEBD] px-2.5 py-1 rounded-xs">
              <Flag className="w-3.5 h-3.5 text-[#0D3322] shrink-0" />
              <span>キャリア完走表彰（無事故完走）</span>
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
                    ? 'bg-[#FDF8EC] border-[#C59B27] text-stone-950'
                    : record
                      ? 'bg-[#F7F4EC] border-[#DFD6C5] text-stone-800'
                      : 'bg-stone-100/60 border-stone-200 text-stone-400'
                }`}
              >
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-stone-600 font-racing-num block">
                    Week {routeRace.week} • {routeRace.distanceText}
                  </span>
                  <span className="font-bold font-racing-serif text-sm truncate block">
                    {record ? record.raceName : routeRace.raceName}
                  </span>
                </div>
                <div className="text-right shrink-0 font-racing-num">
                  {record ? (
                    <>
                      <span
                        className={`inline-block font-black text-xs px-2 py-0.5 rounded-xs border ${
                          isWin
                            ? 'bg-[#E6C762] text-stone-950 border-[#9A7418]'
                            : 'bg-[#EEF5F0] text-[#0D3322] border-[#B4CEBD]'
                        }`}
                      >
                        {record.placementText}
                      </span>
                      <span className="block text-[10px] text-stone-600 mt-0.5 font-semibold">
                        正解: {record.score} / 5問
                      </span>
                    </>
                  ) : (
                    <span className="text-[11px] font-semibold text-stone-400">未出走</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 次世代（第N+1世代）新馬指名・引き継ぎカード（パドック掲示板仕様） */}
      <div className="bg-linear-to-br from-[#123F2B] via-[#0D3322] to-[#082015] text-[#FAF8F3] rounded-2xl p-5 shadow-md border border-[#C59B27]/55 racing-stitch-border space-y-3">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold font-racing-num bg-[#E6C762] text-stone-950 px-2.5 py-0.5 rounded-xs">
            <Sparkles className="w-3 h-3 fill-stone-950" />
            <span>NEXT GENERATION • 第{nextGenNumber}世代</span>
          </span>
          <span className="text-[11px] text-[#C8D8CE] font-semibold">
            新馬プロフィール設定
          </span>
        </div>

        <div>
          <p className="text-xs text-[#D8E6DD] leading-relaxed">
            先輩馬の経験を受け継ぐ、第{nextGenNumber}世代の新馬を指名しましょう（育成開始後も初回調教前まで変更可能です）。
          </p>
        </div>

        {/* 次世代の馬名・毛色設定 */}
        <div className="bg-[#071D13]/85 border border-[#C59B27]/45 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold text-[#E6C762] uppercase tracking-wider">
              新馬名 & 毛色（8種抽選）
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleRerollNextIdentity}
                className="inline-flex items-center gap-1 text-[11px] font-bold bg-[#164631] hover:bg-[#1E593F] text-[#FAF8F3] border border-[#C59B27]/50 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                title="馬名と毛色を同時にランダム再抽選"
              >
                <Dices className="w-3.5 h-3.5 text-[#E6C762]" />
                <span>命名・毛色抽選</span>
              </button>
              {!isEditingNextName && (
                <button
                  type="button"
                  onClick={handleStartEditName}
                  className="inline-flex items-center justify-center w-7 h-7 bg-[#164631] hover:bg-[#1E593F] text-[#C8D8CE] border border-[#C59B27]/40 rounded-md transition-colors cursor-pointer"
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
                  className="flex-1 min-w-0 bg-[#071D13] text-white text-sm font-bold px-2.5 py-1.5 rounded-lg border border-[#C59B27]/70 focus:outline-none focus:ring-2 focus:ring-[#E6C762]"
                />
                <button
                  type="submit"
                  className="p-1.5 rounded-lg bg-[#E6C762] text-stone-950 hover:bg-[#D4B44E] font-bold cursor-pointer shrink-0"
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
                  className="p-1.5 rounded-lg bg-[#164631] text-emerald-100 hover:bg-[#1E593F] border border-[#C59B27]/40 cursor-pointer shrink-0"
                  title="編集をキャンセル"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {nameError && (
                <p className="text-[11px] text-[#E6C762] font-semibold">{nameError}</p>
              )}
            </form>
          ) : (
            <div className="flex items-baseline justify-between gap-2 flex-wrap">
              <span className="text-xl font-bold text-[#FAF8F3] font-racing-serif tracking-wide">
                {nextName}
              </span>
              <span className="text-xs font-bold text-[#E6C762] bg-[#123A28] border border-[#C59B27]/50 px-2.5 py-0.5 rounded-xs">
                {nextRouteInfo.sexAgeLabel} / {nextColor}
              </span>
            </div>
          )}
        </div>

        {/* 次世代の路線選択（全8路線） */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 text-[#C8D8CE] font-semibold text-[11px]">
              <Compass className="w-3.5 h-3.5 text-[#E6C762]" />
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
                      ? 'bg-[#E6C762] text-stone-950 font-extrabold border-[#C59B27] shadow-2xs'
                      : 'bg-[#123A28] text-[#FAF8F3] hover:bg-[#194B34] border-[#C59B27]/30'
                  }`}
                >
                  <span className="block truncate font-bold">{route.shortName}</span>
                  <span
                    className={`block text-[9px] truncate ${
                      isSelected ? 'text-stone-800' : 'text-[#B8CEBF]'
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
          className="mt-2 w-full bg-linear-to-r from-[#E6C762] to-[#C59B27] hover:from-[#F2D675] hover:to-[#D4AA32] active:scale-[0.98] transition-all text-stone-950 font-black py-3.5 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 text-sm cursor-pointer font-racing-num"
        >
          <span>第{nextGenNumber}世代「{nextName}」の育成を始める</span>
          <ArrowRight className="w-4 h-4 stroke-[3]" />
        </button>
      </div>

      {/* まだ引退せずホームへ戻るサブボタン */}
      <button
        type="button"
        onClick={onBackToHome}
        className="w-full bg-[#FFFDF9] hover:bg-stone-100 active:scale-[0.98] transition-all text-stone-700 font-bold py-3 px-4 rounded-xl border border-[#D4C9B5] flex items-center justify-center gap-2 text-xs cursor-pointer"
      >
        <Home className="w-4 h-4 text-[#0D3322]" />
        <span>まだ引退せずホーム（厩舎）に戻る</span>
      </button>
    </div>
  );
};
