import type { FC } from 'react';
import { HelpCircle, Download } from 'lucide-react';
import { APP_VERSION } from '../version';
import { usePwaInstall } from '../lib/pwa';
import type { LegalTabId } from '../lib/legalContent';

interface FooterProps {
  onOpenHelp: () => void;
  onOpenLegal: (tab: LegalTabId) => void;
}

export const Footer: FC<FooterProps> = ({ onOpenHelp, onOpenLegal }) => {
  const { isInstalled, resetDismiss, canInstall, isIosDevice } = usePwaInstall();

  return (
    <footer className="w-full py-3 px-4 bg-[#F3EFE6] border-t border-[#D8CEBE] text-center select-none mt-auto space-y-1.5">
      <div className="flex items-center justify-center gap-2 text-[11px] text-stone-600 font-medium flex-wrap">
        <span className="font-racing-serif font-bold tracking-wider text-[#0D3322]">
          TurfTalk
        </span>
        <span className="text-[#C59B27]">•</span>
        <span className="font-racing-num font-mono bg-[#FAF8F3] text-stone-700 px-1.5 py-0.5 rounded-xs text-[10px] border border-[#D4C9B5] shadow-2xs">
          {APP_VERSION}
        </span>
        <span className="text-[#C59B27]">•</span>
        <button
          type="button"
          onClick={onOpenHelp}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0D3322] hover:text-[#164B33] underline decoration-[#C59B27]/70 underline-offset-2 transition-colors cursor-pointer"
        >
          <HelpCircle className="w-3 h-3 text-[#9A7418]" />
          <span>使い方ガイド</span>
        </button>

        {!isInstalled && (canInstall || isIosDevice) && (
          <>
            <span className="text-[#C59B27]">•</span>
            <button
              type="button"
              onClick={resetDismiss}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0D3322] hover:text-[#164B33] underline decoration-[#C59B27]/70 underline-offset-2 transition-colors cursor-pointer"
            >
              <Download className="w-3 h-3 text-[#9A7418]" />
              <span>アプリを追加</span>
            </button>
          </>
        )}
      </div>

      <div className="flex items-center justify-center gap-x-2.5 gap-y-1 text-[10px] text-stone-600 flex-wrap">
        <button
          type="button"
          onClick={() => onOpenLegal('terms')}
          className="hover:text-[#0D3322] underline decoration-stone-400/70 underline-offset-2 transition-colors cursor-pointer"
        >
          利用規約・免責
        </button>
        <span className="text-stone-400">|</span>
        <button
          type="button"
          onClick={() => onOpenLegal('privacy')}
          className="hover:text-[#0D3322] underline decoration-stone-400/70 underline-offset-2 transition-colors cursor-pointer"
        >
          プライバシーポリシー
        </button>
        <span className="text-stone-400">|</span>
        <button
          type="button"
          onClick={() => onOpenLegal('storage')}
          className="hover:text-[#0D3322] underline decoration-stone-400/70 underline-offset-2 transition-colors cursor-pointer"
        >
          データ保存について
        </button>
        <span className="text-stone-400">|</span>
        <button
          type="button"
          onClick={() => onOpenLegal('contact')}
          className="hover:text-[#0D3322] underline decoration-stone-400/70 underline-offset-2 transition-colors cursor-pointer"
        >
          お問い合わせ
        </button>
      </div>
    </footer>
  );
};
