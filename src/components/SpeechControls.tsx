import { useState, useEffect, type FC } from 'react';
import { useSpeechSettings } from '../hooks/useSpeechSettings';
import { isSpeechSynthesisSupported, type SpeechAccent, ACCENT_LABELS } from '../lib/speech';

interface SpeechControlsProps {
  className?: string;
  compact?: boolean;
}

const ACCENTS: SpeechAccent[] = ['en-GB', 'en-US', 'en-AU'];

export const SpeechControls: FC<SpeechControlsProps> = ({ className = '', compact = false }) => {
  const [isSupported, setIsSupported] = useState(true);
  const { accent, rate, setAccent, setRate } = useSpeechSettings();

  useEffect(() => {
    setIsSupported(isSpeechSynthesisSupported());
  }, []);

  if (!isSupported) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* 速度切り替え (1.0x / 0.8x) */}
      <div className="inline-flex rounded-lg border border-zinc-200/90 bg-zinc-100/80 p-0.5 text-[11px] font-bold shadow-2xs">
        <button
          type="button"
          onClick={() => setRate(1.0)}
          className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
            rate === 1.0
              ? 'bg-white text-emerald-800 shadow-2xs font-extrabold'
              : 'text-zinc-600 hover:text-zinc-900'
          }`}
          title="等速 (実戦スピード 1.0x)"
        >
          1.0x
        </button>
        <button
          type="button"
          onClick={() => setRate(0.8)}
          className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
            rate === 0.8
              ? 'bg-white text-emerald-800 shadow-2xs font-extrabold'
              : 'text-zinc-600 hover:text-zinc-900'
          }`}
          title="ゆっくり (聞き取りやすい 0.8x)"
        >
          0.8x
        </button>
      </div>

      {/* アクセント切り替え (🇬🇧 UK / 🇺🇸 US / 🇦🇺 AU) */}
      <div className="inline-flex rounded-lg border border-zinc-200/90 bg-zinc-100/80 p-0.5 text-[11px] font-bold shadow-2xs">
        {ACCENTS.map((acc) => {
          const isSelected = accent === acc;
          const info = ACCENT_LABELS[acc];
          return (
            <button
              key={acc}
              type="button"
              onClick={() => setAccent(acc)}
              className={`px-1.5 py-0.5 rounded-md transition-all flex items-center gap-0.5 cursor-pointer ${
                isSelected
                  ? 'bg-white text-emerald-900 shadow-2xs font-extrabold'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
              title={info.label}
            >
              <span>{info.flag}</span>
              {!compact && <span>{info.short}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};
