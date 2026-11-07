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
    <header className="sticky top-0 z-50 flex items-center justify-between px-3 sm:px-4 h-14 bg-[#0D3322] text-amber-50 border-b-2 border-[#C59B27]/80 shadow-md">
      <div className="flex items-center space-x-2.5 min-w-0 pr-1">
        <div className="p-0.5 rounded-lg bg-linear-to-br from-[#E6C762] to-[#9A7418] shadow-xs shrink-0">
          <img
            src={`${import.meta.env.BASE_URL}icon.svg`}
            alt="TurfTalk"
            className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-md select-none object-cover block"
          />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-bold tracking-wide text-[#FAF8F3] font-racing-serif flex items-center gap-1.5 leading-none">
            <span>TurfTalk</span>
          </h1>
          <p className="text-[10px] sm:text-[11px] text-[#C8D8CE] font-medium whitespace-nowrap mt-0.5 tracking-wider">
            競馬英語マイクロラーニング
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* 連続日数ストリーク（真鍮プレート風バッジ） */}
        <div className="flex items-center gap-1 bg-[#164631] text-[#FAF8F3] border border-[#C59B27]/60 px-2.5 py-1 rounded-md text-xs font-bold shadow-xs whitespace-nowrap shrink-0 font-racing-num">
          <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#E6C762] fill-[#C59B27] shrink-0" />
          <span>{streakDays}日連続</span>
        </div>

        <button
          onClick={handleToggleSound}
          aria-label={soundEnabled ? 'サウンドをミュートにする' : 'サウンドを有効にする'}
          title={soundEnabled ? 'サウンドON' : 'サウンドOFF'}
          className="p-1.5 rounded-md text-[#C8D8CE] hover:text-[#FAF8F3] hover:bg-[#184D36] border border-transparent hover:border-[#C59B27]/40 active:scale-95 transition-all cursor-pointer shrink-0"
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 text-[#E6C762]" />
          ) : (
            <VolumeX className="w-4 h-4 text-[#8DA597]" />
          )}
        </button>
      </div>
    </header>
  );
};
