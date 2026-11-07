import type { FC } from 'react';
import { APP_VERSION } from '../version';

export const Footer: FC = () => {
  return (
    <footer className="w-full py-3 px-4 bg-[#F3EFE6] border-t border-[#D8CEBE] text-center select-none mt-auto">
      <div className="flex items-center justify-center gap-2 text-[11px] text-stone-600 font-medium">
        <span className="font-racing-serif font-bold tracking-wider text-[#0D3322]">
          TurfTalk
        </span>
        <span className="text-[#C59B27]">•</span>
        <span className="font-racing-num font-mono bg-[#FAF8F3] text-stone-700 px-1.5 py-0.5 rounded-xs text-[10px] border border-[#D4C9B5] shadow-2xs">
          {APP_VERSION}
        </span>
      </div>
    </footer>
  );
};
