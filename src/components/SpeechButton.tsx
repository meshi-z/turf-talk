import { useState, useEffect, type FC, type MouseEvent } from 'react';
import { Volume2 } from 'lucide-react';
import { speechManager, isSpeechSynthesisSupported, type SpeechAccent, type SpeechRate } from '../lib/speech';
import { useSpeechSettings } from '../hooks/useSpeechSettings';

interface SpeechButtonProps {
  text: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md';
  showLabel?: boolean;
  label?: string;
  accent?: SpeechAccent;
  rate?: SpeechRate;
}

export const SpeechButton: FC<SpeechButtonProps> = ({
  text,
  className = '',
  size = 'sm',
  showLabel = false,
  label = '発音を聞く',
  accent: propAccent,
  rate: propRate,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const { accent: contextAccent, rate: contextRate } = useSpeechSettings();

  const activeAccent = propAccent ?? contextAccent;
  const activeRate = propRate ?? contextRate;

  useEffect(() => {
    setIsSupported(isSpeechSynthesisSupported());
  }, []);

  // アンマウント時に音声停止
  useEffect(() => {
    return () => {
      if (isPlaying) {
        speechManager.cancel();
      }
    };
  }, [isPlaying]);

  if (!isSupported) {
    return null;
  }

  const handlePlay = (e: MouseEvent) => {
    e.stopPropagation();

    if (isPlaying) {
      speechManager.cancel();
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    speechManager.speak(text, {
      accent: activeAccent,
      rate: activeRate,
      onStart: () => setIsPlaying(true),
      onEnd: () => setIsPlaying(false),
      onError: () => setIsPlaying(false),
    });
  };

  const sizeClasses = {
    xs: 'py-0.5 px-1.5 text-[10px] gap-1',
    sm: 'py-1 px-2 text-xs gap-1.5',
    md: 'py-1.5 px-3 text-sm gap-2',
  }[size];

  const iconSizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
  }[size];

  return (
    <button
      type="button"
      onClick={handlePlay}
      aria-label={`${text} の発音を聞く`}
      title={isPlaying ? '音声を停止' : `発音を聞く (${activeRate}x)`}
      className={`inline-flex items-center justify-center font-bold rounded-lg transition-all cursor-pointer select-none shrink-0 ${
        isPlaying
          ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-400 animate-pulse'
          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 active:scale-95'
      } ${sizeClasses} ${className}`}
    >
      <Volume2 className={`${iconSizeClasses} ${isPlaying ? 'animate-bounce' : ''}`} />
      {showLabel && <span>{label}</span>}
    </button>
  );
};
