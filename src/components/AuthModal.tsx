import React, { useState } from 'react';
import { X, ShieldCheck, Cloud, LogOut, Trash2, AlertTriangle } from 'lucide-react';
import type { AppUser } from '../hooks/useAuth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AppUser | null;
  isLoading: boolean;
  authError: string | null;
  onLoginGoogle: () => void;
  onLoginTwitter: () => void;
  onSignOut: () => void;
  onDeleteAccount: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  user,
  isLoading,
  authError,
  onLoginGoogle,
  onLoginTwitter,
  onSignOut,
  onDeleteAccount,
}) => {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  if (!isOpen) return null;

  const isGuest = user?.isAnonymous ?? true;

  const handleStartDelete = () => {
    setIsConfirmingDelete(true);
  };

  const handleCancelDelete = () => {
    setIsConfirmingDelete(false);
  };

  const handleExecuteDelete = () => {
    onDeleteAccount();
    setIsConfirmingDelete(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-[#FAF8F5] border-2 border-[#D4AF37] rounded-xl shadow-2xl p-6 text-[#1A2E1A]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        {/* 閉じるボタン */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-200/50 rounded-full transition-colors cursor-pointer"
          aria-label="閉じる"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ヘッダー */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#1A2E1A]/10 text-[#1A2E1A] mb-3 border border-[#D4AF37]/30">
            <Cloud className="w-6 h-6" />
          </div>
          <h2 id="auth-modal-title" className="text-xl font-bold font-serif tracking-tight text-[#1A2E1A]">
            馬主データ クラウド連携
          </h2>
          <p className="text-xs text-stone-600 mt-1">
            アカウント連携を行うと、機種変更や別端末でも同じ愛馬・進捗で学習を継続できます。
          </p>
        </div>

        {/* エラーメッセージ */}
        {authError && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
            {authError}
          </div>
        )}

        {/* 退会確認画面 */}
        {isConfirmingDelete ? (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-left space-y-3">
            <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>本当に退会（データ全削除）しますか？</span>
            </div>
            <p className="text-xs text-rose-800 leading-relaxed">
              連携中のアカウント情報、現在の愛馬、獲得賞金、殿堂入り履歴を含む<strong>すべてのデータが恒久的に消去され、二度と復元できなくなります</strong>。
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleCancelDelete}
                disabled={isLoading}
                className="flex-1 py-2 px-3 bg-white hover:bg-stone-100 text-stone-700 text-xs font-semibold rounded border border-stone-300 transition-colors cursor-pointer"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                disabled={isLoading}
                className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-semibold rounded transition-colors cursor-pointer"
              >
                退会して全消去
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* 現在のステータス表示 */}
            <div className="mb-6 p-4 bg-white/80 border border-stone-200 rounded-lg flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                  現在の連携状況
                </div>
                <div className="text-sm font-bold mt-0.5 flex items-center gap-1.5">
                  {isGuest ? (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                      <span>ゲストプレイ中（未連携）</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>
                        {user?.providerId === 'google.com' ? 'Google 連携済み' : 'X (Twitter) 連携済み'}
                      </span>
                    </>
                  )}
                </div>
                {user?.email && <div className="text-xs text-stone-500 mt-0.5">{user.email}</div>}
              </div>

              <div className="text-right">
                <div className="text-[10px] text-stone-400 font-mono">UID</div>
                <div className="text-xs font-mono text-stone-600 truncate max-w-[100px]" title={user?.uid}>
                  {user?.uid ? `${user.uid.substring(0, 8)}...` : '---'}
                </div>
              </div>
            </div>

            {/* アクションボタン */}
            <div className="space-y-3">
              {isGuest ? (
                <>
                  {/* Google 連携ボタン */}
                  <button
                    type="button"
                    onClick={onLoginGoogle}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-stone-50 active:bg-stone-100 border border-stone-300 text-stone-700 font-semibold text-sm rounded-lg shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Google アカウントで連携</span>
                  </button>

                  {/* X (Twitter) 連携ボタン */}
                  <button
                    type="button"
                    onClick={onLoginTwitter}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-black hover:bg-neutral-800 active:bg-neutral-900 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    <span>X (Twitter) で連携</span>
                  </button>
                </>
              ) : (
                <>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg text-center">
                    ✓ クラウド連携中です。データは安全にバックアップされています。
                  </div>

                  {/* ログアウトボタン */}
                  <button
                    type="button"
                    onClick={onSignOut}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>ログアウト（別アカウントでログイン）</span>
                  </button>

                  {/* 退会・データ削除ボタン */}
                  <button
                    type="button"
                    onClick={handleStartDelete}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 text-stone-400 hover:text-rose-600 hover:bg-rose-50 text-[11px] rounded transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>アカウント削除・退会</span>
                  </button>
                </>
              )}
            </div>
          </>
        )}

        {/* フッター */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-stone-500 hover:text-stone-800 underline transition-colors cursor-pointer"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
