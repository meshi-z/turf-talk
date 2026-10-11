import type { FC } from 'react';
import { Flame } from 'lucide-react';

interface HeaderProps {
  streakDays: number;
}

export const Header: FC<HeaderProps> = ({ streakDays }) => {
  return (
    <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-emerald-100 shadow-xs">
      <div className="flex items-center space-x-2">
        <span className="text-2xl" role="img" aria-label="horse">🏇</span>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-emerald-950 flex items-center gap-1 leading-none">
            TurfTalk
            <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full">
              Alpha
            </span>
          </h1>
          <p className="text-[11px] text-emerald-700 font-medium">海外競馬英語マイクロラーニング</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-full text-xs font-bold shadow-xs">
          <Flame className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
          <span>{streakDays}日連続</span>
        </div>
      </div>
    </header>
  );
};
