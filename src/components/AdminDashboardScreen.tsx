import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  fetchAllUsersForAdmin,
  restoreUserAccountByAdmin,
  type AdminUserSummary,
} from '../lib/adminService.ts';

interface AdminDashboardScreenProps {
  onBackToHome: () => void;
}

type FilterStatus = 'all' | 'active' | 'deleted' | 'linked';
type SortField = 'lastActive' | 'learned' | 'streak' | 'wins';

export const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({ onBackToHome }) => {
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortField, setSortField] = useState<SortField>('lastActive');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [copiedUid, setCopiedUid] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchAllUsersForAdmin();
      setUsers(data);
    } catch (e) {
      console.warn('[AdminDashboard] Failed to load users:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleCopyUid = (uid: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(uid).catch(() => {});
      setCopiedUid(uid);
      setTimeout(() => setCopiedUid(null), 2000);
    }
  };

  const handleRestore = async (uid: string) => {
    const ok = await restoreUserAccountByAdmin(uid);
    if (ok) {
      setActionFeedback(`ユーザー ${uid} のアカウントを正常に復元しました`);
      // ローカル state を更新
      setUsers((prev) =>
        prev.map((u) => (u.uid === uid ? { ...u, isDeleted: false, deletedAt: null } : u))
      );
    } else {
      setActionFeedback(`ユーザー ${uid} の復元に失敗しました`);
    }
    setTimeout(() => setActionFeedback(null), 4000);
  };

  // 統計サマリー計算
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => !u.isDeleted).length;
    const deleted = users.filter((u) => u.isDeleted).length;
    const linked = users.filter((u) => !u.isAnonymous).length;

    const avgProgress =
      total > 0
        ? Math.round(
            (users.reduce((acc, u) => acc + u.progressPercent, 0) / total) * 10
          ) / 10
        : 0;

    const avgStreak =
      total > 0
        ? Math.round((users.reduce((acc, u) => acc + u.streakDays, 0) / total) * 10) / 10
        : 0;

    const totalWins = users.reduce((acc, u) => acc + u.totalRaceWins, 0);

    return { total, active, deleted, linked, avgProgress, avgStreak, totalWins };
  }, [users]);

  // フィルタリング & ソート
  const filteredUsers = useMemo(() => {
    return users
      .filter((u) => {
        // ステータスフィルター
        if (filterStatus === 'active' && u.isDeleted) return false;
        if (filterStatus === 'deleted' && !u.isDeleted) return false;
        if (filterStatus === 'linked' && u.isAnonymous) return false;

        // 検索クエリ
        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase().trim();
          const matchUid = u.uid.toLowerCase().includes(q);
          const matchHorse = u.currentHorseName.toLowerCase().includes(q);
          const matchProvider = u.providerId.toLowerCase().includes(q);
          const matchRoute = u.currentHorseRoute.toLowerCase().includes(q);
          return matchUid || matchHorse || matchProvider || matchRoute;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortField === 'lastActive') {
          return b.rawLastActiveAtMs - a.rawLastActiveAtMs;
        }
        if (sortField === 'learned') {
          return b.learnedCount - a.learnedCount;
        }
        if (sortField === 'streak') {
          return b.streakDays - a.streakDays;
        }
        if (sortField === 'wins') {
          return b.totalRaceWins - a.totalRaceWins;
        }
        return 0;
      });
  }, [users, filterStatus, searchQuery, sortField]);

  return (
    <div className="flex-1 flex flex-col bg-[#FAF8F3] min-h-screen text-stone-900 pb-16">
      {/* 画面ヘッダー */}
      <div className="bg-[#071D13] text-[#FAF8F3] px-4 py-3.5 border-b-2 border-[#C59B27] flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-xl">🛠️</span>
          <div>
            <h2 className="font-bold text-base font-racing-serif tracking-wide text-[#FAF8F3]">
              管理者ダッシュボード
            </h2>
            <p className="text-[11px] text-[#C8D8CE]">ユーザー学習進捗 ＆ 競走馬成績確認</p>
          </div>
        </div>
        <button
          onClick={onBackToHome}
          className="bg-[#0D3322] hover:bg-[#154631] text-[#E6C762] text-xs font-bold px-3 py-1.5 rounded border border-[#C59B27]/60 transition"
        >
          ホームへ戻る
        </button>
      </div>

      <div className="p-4 space-y-4 max-w-4xl mx-auto w-full">
        {/* フィードバック通知 */}
        {actionFeedback && (
          <div className="bg-emerald-100 border border-emerald-400 text-emerald-900 px-3.5 py-2.5 rounded text-xs font-bold shadow-xs">
            {actionFeedback}
          </div>
        )}

        {/* サマリー統計グリッド */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-[#FAF8F3] border border-[#D8CEBE] rounded p-2.5 shadow-xs">
            <span className="text-[10px] text-stone-700 font-bold block">総ユーザー数</span>
            <div className="text-lg font-bold font-racing-num text-[#071D13] mt-0.5">
              {stats.total}{' '}
              <span className="text-[11px] font-normal text-stone-700">人</span>
            </div>
            <span className="text-[10px] text-stone-600">
              アクティブ {stats.active} / 退会 {stats.deleted}
            </span>
          </div>

          <div className="bg-[#FAF8F3] border border-[#D8CEBE] rounded p-2.5 shadow-xs">
            <span className="text-[10px] text-stone-700 font-bold block">平均問題消化率</span>
            <div className="text-lg font-bold font-racing-num text-[#071D13] mt-0.5">
              {stats.avgProgress}%
            </div>
            <span className="text-[10px] text-stone-600">全120問マスター基準</span>
          </div>

          <div className="bg-[#FAF8F3] border border-[#D8CEBE] rounded p-2.5 shadow-xs">
            <span className="text-[10px] text-stone-700 font-bold block">平均継続ストリーク</span>
            <div className="text-lg font-bold font-racing-num text-[#071D13] mt-0.5">
              {stats.avgStreak}{' '}
              <span className="text-[11px] font-normal text-stone-700">日</span>
            </div>
            <span className="text-[10px] text-stone-600">習慣化スコア</span>
          </div>

          <div className="bg-[#FAF8F3] border border-[#D8CEBE] rounded p-2.5 shadow-xs">
            <span className="text-[10px] text-stone-700 font-bold block">通算レース総勝利数</span>
            <div className="text-lg font-bold font-racing-num text-[#C59B27] mt-0.5">
              {stats.totalWins}{' '}
              <span className="text-[11px] font-normal text-stone-700">勝</span>
            </div>
            <span className="text-[10px] text-stone-600">SSO連携率 {stats.total > 0 ? Math.round((stats.linked / stats.total) * 100) : 0}%</span>
          </div>
        </div>

        {/* コントロールバー（検索・フィルター・ソート・リロード） */}
        <div className="bg-white border border-[#D8CEBE] rounded-lg p-3 space-y-3 shadow-xs">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="UID・愛馬名・プロバイダー・路線で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-[#FAF8F3] border border-[#D8CEBE] rounded px-3 py-1.5 text-xs focus:outline-hidden focus:border-[#0D3322]"
            />
            <button
              onClick={() => void loadData()}
              disabled={isLoading}
              className="bg-[#0D3322] hover:bg-[#154631] text-[#FAF8F3] text-xs font-bold px-3 py-1.5 rounded transition disabled:opacity-50 whitespace-nowrap"
            >
              {isLoading ? '読込中...' : '🔄 最新取得'}
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#ECE6D8] text-xs">
            {/* ステータスフィルター */}
            <div className="flex items-center gap-1">
              <span className="text-stone-700 text-[11px] font-bold mr-1">状態:</span>
              {(['all', 'active', 'linked', 'deleted'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                    filterStatus === st
                      ? 'bg-[#071D13] text-[#E6C762]'
                      : 'bg-[#FAF8F3] text-stone-600 border border-[#D8CEBE] hover:bg-stone-100'
                  }`}
                >
                  {st === 'all' && 'すべて'}
                  {st === 'active' && 'アクティブ'}
                  {st === 'linked' && 'SSO連携済'}
                  {st === 'deleted' && '退会済'}
                </button>
              ))}
            </div>

            {/* ソート順 */}
            <div className="flex items-center gap-1">
              <span className="text-stone-700 text-[11px] font-bold mr-1">並び順:</span>
              {(['lastActive', 'learned', 'streak', 'wins'] as const).map((sf) => (
                <button
                  key={sf}
                  onClick={() => setSortField(sf)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                    sortField === sf
                      ? 'bg-[#071D13] text-[#E6C762]'
                      : 'bg-[#FAF8F3] text-stone-600 border border-[#D8CEBE] hover:bg-stone-100'
                  }`}
                >
                  {sf === 'lastActive' && '最終アクセス'}
                  {sf === 'learned' && '消化数'}
                  {sf === 'streak' && 'ストリーク'}
                  {sf === 'wins' && '通算勝利数'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ユーザー一覧リスト */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs text-stone-700 font-bold px-1">
            <span>該当ユーザー: {filteredUsers.length} 件</span>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="bg-white border border-[#D8CEBE] rounded p-8 text-center text-stone-700 text-xs">
              該当するユーザーは見つかりませんでした。
            </div>
          ) : (
            filteredUsers.map((u) => {
              const providerBadge =
                u.providerId === 'google.com'
                  ? { text: 'Google', bg: 'bg-red-50 text-red-700 border-red-200' }
                  : u.providerId === 'twitter.com'
                  ? { text: 'X (Twitter)', bg: 'bg-stone-100 text-stone-800 border-stone-300' }
                  : { text: 'ゲスト', bg: 'bg-amber-50 text-amber-800 border-amber-200' };

              return (
                <div
                  key={u.uid}
                  className={`bg-white border rounded-lg p-3.5 shadow-xs transition ${
                    u.isDeleted
                      ? 'border-red-200 bg-red-50/20 opacity-80'
                      : 'border-[#D8CEBE] hover:border-[#0D3322]'
                  }`}
                >
                  {/* 上部ヘッダー（UID・プロバイダー・退会ステータス） */}
                  <div className="flex flex-wrap items-center justify-between gap-1.5 pb-2 border-b border-[#ECE6D8]">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-[11px] font-bold text-stone-800 bg-[#FAF8F3] px-1.5 py-0.5 rounded border border-[#D8CEBE]">
                        {u.uid.length > 20 ? `${u.uid.slice(0, 8)}...${u.uid.slice(-6)}` : u.uid}
                      </span>
                      <button
                        onClick={() => handleCopyUid(u.uid)}
                        title="UIDをコピー"
                        className="text-[10px] text-stone-700 hover:text-stone-900 border border-[#D8CEBE] rounded px-1.5 py-0.5 bg-white transition"
                      >
                        {copiedUid === u.uid ? '✓ コピー済' : '📋 コピー'}
                      </button>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${providerBadge.bg}`}
                      >
                        {providerBadge.text}
                      </span>
                      {u.isDeleted && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded border bg-red-100 text-red-800 border-red-300">
                          退会済 ({u.deletedAt ?? '日時不明'})
                        </span>
                      )}
                    </div>

                    <div className="text-[10px] text-stone-700 font-mono">
                      最終アクセス: {u.lastActiveAtText}
                    </div>
                  </div>

                  {/* メイン情報グリッド（競走馬 ＆ 学習実績） */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2.5 text-xs">
                    {/* 愛馬ステータス */}
                    <div className="bg-[#FAF8F3] border border-[#ECE6D8] rounded p-2.5">
                      <div className="text-[10px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                        🏇 愛馬ステータス
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm font-racing-serif text-[#071D13]">
                          {u.currentHorseName}
                        </span>
                        <span className="text-[11px] font-bold font-racing-num bg-[#071D13] text-[#E6C762] px-2 py-0.5 rounded border border-[#C59B27]/40">
                          Week {u.currentHorseWeek} / 4
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-stone-600">
                        <span>路線: <strong className="text-stone-800">{u.currentHorseRoute}</strong></span>
                        <span>通算: <strong className="text-stone-800 font-racing-num">{u.totalRaceWins}</strong> 勝</span>
                        <span>殿堂: <strong className="text-stone-800 font-racing-num">{u.totalHallOfFameCount}</strong> 頭</span>
                      </div>
                    </div>

                    {/* 学習進捗ステータス */}
                    <div className="bg-[#FAF8F3] border border-[#ECE6D8] rounded p-2.5">
                      <div className="text-[10px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                        📖 学習進捗・習慣化
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm font-racing-num text-[#071D13]">
                          {u.learnedCount} / 120 問 ({u.progressPercent}%)
                        </span>
                        <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          🔥 {u.streakDays} 日連続
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1.5 text-[11px] text-stone-600">
                        <span>所持にんじん: <strong className="text-stone-800">🥕 {u.carrotCount} / 3</strong></span>
                        <span>登録日: <span className="font-mono text-stone-700">{u.createdAtText}</span></span>
                      </div>
                    </div>
                  </div>

                  {/* 管理者操作エリア */}
                  {u.isDeleted && (
                    <div className="mt-2.5 pt-2 border-t border-red-100 flex items-center justify-between">
                      <span className="text-[11px] text-red-700">
                        ※ 退会手続き済みユーザーです（誤操作時のデータ復旧が可能です）
                      </span>
                      <button
                        onClick={() => handleRestore(u.uid)}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3 py-1 rounded transition shadow-xs"
                      >
                        アカウントを復元する
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
