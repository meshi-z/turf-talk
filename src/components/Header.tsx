import { useState, type FC } from 'react';
import { Flame, Volume2, VolumeX } from 'lucide-react';
import { soundManager } from '../lib/sound';

interface HeaderProps {
  streakDays: number;
}

export const Header: FC<HeaderProps> = ({ streakDays }) => {
  const [soundEnabled, setSoundEnabled] = useState(() => soundManager.isEnabled());

  const handleToggleSound = () => {
    const nextVal = !soundEnabled;
    soundManager.setEnabled(nextVal);
    setSoundEnabled(nextVal);
  };

  return (
    <header className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 bg-white border-b border-emerald-100 shadow-xs">
      <div className="flex items-center space-x-2 min-w-0 pr-1">
        <span className="text-2xl shrink-0 select-none" role="img" aria-label="horse">🏇</span>
        <div className="min-w-0">
          <h1 className="text-lg font-bold tracking-tight text-emerald-950 flex items-center gap-1 leading-none">
            TurfTalk
            <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full shrink-0">
              Alpha
            </span>
          </h1>
          <p className="text-[10px] sm:text-[11px] text-emerald-700 font-medium whitespace-nowrap mt-0.5">
            競馬英語マイクロラーニング
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* 連続日数ストリーク */}
        <div className="flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200 px-2 sm:px-2.5 py-1 rounded-full text-xs font-bold shadow-xs whitespace-nowrap shrink-0">
          <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 fill-amber-500 animate-pulse shrink-0" />
          <span>{streakDays}日連続</span>
        </div>

        <button
          onClick={handleToggleSound}
          aria-label={soundEnabled ? 'サウンドをミュートにする' : 'サウンドを有効にする'}
          title={soundEnabled ? 'サウンドON' : 'サウンドOFF'}
          className="p-1 sm:p-1.5 rounded-full text-zinc-500 hover:text-emerald-700 hover:bg-emerald-50 active:scale-95 transition-all cursor-pointer shrink-0"
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 text-emerald-700" />
          ) : (
            <VolumeX className="w-4 h-4 text-zinc-400" />
          )}
        </button>
      </div>
    </header>
  );
};
