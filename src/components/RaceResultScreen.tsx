import { useEffect, useState, type FC } from 'react';
import type { PhraseItem } from '../data/phrases';
import type { UserProgress } from '../types';
import {
  Trophy,
  Home,
  Check,
  X,
  Sparkles,
  Award,
  Flag,
  Crown,
  Gauge,
  Lightbulb,
  Share2,
  Copy,
} from 'lucide-react';
import { soundManager } from '../lib/sound';
import { HorseIllustration } from './HorseIllustration';
import { calculateRacePlacement, type RacePlacement } from '../lib/raceMode';
import { calculateRaceFeedback, type RaceFeedback } from '../lib/conditionBonus';
import {
  getCareerRouteInfo,
  getCareerStageLabel,
  getCurrentWeekRaceInfo,
  type CareerRaceAdvanceResult,
} from '../lib/careerCycle';
import { SpeechButton } from './SpeechButton';
import { generateRaceShareText, generateTwitterShareUrl, copyShareTextToClipboard } from '../lib/share';

interface RaceResultScreenProps {
  score: number;
  totalQuestions: number;
  progress: UserProgress;
  answeredHistory: {
    phrase: PhraseItem;
    selectedOptionId: string;
    isCorrect: boolean;
  }[];
  addedCarrots?: number;
  careerAdvance?: CareerRaceAdvanceResult | null;
  onGoHome: () => void;
  onProceedToRetirement?: () => void;
}

export const RaceResultScreen: FC<RaceResultScreenProps> = ({
  score,
  totalQuestions,
  progress,
  answeredHistory,
  addedCarrots = 0,
  careerAdvance = null,
  onGoHome,
  onProceedToRetirement,
}) => {
  const { careerHorse } = progress;
  const routeInfo = getCareerRouteInfo(careerHorse.routeId);
  const completedWeek = careerAdvance?.completedWeek ?? careerHorse.currentWeek;
  const completedRaceInfo = getCurrentWeekRaceInfo(careerHorse.routeId, completedWeek);
  const nextStageLabel = getCareerStageLabel(careerHorse.currentWeek, careerHorse.raceHistory);
  const isFinalCareerRace = Boolean(careerAdvance?.isFinalWeekCompleted || completedWeek === 4);

  const placement: RacePlacement = calculateRacePlacement(score, completedWeek);
  const feedback: RaceFeedback = calculateRaceFeedback(score, progress.horseWeight, progress.condition);
  const [isCopied, setIsCopied] = useState(false);

  const placementRank = placement.type === '1st' ? 1 : placement.type === '2nd' ? 2 : placement.type === 'board' ? 3 : 6;

  const shareText = generateRaceShareText({
    horseName: careerHorse.name,
    generation: careerHorse.generation,
    week: completedWeek,
    raceName: completedRaceInfo.raceName,
    placementRank,
    score,
    totalQuestions,
  });

  const twitterUrl = generateTwitterShareUrl(shareText);

  const handleCopy = async () => {
    const success = await copyShareTextToClipboard(shareText);
    if (success) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };
  const isWinner = placement.type === '1st';
  const isSecond = placement.type === '2nd';

  // 画面マウント時にファンファーレ等のSEを再生
  useEffect(() => {
    const timer = setTimeout(() => {
      if (addedCarrots > 0) {
        soundManager.playCarrot();
      }
      if (isWinner || isSecond) {
        soundManager.playFanfare();
      } else {
        soundManager.playStamp();
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [isWinner, isSecond, addedCarrots]);

  const conditionMap = {
    heavy: '太め残り ↘',
    flat: '普通 ➡',
    up: '好調 ↗',
    peak: '絶好調 ⤴',
  };

  return (
    <div className="flex-1 flex flex-col p-4 max-w-md mx-auto w-full space-y-4">
      {/* 着順判定ヘッダーカード（公式着順確定ボード仕様） */}
      <div className="bg-[#FFFDF9] rounded-2xl border border-[#C59B27]/70 p-6 text-center shadow-md relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1.5 bg-linear-to-r from-[#0D3322] via-[#C59B27] to-[#0D3322]" />

        <div className="inline-flex items-center gap-1.5 bg-[#FDF6E2] text-[#5C3A08] border border-[#C59B27]/60 text-xs font-bold font-racing-num px-3 py-1 rounded-xs mb-3 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-[#9A7418]" />
          <span>
            Week {completedWeek} • {completedRaceInfo.raceName}（{completedRaceInfo.distanceText}） 確定
          </span>
        </div>

        {/* 着順表示バッジ */}
        <div className="my-2">
          <span
            className={`inline-flex items-center gap-1.5 text-lg font-black font-racing-serif px-5 py-1.5 rounded-sm border shadow-sm ${placement.badgeBg}`}
          >
            <Trophy className="w-5 h-5 shrink-0" />
            <span>{placement.rankText}</span>
          </span>
        </div>

        <h2 className="text-2xl font-bold text-stone-900 font-racing-serif mt-2 mb-1">
          {placement.title}
        </h2>
        <p className="text-xs text-stone-600 mb-4 px-2 leading-relaxed">
          {placement.comment}
        </p>

        {/* レース結果立ち絵（1着勝利: ウィナーズサークル / 惜敗・労い: クールダウン馬房） */}
        <div className="my-3 max-w-[290px] mx-auto rounded-xl overflow-hidden border border-[#C59B27]/70 shadow-xs">
          <HorseIllustration
            color={careerHorse.color}
            scene={isWinner ? 'race_victory' : 'race_cooldown'}
            alt={`${careerHorse.name}（${careerHorse.color}）の${isWinner ? '1着勝利' : '惜敗労い'}立ち絵`}
          />
        </div>

        {/* 成績・詳細スペック */}
        <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-[#E5DEC9] text-center">
          <div className="bg-[#FDF8EC] rounded-xl p-3 border border-[#E2C98A]">
            <span className="text-[11px] text-[#6B3A1E] font-semibold block mb-0.5 font-racing-num">
              出走馬（第{careerHorse.generation}世代）
            </span>
            <span className="text-sm font-bold text-stone-950 font-racing-serif flex items-center justify-center gap-1 flex-wrap">
              <span>{careerHorse.name}</span>
              <span className="font-sans text-[11px] font-normal text-stone-600">
                （{routeInfo.sexAgeLabel} / {careerHorse.color}）
              </span>
            </span>
          </div>
          <div className="bg-[#F5F1E6] rounded-xl p-3 border border-[#DFD6C5]">
            <span className="text-[11px] text-stone-600 font-semibold block mb-0.5">
              レース正解率
            </span>
            <span className="text-base font-black text-[#0D3322] font-racing-num">
              {score} / {totalQuestions} 問
            </span>
          </div>
        </div>
      </div>

      {/* キャリアステージ進行カード */}
      {careerAdvance && (
        <div className="bg-linear-to-r from-[#123F2B] to-[#0D3322] text-[#FAF8F3] rounded-2xl p-4 shadow-sm border border-[#C59B27]/50 racing-stitch-border flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#071D13] border border-[#C59B27]/50 flex items-center justify-center shrink-0">
            <Flag className="w-5 h-5 text-[#E6C762]" />
          </div>
          <div className="flex-1 text-left">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#C8D8CE]">
                Career Stage Progression
              </span>
              <span className="text-[11px] font-extrabold bg-[#E6C762] text-stone-950 px-2 py-0.5 rounded-xs">
                {nextStageLabel}
              </span>
            </div>
            {careerAdvance.steppedUp ? (
              <p className="text-xs font-bold text-[#FAF8F3] mt-1 font-racing-num">
                Week {careerAdvance.completedWeek} を完走し、Week {careerAdvance.nextWeek} へステップアップしました
              </p>
            ) : (
              <p className="text-xs font-bold text-[#FAF8F3] mt-1 font-racing-num">
                Week 4 ラストラン（{completedRaceInfo.raceName}）を完走しました
              </p>
            )}
          </div>
        </div>
      )}

      {/* 余力温存ボーナスカード（にんじん獲得） */}
      {addedCarrots > 0 && (
        <div className="bg-linear-to-r from-[#6B3A1E] to-[#8F4E24] text-[#FAF8F3] rounded-2xl p-4 shadow-sm border border-[#E6C762]/60 flex items-center gap-3 animate-in zoom-in-95 duration-200">
          <div className="text-2xl shrink-0">🥕</div>
          <div className="flex-1 text-left">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#E6C762]">
                Stamina Reserve Bonus
              </span>
              <span className="text-xs font-black font-racing-num bg-[#E6C762] text-stone-950 px-2 py-0.5 rounded-xs shadow-2xs">
                +{addedCarrots}個獲得
              </span>
            </div>
            <p className="text-xs font-bold mt-0.5 font-racing-num">
              愛馬の余力を温存してゴール。にんじんを獲得しました（所持数: {progress.carrotCount}個）
            </p>
            <p className="text-[10px] text-amber-100/90 mt-0.5">
              平日に調教できない日があっても、自動で連続調教記録を救済維持できます。
            </p>
          </div>
        </div>
      )}

      {/* レース後フィードバック・愛馬状態カード */}
      <div className="bg-[#FFFDF9] rounded-2xl border border-[#D4C9B5] p-4 shadow-xs text-left">
        <h3 className="text-xs font-bold text-[#0D3322] font-racing-serif mb-2 flex items-center gap-1.5">
          <Gauge className="w-4 h-4 text-[#0D3322]" />
          <span>レース後フィードバック・愛馬の状態</span>
        </h3>

        <div className="grid grid-cols-2 gap-2 text-center my-2 text-xs">
          <div className="bg-[#F5F1E6] rounded-xl p-2.5 border border-[#DFD6C5]">
            <span className="text-[10px] text-stone-600 block">馬体重変動</span>
            <div className="font-extrabold text-stone-900 font-racing-num flex items-baseline justify-center gap-1 mt-0.5">
              <span>{feedback.nextWeight} kg</span>
              <span className="text-[10px] text-[#0D3322] font-bold">
                ({feedback.weightChange}kg 絞れました)
              </span>
            </div>
          </div>
          <div className="bg-[#EEF5F0] rounded-xl p-2.5 border border-[#BDCEB9]">
            <span className="text-[10px] text-stone-600 block">次走へ向けた調子</span>
            <div className="font-extrabold text-[#0D3322] flex items-baseline justify-center gap-1 mt-0.5">
              <span>{conditionMap[feedback.nextCondition]}</span>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-stone-700 leading-relaxed mt-1.5 flex items-start gap-1.5">
          <Lightbulb className="w-3.5 h-3.5 text-[#9A7418] shrink-0 mt-0.5" />
          <span>{feedback.comment}</span>
        </p>
      </div>

      {/* レース出走フレーズ振り返り */}
      <div className="bg-[#FFFDF9] rounded-2xl border border-[#D4C9B5] p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-extrabold text-[#8A6D1B] uppercase tracking-widest flex items-center gap-1.5">
            <Award className="w-4 h-4 text-[#9A7418]" />
            <span>Race Review / 出走フレーズ振り返り</span>
          </h3>
          <span className="text-[11px] font-bold text-stone-600 font-racing-num">
            全5問
          </span>
        </div>

        <div className="space-y-3">
          {answeredHistory.map((item, idx) => (
            <div
              key={item.phrase.id}
              className={`p-3 rounded-xl border transition-all text-xs ${
                item.isCorrect
                  ? 'bg-[#F3F8F4] border-[#B4CEBD]'
                  : 'bg-red-50/50 border-red-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="text-[10px] font-bold text-stone-600 font-racing-num">
                  第{idx + 1}展開:
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-xs border ${
                    item.isCorrect
                      ? 'bg-[#0D3322] text-[#E6C762] border-[#C59B27]'
                      : 'bg-red-100 text-red-800 border-red-200'
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

              <div className="flex items-start justify-between gap-2 mb-1">
                <blockquote className="font-bold font-racing-serif text-sm text-stone-900 leading-snug flex-1">
                  “{item.phrase.phrase}”
                </blockquote>
                <SpeechButton text={item.phrase.phrase} size="xs" />
              </div>
              <p className="text-[11px] font-semibold text-stone-800 mb-1">
                意味: {item.phrase.options.find((o) => o.isCorrect)?.text}
              </p>
              <p className="text-[10px] text-stone-600 leading-normal">
                {item.phrase.explanation}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* SNSシェア */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <a
            href={twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex-1 ${isWinner ? 'bg-linear-to-r from-[#9A7418] via-[#C59B27] to-[#8A6D1B] text-[#FFFDF9] font-black border border-[#E6C762]' : 'bg-black hover:bg-stone-900 text-white font-bold border border-stone-800'} py-3 px-4 rounded-xl shadow-xs flex items-center justify-center gap-2 text-sm active:scale-[0.98] transition-all`}
            aria-label="レース結果をXでシェアする"
          >
            <Share2 className="w-4 h-4 text-[#E6C762]" />
            <span>Xでレース結果をシェア</span>
          </a>
          <button
            type="button"
            onClick={handleCopy}
            className="bg-[#FFFDF9] hover:bg-stone-100 text-stone-700 border border-[#D4C9B5] p-3 rounded-xl shadow-2xs active:scale-[0.95] transition-all cursor-pointer flex items-center justify-center shrink-0"
            title="シェア用テキストをコピー"
            aria-label="シェア用テキストをクリップボードにコピー"
          >
            {isCopied ? (
              <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
            ) : (
              <Copy className="w-4 h-4 text-stone-600" />
            )}
          </button>
        </div>
        {isCopied && (
          <p role="status" className="text-center text-[11px] font-bold text-emerald-800 animate-fade-in">
            テキストをクリップボードにコピーしました！📋
          </p>
        )}
      </div>

      {/* アクションボタン */}
      <div className="space-y-2 pt-2">
        {isFinalCareerRace && onProceedToRetirement && (
          <button
            onClick={onProceedToRetirement}
            className="w-full bg-linear-to-r from-[#E6C762] to-[#C59B27] hover:from-[#F2D675] hover:to-[#D4AA32] active:scale-[0.98] transition-all text-stone-950 font-black py-4 px-4 rounded-xl shadow-md border border-[#9A7418] flex items-center justify-center gap-2 text-base cursor-pointer"
          >
            <Crown className="w-5 h-5 fill-stone-950 shrink-0" />
            <span>引退式セレモニーへ進む（第{careerHorse.generation}世代 完走）</span>
          </button>
        )}
        <button
          onClick={onGoHome}
          className={`w-full active:scale-[0.98] transition-all font-bold py-3.5 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 text-sm cursor-pointer ${
            isFinalCareerRace && onProceedToRetirement
              ? 'bg-[#FFFDF9] hover:bg-stone-100 text-stone-800 border border-[#D4C9B5]'
              : 'bg-[#0D3322] hover:bg-[#164B33] text-[#FAF8F3] border border-[#C59B27]/50'
          }`}
        >
          <Home className="w-4 h-4 text-[#E6C762]" />
          <span>ホーム（厩舎）に戻る</span>
        </button>
        <p className="text-[11px] text-center text-stone-600">
          {isFinalCareerRace
            ? '※ 4週間のキャリアをすべて完走しました。引退式で称号を授与し、次世代の新馬を迎えましょう。'
            : '※ 週末レースの出走は1週末につき1回までです。次走へ向けて日々の調教を重ねましょう。'}
        </p>
      </div>
    </div>
  );
};
