import { useEffect, useState, type FC } from 'react';
import {
  HELP_GUIDE_STEPS,
  type HelpGuideStepId,
} from '../lib/helpGuide';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Compass,
  Crown,
  Dumbbell,
  HelpCircle,
  Lightbulb,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react';

interface HelpGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STEP_ICON_MAP: Record<HelpGuideStepId, FC<{ className?: string }>> = {
  overview: Compass,
  'weekday-training': Dumbbell,
  'weekend-race': Trophy,
  'career-retirement': Crown,
  'archive-features': BookOpen,
};

export const HelpGuideModal: FC<HelpGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  // モーダルが開くたびに先頭ステップから表示し、Escapeキーで閉じられるようにする
  useEffect(() => {
    if (!isOpen) return;
    setActiveStepIndex(0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'ArrowRight') {
        setActiveStepIndex((prev) => Math.min(HELP_GUIDE_STEPS.length - 1, prev + 1));
      } else if (event.key === 'ArrowLeft') {
        setActiveStepIndex((prev) => Math.max(0, prev - 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentStep = HELP_GUIDE_STEPS[activeStepIndex] ?? HELP_GUIDE_STEPS[0];
  const StepIcon = STEP_ICON_MAP[currentStep.id] ?? HelpCircle;
  const isFirstStep = activeStepIndex === 0;
  const isLastStep = activeStepIndex === HELP_GUIDE_STEPS.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-[2px] animate-fade-in"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-guide-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md max-h-[90vh] flex flex-col bg-[#FAF8F3] rounded-2xl border-2 border-[#C59B27]/80 shadow-2xl overflow-hidden text-stone-900"
      >
        {/* モーダルヘッダー（クラブハウス公式プログラム風） */}
        <div className="bg-linear-to-r from-[#123F2B] via-[#0D3322] to-[#082015] text-[#FAF8F3] px-4 py-3.5 border-b-2 border-[#C59B27]/80 racing-stitch-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#C59B27]/20 border border-[#C59B27]/60 flex items-center justify-center shrink-0">
              <HelpCircle className="w-4.5 h-4.5 text-[#E6C762]" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold tracking-widest text-[#E6C762] uppercase font-racing-num">
                OFFICIAL RACING GUIDE
              </div>
              <h2
                id="help-guide-modal-title"
                className="text-base font-bold text-[#FAF8F3] font-racing-serif tracking-wide truncate"
              >
                TurfTalk 使い方・育成ガイド
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="ヘルプガイドを閉じる"
            className="p-1.5 rounded-lg text-[#C8D8CE] hover:text-[#FAF8F3] hover:bg-white/10 border border-transparent hover:border-[#C59B27]/40 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ゼッケン風ステップ切り替えタブバー（1〜5） */}
        <div
          role="tablist"
          aria-label="ガイドのステップ選択"
          className="grid grid-cols-5 gap-1 px-2.5 py-2 bg-[#F2ECE0] border-b border-[#D8CEBE] shrink-0"
        >
          {HELP_GUIDE_STEPS.map((step, index) => {
            const isSelected = index === activeStepIndex;
            return (
              <button
                key={step.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setActiveStepIndex(index)}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl border text-center transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#0D3322] text-[#FAF8F3] border-[#C59B27] shadow-xs'
                    : 'bg-[#FFFDF9] text-stone-700 border-[#D4C9B5] hover:bg-stone-100'
                }`}
              >
                <span
                  className={`saddle-cloth-badge w-5 h-5 text-[10px] font-racing-num mb-0.5 ${
                    isSelected
                      ? 'bg-[#FAF8F3] text-[#0D3322] border border-[#C59B27]'
                      : 'bg-[#EFE9DC] text-stone-700 border border-[#C8BFA8]'
                  }`}
                >
                  {step.stepNumber}
                </span>
                <span className="text-[10px] font-bold tracking-tight leading-tight truncate w-full">
                  {step.shortLabel}
                </span>
              </button>
            );
          })}
        </div>

        {/* メインコンテンツ領域（スクロール可能） */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {/* ステップ見出し */}
          <div className="bg-[#FFFDF9] rounded-xl p-3.5 border border-[#D4C9B5] shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-[#9A7418] font-racing-num">
                <StepIcon className="w-3.5 h-3.5 text-[#9A7418]" />
                <span>
                  STEP {currentStep.stepNumber} / {HELP_GUIDE_STEPS.length} • {currentStep.subtitle}
                </span>
              </span>
            </div>
            <h3 className="text-lg font-bold text-[#0D3322] font-racing-serif leading-snug">
              {currentStep.title}
            </h3>
            <p className="text-xs text-stone-700 leading-relaxed">{currentStep.lead}</p>
          </div>

          {/* 3つの重要ポイント解説リスト */}
          <div className="space-y-2.5">
            {currentStep.highlights.map((item, idx) => (
              <div
                key={item.title}
                className="bg-[#FFFDF9] rounded-xl p-3 border border-[#DFD6C5] shadow-2xs flex items-start gap-2.5"
              >
                <span
                  className={`saddle-cloth-badge px-2 py-0.5 text-[10px] font-racing-num shrink-0 mt-0.5 ${
                    idx === 0
                      ? 'bg-[#0D3322] text-[#FAF8F3] border border-[#C59B27]'
                      : idx === 1
                        ? 'bg-[#6B3A1E] text-[#FAF8F3] border border-[#C59B27]'
                        : 'bg-[#5C4312] text-[#FAF8F3] border border-[#C59B27]'
                  }`}
                >
                  {item.badge}
                </span>
                <div className="space-y-0.5 min-w-0">
                  <h4 className="text-xs font-bold text-stone-900 font-racing-serif">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-stone-600 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ワンポイントアドバイス枠 */}
          <div className="bg-[#FDF6E2] border border-[#C59B27]/65 rounded-xl p-3 flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-[#9A7418] shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#5C3A08] font-medium leading-relaxed">
              {currentStep.tip}
            </p>
          </div>
        </div>

        {/* モーダルフッター（前へ / ステップドット / 次へ・はじめる） */}
        <div className="px-4 py-3 bg-[#F2ECE0] border-t border-[#D8CEBE] flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveStepIndex((prev) => Math.max(0, prev - 1))}
            disabled={isFirstStep}
            className={`inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
              isFirstStep
                ? 'bg-stone-200/60 text-stone-400 border-stone-300 cursor-not-allowed'
                : 'bg-[#FFFDF9] text-stone-800 border-[#C8BFA8] hover:bg-stone-100 active:scale-98 cursor-pointer shadow-2xs'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>前へ</span>
          </button>

          {/* ステップインジケータードット */}
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {HELP_GUIDE_STEPS.map((step, index) => (
              <span
                key={step.id}
                className={`h-2 rounded-full transition-all ${
                  index === activeStepIndex
                    ? 'w-5 bg-[#0D3322] border border-[#C59B27]'
                    : 'w-2 bg-[#C8BFA8]'
                }`}
              />
            ))}
          </div>

          {isLastStep ? (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#0D3322] hover:bg-[#164B33] text-[#FAF8F3] border border-[#C59B27] shadow-xs active:scale-98 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#E6C762]" />
              <span>はじめる</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() =>
                setActiveStepIndex((prev) => Math.min(HELP_GUIDE_STEPS.length - 1, prev + 1))
              }
              className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#0D3322] hover:bg-[#164B33] text-[#FAF8F3] border border-[#C59B27] shadow-xs active:scale-98 transition-all cursor-pointer"
            >
              <span>次へ</span>
              <ChevronRight className="w-4 h-4 text-[#E6C762]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
