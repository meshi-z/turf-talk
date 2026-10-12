import type { FC } from 'react';
import { APP_VERSION } from '../version';

export const Footer: FC = () => {
  return (
    <footer className="w-full py-3 px-4 border-t border-zinc-200/60 text-center select-none mt-auto">
      <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-400 font-medium">
        <span>TurfTalk</span>
        <span>•</span>
        <span className="font-mono bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded-sm text-[10px] border border-zinc-200/80">
          {APP_VERSION}
        </span>
      </div>
    </footer>
  );
};
