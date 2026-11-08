import { useEffect, useState, type FC } from 'react';
import type { PhraseItem } from '../data/phrases';
import type { UserProgress } from '../types';
import { TrendingUp, Home, Sparkles, Share2, Copy, Check } from 'lucide-react';
import { soundManager } from '../lib/sound';
import { getLogicalDate } from '../lib/logicalDate';
import { HorseIllustration } from './HorseIllustration';
import { SpeechButton } from './SpeechButton';
import {
  generateTrainingShareText,
  generateTwitterShareUrl,
  copyShareTextToClipboard,
} from '../lib/share';

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
  const [isCopied, setIsCopied] = useState(false);
  const isPerfect = score === totalQuestions;
  const todayDateString = getLogicalDate().toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  // 画面マウント時にスタンプ押印音を再生（着地タイミングに同期）
  useEffect(() => {
    const timer = setTimeout(() => {
      soundManager.playStamp();
    }, 180);
    return () => clearTimeout(timer);
  }, []);

  const shareText = generateTrainingShareText({
    horseName: progress.horseName,
    score,
    totalQuestions,
    streakDays: progress.streakDays,
    condition: progress.condition,
  });

  const twitterUrl = generateTwitterShareUrl(shareText);

  const handleCopy = async () => {
    const success = await copyShareTextToClipboard(shareText);
    if (success) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 max-w-md mx-auto w-full space-y-4">
      {/* 完了ヘッダーカード & スタンプ演出（公式調教時計表・レーシングプログラム仕様） */}
      <div className="bg-[#FFFDF9] rounded-2xl border border-[#D4C9B5] p-6 text-center shadow-xs relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-linear-to-r from-[#0D3322] via-[#C59B27] to-[#0D3322]" />

        <div className="inline-flex items-center gap-1.5 bg-[#EEF5F0] text-[#0D3322] border border-[#B4CEBD] text-xs font-bold px-3 py-1 rounded-xs mb-3">
          <Sparkles className="w-3.5 h-3.5 text-[#9A7418]" />
          <span>本日の調教メニュー 完了</span>
        </div>

        <h2 className="text-2xl font-bold text-[#0D3322] font-racing-serif mb-1">
          {isPerfect ? '素晴らしい手応え' : 'しっかり負荷をかけました'}
        </h2>
        <p className="text-xs text-stone-600 mb-5">
          愛馬「{progress.horseName}」の息遣いも良く、週末のレースへ前進しています。
        </p>

        {/* 調教済ハンコ風スタンプ（アニメーション & 波紋演出） */}
        <div className="inline-block relative py-2">
          {/* 着地時の波紋リング */}
          <div className="absolute inset-0 m-auto w-28 h-28 rounded-full border-2 border-red-600/40 pointer-events-none animate-stamp-ripple" />

          <div className="relative w-32 h-32 rounded-full border-4 border-double border-red-700 flex flex-col items-center justify-center p-2 text-red-700 select-none shadow-md animate-stamp-drop bg-[#FFFDF9]/75 backdrop-blur-2xs">
            <div className="text-[10px] font-black tracking-widest border-b-2 border-red-600/80 pb-0.5 px-2">
              美浦・栗東 トレセン
            </div>
            <div className="text-2xl font-black font-racing-serif my-0.5 tracking-widest drop-shadow-2xs">
              調教済
            </div>
            <div className="text-[10px] font-bold border-t-2 border-red-600/80 pt-0.5 px-1 font-mono font-racing-num">
              {todayDateString}
            </div>
          </div>
        </div>

        {/* 調教完了立ち絵（右向き・トレセン厩舎背景合成） */}
        <div className="mt-4 max-w-[290px] mx-auto rounded-xl overflow-hidden border border-[#C59B27]/60 shadow-xs">
          <HorseIllustration
            color={progress.careerHorse.color}
            scene="training_complete"
            alt={`${progress.horseName}（${progress.careerHorse.color}）の調教完了立ち絵`}
          />
        </div>

        {/* スコア・ステータス変動 */}
        <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-[#E5DEC9] text-center">
          <div className="bg-[#F5F1E6] rounded-xl p-3 border border-[#DFD6C5]">
            <span className="text-[11px] text-stone-600 block mb-0.5">調教正解率</span>
            <span className="text-xl font-black text-[#0D3322] font-racing-num">
              {score} / {totalQuestions}
            </span>
          </div>
          <div className="bg-[#EEF5F0] rounded-xl p-3 border border-[#BDCEB9]">
            <span className="text-[11px] text-[#0D3322] block mb-0.5">愛馬の調子</span>
            <span className="text-base font-bold text-[#0D3322] flex items-center justify-center gap-1">
              <TrendingUp className="w-4 h-4 text-[#0D3322]" />
              <span>上昇気流 ↗</span>
            </span>
          </div>
        </div>
      </div>

      {/* 本日の履修フレーズ振り返り */}
      <div className="bg-[#FFFDF9] rounded-2xl border border-[#D4C9B5] p-4 shadow-xs">
        <h3 className="text-xs font-extrabold text-[#8A6D1B] uppercase tracking-widest mb-3">
          Training Review / 本日の履修フレーズ
        </h3>
        <div className="space-y-3">
          {answeredHistory.map((item, idx) => (
            <div
              key={item.phrase.id}
              className="p-3 rounded-xl bg-[#F7F4EC] border border-[#E2DAC9] text-left"
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <span className="text-xs font-bold text-stone-900 font-racing-serif truncate">
                    {idx + 1}. “{item.phrase.phrase}”
                  </span>
                  <SpeechButton text={item.phrase.phrase} size="xs" />
                </div>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-xs shrink-0 border ${
                    item.isCorrect
                      ? 'bg-[#EEF5F0] text-[#0D3322] border-[#A9CDB6]'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  {item.isCorrect ? '正解' : '要復習'}
                </span>
              </div>
              <p className="text-xs text-stone-700 leading-snug">
                {item.phrase.explanation}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* SNSシェア & アクションボタン */}
      <div className="space-y-2.5 mt-auto pt-1">
        <div className="flex items-center gap-2">
          <a
            href={twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-black hover:bg-stone-900 text-white font-bold py-3 px-4 rounded-xl shadow-xs border border-stone-800 flex items-center justify-center gap-2 text-sm active:scale-[0.98] transition-all"
            aria-label="調教結果をXでシェアする"
          >
            <Share2 className="w-4 h-4 text-[#E6C762]" />
            <span>Xで調教結果をシェア</span>
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

        {/* ホームへ戻るボタン */}
        <button
          onClick={onGoHome}
          className="w-full bg-[#0D3322] hover:bg-[#164B33] active:scale-[0.98] transition-all text-[#FAF8F3] border border-[#C59B27]/50 font-bold py-3.5 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 text-base cursor-pointer"
        >
          <Home className="w-5 h-5 text-[#E6C762]" />
          <span>厩舎（ホーム）へ戻る</span>
        </button>
      </div>
    </div>
  );
};
