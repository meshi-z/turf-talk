import { useState, type FC } from 'react';
import { Download, Share, PlusSquare, X, Smartphone, Sparkles, Check } from 'lucide-react';
import { usePwaInstall } from '../lib/pwa';

interface PwaInstallBannerProps {
  className?: string;
}

export const PwaInstallBanner: FC<PwaInstallBannerProps> = ({ className = '' }) => {
  const {
    isBannerVisible,
    canInstall,
    isIosDevice,
    promptInstall,
    dismiss,
  } = usePwaInstall();

  const [isIosModalOpen, setIsIosModalOpen] = useState(false);
  const [isSuccessToast, setIsSuccessToast] = useState(false);

  if (!isBannerVisible) return null;

  const handleInstallClick = async () => {
    if (isIosDevice && !canInstall) {
      setIsIosModalOpen(true);
      return;
    }

    const accepted = await promptInstall();
    if (accepted) {
      setIsSuccessToast(true);
      setTimeout(() => {
        setIsSuccessToast(false);
      }, 3500);
    }
  };

  return (
    <>
      {/* クラシック競馬調 PWA インストール案内バナー */}
      <aside
        aria-label="ホーム画面へのアプリ追加案内"
        className={`bg-linear-to-r from-[#123F2B] via-[#0D3322] to-[#0A2619] text-[#FAF8F3] rounded-xl p-3 sm:p-3.5 border border-[#C59B27]/70 shadow-md racing-stitch-border relative overflow-hidden animate-fade-in ${className}`}
      >
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-start gap-2.5 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-lg bg-[#C59B27]/20 border border-[#C59B27]/60 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
              <Smartphone className="w-5 h-5 text-[#E6C762]" />
            </div>

            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold tracking-widest text-[#E6C762] uppercase font-racing-num">
                  PWA OFFLINE APP
                </span>
                <span className="text-[10px] bg-[#1B5239] text-[#E6C762] px-1.5 py-0.2 rounded-xs border border-[#C59B27]/40 font-semibold">
                  競馬場・地下鉄対応
                </span>
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-[#FAF8F3] font-racing-serif tracking-wide">
                ホーム画面に追加して快適学習
              </h3>
              <p className="text-[11px] text-[#C8D8CE] leading-tight">
                混雑した競馬場や電波の届かないオフライン環境でも、全画面でサクサク開けます。
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={dismiss}
            aria-label="インストール案内を閉じる"
            title="閉じる"
            className="p-1 rounded-md text-[#C8D8CE] hover:text-[#FAF8F3] hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-2.5 pt-2 border-t border-[#C59B27]/30 flex items-center justify-between gap-2">
          <span className="text-[10px] text-[#A6C0B0] font-medium hidden sm:inline">
            ※ 容量をほとんど使わず即座に追加できます
          </span>

          <div className="flex items-center gap-2 ml-auto w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleInstallClick}
              className="inline-flex items-center justify-center gap-1.5 w-full sm:w-auto px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#E6C762] hover:bg-[#D4B44E] text-[#1A1405] border border-[#C59B27] shadow-xs active:scale-98 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#1A1405]" />
              <span>{isIosDevice && !canInstall ? '追加方法を見る' : 'ホーム画面に追加'}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* iOS Safari 向け追加手順モーダル */}
      {isIosModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-[2px] animate-fade-in"
          onClick={() => setIsIosModalOpen(false)}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-pwa-modal-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-[#FAF8F3] rounded-2xl border-2 border-[#C59B27]/80 shadow-2xl overflow-hidden text-stone-900"
          >
            {/* ヘッダー */}
            <div className="bg-linear-to-r from-[#123F2B] via-[#0D3322] to-[#082015] text-[#FAF8F3] px-4 py-3 border-b-2 border-[#C59B27]/80 racing-stitch-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Share className="w-4 h-4 text-[#E6C762]" />
                <h3 id="ios-pwa-modal-title" className="text-sm font-bold font-racing-serif text-[#FAF8F3]">
                  iPhone / iPad での追加手順
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsIosModalOpen(false)}
                aria-label="閉じる"
                className="p-1 rounded-md text-[#C8D8CE] hover:text-[#FAF8F3] hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* コンテンツ */}
            <div className="p-4 space-y-3 text-xs leading-relaxed text-stone-700">
              <p className="text-stone-800 font-medium">
                Safari で開いている場合、以下の 2 ステップで簡単にホーム画面へ追加できます。
              </p>

              <div className="space-y-2">
                <div className="flex items-start gap-2.5 bg-[#FFFDF9] border border-[#D4C9B5] rounded-xl p-2.5">
                  <span className="saddle-cloth-badge w-5 h-5 bg-[#0D3322] text-[#FAF8F3] border border-[#C59B27] text-[10px] shrink-0 font-racing-num">
                    1
                  </span>
                  <div>
                    <div className="font-bold text-stone-900 flex items-center gap-1">
                      <span>Safari 画面下部の共有ボタン</span>
                      <Share className="w-3.5 h-3.5 text-blue-600 inline" />
                      <span>をタップ</span>
                    </div>
                    <p className="text-[11px] text-stone-600 mt-0.5">
                      ブラウザのメニューバー中央にある四角から矢印が出ているアイコンです。
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 bg-[#FFFDF9] border border-[#D4C9B5] rounded-xl p-2.5">
                  <span className="saddle-cloth-badge w-5 h-5 bg-[#0D3322] text-[#FAF8F3] border border-[#C59B27] text-[10px] shrink-0 font-racing-num">
                    2
                  </span>
                  <div>
                    <div className="font-bold text-stone-900 flex items-center gap-1">
                      <span>「ホーム画面に追加」</span>
                      <PlusSquare className="w-3.5 h-3.5 text-stone-700 inline" />
                      <span>を選択</span>
                    </div>
                    <p className="text-[11px] text-stone-600 mt-0.5">
                      メニュー内を少しスクロールし、「ホーム画面に追加」をタップして完了です。
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-[#FDF6E2] border border-[#C59B27]/60 rounded-xl p-2.5 text-[11px] text-[#5C3A08] flex items-start gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#9A7418] shrink-0 mt-0.5" />
                <span>追加後は、電波の繋がりにくい競馬場でもオフラインで素早く起動できます！</span>
              </div>
            </div>

            {/* フッター */}
            <div className="p-3 bg-[#F2ECE0] border-t border-[#D8CEBE] flex justify-end">
              <button
                type="button"
                onClick={() => setIsIosModalOpen(false)}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#0D3322] text-[#FAF8F3] border border-[#C59B27] hover:bg-[#164B33] transition-colors cursor-pointer"
              >
                了解
              </button>
            </div>
          </div>
        </div>
      )}

      {/* インストール成功トースト */}
      {isSuccessToast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-[#0D3322] text-[#FAF8F3] border border-[#C59B27] px-4 py-2 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold animate-fade-in">
          <Check className="w-4 h-4 text-[#E6C762]" />
          <span>ホーム画面に追加リクエストを送信しました！</span>
        </div>
      )}
    </>
  );
};
