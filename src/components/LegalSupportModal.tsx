import { useEffect, useState, type FC } from 'react';
import {
  LEGAL_TABS,
  OFFICIAL_X_HANDLE,
  OFFICIAL_X_URL,
  generateFeedbackTemplate,
  type LegalTabId,
} from '../lib/legalContent';
import { copyShareTextToClipboard } from '../lib/share';
import {
  AlertTriangle,
  Check,
  Cloud,
  Copy,
  Database,
  ExternalLink,
  FileText,
  Info,
  MessageSquare,
  ShieldCheck,
  X,
} from 'lucide-react';

interface LegalSupportModalProps {
  isOpen: boolean;
  initialTab?: LegalTabId;
  isCloudLinked?: boolean;
  onClose: () => void;
  onOpenAuth?: () => void;
}

const TAB_ICON_MAP: Record<LegalTabId, FC<{ className?: string }>> = {
  terms: FileText,
  privacy: ShieldCheck,
  storage: Database,
  contact: MessageSquare,
};

export const LegalSupportModal: FC<LegalSupportModalProps> = ({
  isOpen,
  initialTab = 'terms',
  isCloudLinked = false,
  onClose,
  onOpenAuth,
}) => {
  const [activeTabId, setActiveTabId] = useState<LegalTabId>(initialTab);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setActiveTabId(initialTab);
    setIsCopied(false);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'ArrowRight') {
        setActiveTabId((prev) => {
          const currentIndex = LEGAL_TABS.findIndex((t) => t.id === prev);
          const nextIndex = Math.min(LEGAL_TABS.length - 1, currentIndex + 1);
          return LEGAL_TABS[nextIndex]?.id ?? prev;
        });
      } else if (event.key === 'ArrowLeft') {
        setActiveTabId((prev) => {
          const currentIndex = LEGAL_TABS.findIndex((t) => t.id === prev);
          const prevIndex = Math.max(0, currentIndex - 1);
          return LEGAL_TABS[prevIndex]?.id ?? prev;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, initialTab, onClose]);

  if (!isOpen) return null;

  const currentTab = LEGAL_TABS.find((t) => t.id === activeTabId) ?? LEGAL_TABS[0];
  const TabIcon = TAB_ICON_MAP[currentTab.id] ?? FileText;

  const handleCopyTemplate = async () => {
    const template = generateFeedbackTemplate({ isCloudLinked });
    const ok = await copyShareTextToClipboard(template);
    if (ok) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  const handleSwitchToAuth = () => {
    onClose();
    onOpenAuth?.();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-[2px] animate-fade-in"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-support-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md max-h-[90vh] flex flex-col bg-[#FAF8F3] rounded-2xl border-2 border-[#C59B27]/80 shadow-2xl overflow-hidden text-stone-900"
      >
        {/* モーダルヘッダー（クラブハウス公式プログラム風） */}
        <div className="bg-linear-to-r from-[#123F2B] via-[#0D3322] to-[#082015] text-[#FAF8F3] px-4 py-3.5 border-b-2 border-[#C59B27]/80 racing-stitch-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#C59B27]/20 border border-[#C59B27]/60 flex items-center justify-center shrink-0">
              <TabIcon className="w-4.5 h-4.5 text-[#E6C762]" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold tracking-widest text-[#E6C762] uppercase font-racing-num">
                OFFICIAL TERMS & SUPPORT
              </div>
              <h2
                id="legal-support-modal-title"
                className="text-base font-bold text-[#FAF8F3] font-racing-serif tracking-wide truncate"
              >
                規約・プライバシー・お問い合わせ
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="モーダルを閉じる"
            className="p-1.5 rounded-lg text-[#C8D8CE] hover:text-[#FAF8F3] hover:bg-white/10 border border-transparent hover:border-[#C59B27]/40 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ゼッケン風タブ切り替えバー（4タブ） */}
        <div
          role="tablist"
          aria-label="規約とサポートの項目選択"
          className="grid grid-cols-4 gap-1.5 px-2.5 py-2 bg-[#F2ECE0] border-b border-[#D8CEBE] shrink-0"
        >
          {LEGAL_TABS.map((tab) => {
            const isSelected = tab.id === currentTab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setActiveTabId(tab.id)}
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
                  {tab.tabNumber}
                </span>
                <span className="text-[10px] font-bold tracking-tight leading-tight truncate w-full">
                  {tab.shortLabel}
                </span>
              </button>
            );
          })}
        </div>

        {/* メインコンテンツ領域（スクロール可能） */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {/* セクション見出しカード */}
          <div className="bg-[#FFFDF9] rounded-xl p-3.5 border border-[#D4C9B5] shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-[#9A7418] font-racing-num">
                <TabIcon className="w-3.5 h-3.5 text-[#9A7418]" />
                <span>{currentTab.subtitle}</span>
              </span>
            </div>
            <h3 className="text-lg font-bold text-[#0D3322] font-racing-serif leading-snug">
              {currentTab.title}
            </h3>
            <p className="text-xs text-stone-700 leading-relaxed">{currentTab.lead}</p>
          </div>

          {/* データ保存タブ専用：現在の連携ステータス＆注意バナー */}
          {currentTab.id === 'storage' && (
            <div
              className={`rounded-xl p-3 border flex items-start gap-2.5 ${
                isCloudLinked
                  ? 'bg-emerald-50/90 border-emerald-300 text-emerald-900'
                  : 'bg-amber-50/90 border-amber-300 text-amber-950'
              }`}
            >
              {isCloudLinked ? (
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="text-xs font-bold">
                  {isCloudLinked
                    ? '現在：クラウド連携済み（自動バックアップ有効）'
                    : '現在：ゲスト利用中（ブラウザ内 LocalStorage のみに保存）'}
                </div>
                <p className="text-[11px] leading-relaxed">
                  {isCloudLinked
                    ? '学習進捗と愛馬データはクラウドに安全に保護されています。機種変更時も同じアカウントでログインするだけで引き継げます。'
                    : 'ブラウザのキャッシュ・履歴消去やシークレットモード利用でデータが消える状態にあります。大切な愛馬を守るためクラウド連携をおすすめします。'}
                </p>
                {onOpenAuth && !isCloudLinked && (
                  <button
                    type="button"
                    onClick={handleSwitchToAuth}
                    className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#0D3322] hover:bg-[#164B33] text-[#FAF8F3] border border-[#C59B27] shadow-2xs transition-colors cursor-pointer"
                  >
                    <Cloud className="w-3.5 h-3.5 text-[#E6C762]" />
                    <span>クラウド連携（Google / X）を開く</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 条項・説明リスト */}
          <div className="space-y-2.5">
            {currentTab.sections.map((sec, idx) => (
              <div
                key={sec.title}
                className="bg-[#FFFDF9] rounded-xl p-3.5 border border-[#DFD6C5] shadow-2xs space-y-2"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`saddle-cloth-badge px-2 py-0.5 text-[10px] font-racing-num shrink-0 ${
                      idx === 0
                        ? 'bg-[#0D3322] text-[#FAF8F3] border border-[#C59B27]'
                        : idx === 1
                          ? 'bg-[#6B3A1E] text-[#FAF8F3] border border-[#C59B27]'
                          : idx === 2
                            ? 'bg-[#5C4312] text-[#FAF8F3] border border-[#C59B27]'
                            : 'bg-stone-700 text-[#FAF8F3] border border-[#C59B27]'
                    }`}
                  >
                    {sec.badge}
                  </span>
                  <h4 className="text-xs font-bold text-stone-900 font-racing-serif">
                    {sec.title}
                  </h4>
                </div>

                <div className="space-y-1.5">
                  {sec.paragraphs.map((p, pIdx) => (
                    <p key={pIdx} className="text-[11px] text-stone-700 leading-relaxed">
                      {p}
                    </p>
                  ))}
                </div>

                {sec.bullets && sec.bullets.length > 0 && (
                  <ul className="list-disc pl-4 space-y-1 pt-0.5">
                    {sec.bullets.map((bullet, bIdx) => (
                      <li key={bIdx} className="text-[11px] text-stone-600 leading-relaxed">
                        {bullet}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          {/* お問い合わせタブ専用：Xリンクボタン＆環境テンプレートコピー */}
          {currentTab.id === 'contact' && (
            <div className="bg-[#FFFDF9] rounded-xl p-3.5 border-2 border-[#C59B27]/70 shadow-xs space-y-2.5">
              <div className="text-xs font-bold text-[#0D3322] font-racing-serif">
                お問い合わせ・フィードバック窓口
              </div>

              <a
                href={OFFICIAL_X_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 active:scale-98 text-[#FAF8F3] text-xs font-bold border border-[#C59B27] shadow-xs transition-all"
              >
                <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <span>開発者 X ({OFFICIAL_X_HANDLE}) を開く</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#E6C762] shrink-0" />
              </a>

              <button
                type="button"
                onClick={handleCopyTemplate}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#F2ECE0] hover:bg-[#E7DFCE] text-stone-800 text-xs font-bold border border-[#C8BFA8] transition-colors cursor-pointer"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span className="text-emerald-800">報告用テンプレートをコピーしました！</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#9A7418] shrink-0" />
                    <span>報告用テンプレート（バージョン情報付）をコピー</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* 補足ノート枠 */}
          <div className="bg-[#FDF6E2] border border-[#C59B27]/65 rounded-xl p-3 flex items-start gap-2">
            <Info className="w-4 h-4 text-[#9A7418] shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#5C3A08] font-medium leading-relaxed">
              {currentTab.note}
            </p>
          </div>
        </div>

        {/* モーダルフッター */}
        <div className="px-4 py-3 bg-[#F2ECE0] border-t border-[#D8CEBE] flex items-center justify-between gap-2 shrink-0">
          <span className="text-[10px] font-bold text-stone-600 font-racing-num">
            TurfTalk Unofficial Racing English App
          </span>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#0D3322] hover:bg-[#164B33] text-[#FAF8F3] border border-[#C59B27] shadow-xs active:scale-98 transition-all cursor-pointer"
          >
            <span>閉じる</span>
          </button>
        </div>
      </div>
    </div>
  );
};
