import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  calculateAdminInsights,
  fetchAllCloudPhrasesForAdmin,
  fetchAllUsersForAdmin,
  getRouteLabel,
  restoreUserAccountByAdmin,
  saveCloudPhraseByAdmin,
  toggleCloudPhrasePublishByAdmin,
  type AdminCloudPhrase,
  type AdminUserSummary,
} from '../lib/adminService.ts';
import {
  INITIAL_PHRASES,
  type PhraseCategory,
  type PhraseItem,
  type PhraseLevel,
  type PhraseType,
} from '../data/phrases.ts';

interface AdminDashboardScreenProps {
  onBackToHome: () => void;
  totalMasterPhrases?: number;
  onPhrasesUpdated?: () => void;
}

type AdminTab = 'analytics' | 'users' | 'phrases';
type FilterStatus = 'all' | 'active' | 'deleted' | 'linked';
type SortField = 'lastActive' | 'learned' | 'streak' | 'wins';

const CATEGORY_LABELS: Record<PhraseCategory, string> = {
  feel: '手応え・感触 (feel)',
  tactics: '位置取り・戦術 (tactics)',
  reaction: '勝負どころの反応 (reaction)',
  comment: '陣営コメント・評価 (comment)',
};

export const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({
  onBackToHome,
  totalMasterPhrases = INITIAL_PHRASES.length,
  onPhrasesUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('analytics');
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [cloudPhrases, setCloudPhrases] = useState<AdminCloudPhrase[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortField, setSortField] = useState<SortField>('lastActive');
  const [actionFeedback, setActionFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [copiedUid, setCopiedUid] = useState<string | null>(null);

  // フレーズ追加・編集フォーム状態
  const [phraseId, setPhraseId] = useState<string>(() => `phrase-cloud-${Date.now().toString().slice(-4)}`);
  const [category, setCategory] = useState<PhraseCategory>('feel');
  const [level, setLevel] = useState<PhraseLevel>('beginner');
  const [phraseType, setPhraseType] = useState<PhraseType>('phrase');
  const [situation, setSituation] = useState<string>('');
  const [phraseText, setPhraseText] = useState<string>('');
  const [literalTranslation, setLiteralTranslation] = useState<string>('');
  const [explanation, setExplanation] = useState<string>('');
  const [optionTexts, setOptionTexts] = useState<[string, string, string, string]>(['', '', '', '']);
  const [correctIndex, setCorrectIndex] = useState<number>(0);
  const [isPublishedForm, setIsPublishedForm] = useState<boolean>(true);
  const [isSavingPhrase, setIsSavingPhrase] = useState<boolean>(false);

  const showFeedback = (message: string, type: 'success' | 'error' = 'success') => {
    setActionFeedback({ type, message });
    setTimeout(() => setActionFeedback(null), 4500);
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [userData, phraseData] = await Promise.all([
        fetchAllUsersForAdmin(),
        fetchAllCloudPhrasesForAdmin(),
      ]);
      setUsers(userData);
      setCloudPhrases(phraseData);
    } catch (e) {
      console.warn('[AdminDashboard] Failed to load dashboard data:', e);
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
      showFeedback(`ユーザー ${uid} のアカウントを正常に復元しました`, 'success');
      setUsers((prev) =>
        prev.map((u) => (u.uid === uid ? { ...u, isDeleted: false, deletedAt: null } : u))
      );
    } else {
      showFeedback(`ユーザー ${uid} の復元に失敗しました`, 'error');
    }
  };

  const resetPhraseForm = () => {
    setPhraseId(`phrase-cloud-${Date.now().toString().slice(-4)}`);
    setCategory('feel');
    setLevel('beginner');
    setPhraseType('phrase');
    setSituation('');
    setPhraseText('');
    setLiteralTranslation('');
    setExplanation('');
    setOptionTexts(['', '', '', '']);
    setCorrectIndex(0);
    setIsPublishedForm(true);
  };

  const handleEditCloudPhrase = (item: AdminCloudPhrase) => {
    setPhraseId(item.id);
    setCategory(item.category);
    setLevel(item.level);
    setPhraseType(item.type ?? 'phrase');
    setSituation(item.situation);
    setPhraseText(item.phrase);
    setLiteralTranslation(item.literalTranslation ?? '');
    setExplanation(item.explanation);
    const texts: [string, string, string, string] = [
      item.options[0]?.text ?? '',
      item.options[1]?.text ?? '',
      item.options[2]?.text ?? '',
      item.options[3]?.text ?? '',
    ];
    setOptionTexts(texts);
    const foundIdx = item.options.findIndex((o) => o.isCorrect);
    setCorrectIndex(foundIdx >= 0 ? foundIdx : 0);
    setIsPublishedForm(item.isPublished);
  };

  const handleSavePhrase = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPhrase(true);
    try {
      const candidate: PhraseItem = {
        id: phraseId.trim(),
        situation: situation.trim(),
        phrase: phraseText.trim(),
        literalTranslation: literalTranslation.trim() || undefined,
        explanation: explanation.trim(),
        category,
        level,
        type: phraseType,
        options: optionTexts.map((txt, idx) => ({
          id: `opt-${idx + 1}`,
          text: txt.trim(),
          isCorrect: idx === correctIndex,
        })),
      };

      const result = await saveCloudPhraseByAdmin(candidate, isPublishedForm);
      if (result.ok) {
        showFeedback(`フレーズ「${candidate.id}」を保存・配信反映しました`, 'success');
        const updatedPhrases = await fetchAllCloudPhrasesForAdmin();
        setCloudPhrases(updatedPhrases);
        onPhrasesUpdated?.();
        resetPhraseForm();
      } else {
        showFeedback(result.error ?? 'フレーズの保存に失敗しました', 'error');
      }
    } finally {
      setIsSavingPhrase(false);
    }
  };

  const handleTogglePhrasePublish = async (item: AdminCloudPhrase) => {
    const nextState = !item.isPublished;
    const ok = await toggleCloudPhrasePublishByAdmin(item.id, nextState);
    if (ok) {
      showFeedback(
        `フレーズ「${item.id}」を${nextState ? '公開' : '非公開'}に変更しました`,
        'success'
      );
      setCloudPhrases((prev) =>
        prev.map((p) => (p.id === item.id ? { ...p, isPublished: nextState } : p))
      );
      onPhrasesUpdated?.();
    } else {
      showFeedback('公開ステータスの変更に失敗しました', 'error');
    }
  };

  // インサイト集計
  const insights = useMemo(
    () => calculateAdminInsights(users, totalMasterPhrases),
    [users, totalMasterPhrases]
  );

  // フィルタリング & ソート
  const filteredUsers = useMemo(() => {
    return users
      .filter((u) => {
        if (filterStatus === 'active' && u.isDeleted) return false;
        if (filterStatus === 'deleted' && !u.isDeleted) return false;
        if (filterStatus === 'linked' && u.isAnonymous) return false;

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
            <p className="text-[11px] text-[#C8D8CE]">
              分析インサイト・ユーザー管理・フレーズ動的配信
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void loadData()}
            disabled={isLoading}
            className="bg-[#164631] hover:bg-[#1E5C41] text-[#FAF8F3] text-xs font-bold px-2.5 py-1.5 rounded border border-[#C59B27]/40 transition disabled:opacity-50"
          >
            {isLoading ? '読込中...' : '🔄 更新'}
          </button>
          <button
            type="button"
            onClick={onBackToHome}
            className="bg-[#0D3322] hover:bg-[#154631] text-[#E6C762] text-xs font-bold px-3 py-1.5 rounded border border-[#C59B27]/60 transition"
          >
            ホームへ戻る
          </button>
        </div>
      </div>

      {/* タブナビゲーション */}
      <div className="bg-[#0D3322] px-4 pt-2 border-b border-[#C59B27]/50 flex gap-1.5 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('analytics')}
          className={`px-3.5 py-2 rounded-t-md text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'analytics'
              ? 'bg-[#FAF8F3] text-[#071D13] border-t-2 border-x border-[#C59B27]'
              : 'text-[#C8D8CE] hover:text-white hover:bg-[#164631]/60'
          }`}
        >
          📊 分析・インサイト
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`px-3.5 py-2 rounded-t-md text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'users'
              ? 'bg-[#FAF8F3] text-[#071D13] border-t-2 border-x border-[#C59B27]'
              : 'text-[#C8D8CE] hover:text-white hover:bg-[#164631]/60'
          }`}
        >
          👥 ユーザー管理 ({insights.totalUsers})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('phrases')}
          className={`px-3.5 py-2 rounded-t-md text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'phrases'
              ? 'bg-[#FAF8F3] text-[#071D13] border-t-2 border-x border-[#C59B27]'
              : 'text-[#C8D8CE] hover:text-white hover:bg-[#164631]/60'
          }`}
        >
          📝 フレーズ配信 ({cloudPhrases.length})
        </button>
      </div>

      <div className="p-4 space-y-4 max-w-4xl mx-auto w-full">
        {/* フィードバック通知 */}
        {actionFeedback && (
          <div
            className={`px-3.5 py-2.5 rounded text-xs font-bold shadow-xs border ${
              actionFeedback.type === 'success'
                ? 'bg-emerald-100 border-emerald-400 text-emerald-900'
                : 'bg-red-100 border-red-400 text-red-900'
            }`}
          >
            {actionFeedback.message}
          </div>
        )}

        {/* 共通KPIサマリーグリッド */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-white border border-[#D8CEBE] rounded p-2.5 shadow-xs">
            <span className="text-[10px] text-stone-700 font-bold block">総ユーザー数</span>
            <div className="text-lg font-bold font-racing-num text-[#071D13] mt-0.5">
              {insights.totalUsers}{' '}
              <span className="text-[11px] font-normal text-stone-700">人</span>
            </div>
            <span className="text-[10px] text-stone-600">
              アクティブ {insights.activeUsers} / 退会 {insights.deletedUsers}
            </span>
          </div>

          <div className="bg-white border border-[#D8CEBE] rounded p-2.5 shadow-xs">
            <span className="text-[10px] text-stone-700 font-bold block">平均問題消化率</span>
            <div className="text-lg font-bold font-racing-num text-[#071D13] mt-0.5">
              {insights.avgProgressPercent}%
            </div>
            <span className="text-[10px] text-stone-600">
              全{totalMasterPhrases}問マスター基準
            </span>
          </div>

          <div className="bg-white border border-[#D8CEBE] rounded p-2.5 shadow-xs">
            <span className="text-[10px] text-stone-700 font-bold block">平均継続ストリーク</span>
            <div className="text-lg font-bold font-racing-num text-[#071D13] mt-0.5">
              {insights.avgStreakDays}{' '}
              <span className="text-[11px] font-normal text-stone-700">日</span>
            </div>
            <span className="text-[10px] text-stone-600">
              SSO連携率 {insights.ssoLinkRatePercent}%
            </span>
          </div>

          <div className="bg-white border border-[#D8CEBE] rounded p-2.5 shadow-xs">
            <span className="text-[10px] text-stone-700 font-bold block">通算レース総勝利数</span>
            <div className="text-lg font-bold font-racing-num text-[#C59B27] mt-0.5">
              {insights.totalRaceWins}{' '}
              <span className="text-[11px] font-normal text-stone-700">勝</span>
            </div>
            <span className="text-[10px] text-stone-600">
              殿堂入り累計 {insights.totalHallOfFameHorses} 頭
            </span>
          </div>
        </div>

        {/* ============================================================
            TAB 1: 📊 分析・インサイト
           ============================================================ */}
        {activeTab === 'analytics' && (
          <div className="space-y-4">
            {/* コンテンツ枯渇監視アラートカード */}
            <div
              className={`border rounded-lg p-3.5 shadow-xs ${
                insights.needsNewContentPack
                  ? 'bg-amber-50 border-amber-400 text-amber-950'
                  : 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <span>{insights.needsNewContentPack ? '⚠️' : '✅'}</span>
                    <span>
                      コンテンツ枯渇モニター（新問題投入基準: 枯渇率 15.0% 以上）
                    </span>
                  </div>
                  <p className="text-[11px] mt-1 leading-relaxed">
                    未消化フレーズが残り10問以下のユーザー:{' '}
                    <strong className="font-racing-num text-sm">
                      {insights.depletedUserCount}
                    </strong>{' '}
                    名 / アクティブ {insights.activeUsers} 名（枯渇率:{' '}
                    <strong className="font-racing-num text-sm">
                      {insights.depletionRatePercent}%
                    </strong>
                    ・全問制覇: {insights.completedAllUserCount} 名）
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('phrases')}
                  className="bg-[#071D13] hover:bg-[#0D3322] text-[#E6C762] text-xs font-bold px-3 py-1.5 rounded border border-[#C59B27]/60 transition shrink-0"
                >
                  📝 新フレーズを配信する
                </button>
              </div>
            </div>

            {/* 問題消化率ヒストグラム */}
            <div className="bg-white border border-[#D8CEBE] rounded-lg p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#071D13]">
                  📈 問題消化率の分布（ヒストグラム）
                </h3>
                <span className="text-[10px] text-stone-600">
                  全 {insights.totalUsers} ユーザー
                </span>
              </div>
              <div className="space-y-2">
                {insights.progressDistribution.map((bucket) => (
                  <div key={bucket.id} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-medium text-stone-800">{bucket.label}</span>
                      <span className="font-mono text-stone-700">
                        {bucket.count}人 ({bucket.percent}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-[#ECE6D8] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-linear-to-r from-[#0D3322] to-[#C59B27] rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(bucket.count > 0 ? 4 : 0, bucket.percent)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2カラム：選択路線の人気分布 ＆ キャリア週分布 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* 選択路線の人気分布 */}
              <div className="bg-white border border-[#D8CEBE] rounded-lg p-4 shadow-xs space-y-3">
                <h3 className="text-xs font-bold text-[#071D13]">
                  🏇 選択ローテーション（路線）人気分布
                </h3>
                <div className="space-y-2">
                  {insights.routeDistribution.map((item) => (
                    <div key={item.id} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-medium text-stone-800">{item.label}</span>
                        <span className="font-mono text-stone-700">
                          {item.count}頭 ({item.percent}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-[#ECE6D8] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#164631] rounded-full"
                          style={{ width: `${Math.max(item.count > 0 ? 4 : 0, item.percent)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* キャリア週（Week 1〜4）＆ 殿堂入り達成状況 */}
              <div className="bg-white border border-[#D8CEBE] rounded-lg p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#071D13]">
                    🗓️ キャリア進行週（Week 1〜4）内訳
                  </h3>
                  <span className="text-[10px] font-bold text-[#071D13] bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                    殿堂輩出率 {insights.hallOfFameUserRatePercent}%
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {insights.weekDistribution.map((w) => (
                    <div
                      key={w.id}
                      className="bg-[#FAF8F3] border border-[#ECE6D8] rounded p-2.5 flex items-center justify-between"
                    >
                      <span className="text-xs font-bold text-[#071D13] font-racing-num">
                        {w.label}
                      </span>
                      <div className="text-right">
                        <div className="text-xs font-bold font-racing-num text-stone-900">
                          {w.count} 人
                        </div>
                        <div className="text-[10px] text-stone-600">{w.percent}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 2カラム：継続ストリーク分布 ＆ 認証プロバイダ内訳 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* 継続ストリーク分布 */}
              <div className="bg-white border border-[#D8CEBE] rounded-lg p-4 shadow-xs space-y-3">
                <h3 className="text-xs font-bold text-[#071D13]">
                  🔥 継続ストリーク（リテンション）分布
                </h3>
                <div className="space-y-2">
                  {insights.streakDistribution.map((st) => (
                    <div key={st.id} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-medium text-stone-800">{st.label}</span>
                        <span className="font-mono text-stone-700">
                          {st.count}人 ({st.percent}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-[#ECE6D8] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-600 rounded-full"
                          style={{ width: `${Math.max(st.count > 0 ? 4 : 0, st.percent)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 認証プロバイダ内訳 */}
              <div className="bg-white border border-[#D8CEBE] rounded-lg p-4 shadow-xs space-y-3">
                <h3 className="text-xs font-bold text-[#071D13]">
                  🔐 アカウント連携プロバイダ内訳
                </h3>
                <div className="space-y-2">
                  {insights.providerDistribution.map((prov) => (
                    <div key={prov.id} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-medium text-stone-800">{prov.label}</span>
                        <span className="font-mono text-stone-700">
                          {prov.count}人 ({prov.percent}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-[#ECE6D8] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#071D13] rounded-full"
                          style={{ width: `${Math.max(prov.count > 0 ? 4 : 0, prov.percent)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            TAB 2: 👥 ユーザー管理・退会アカウント復元
           ============================================================ */}
        {activeTab === 'users' && (
          <div className="space-y-3">
            {/* コントロールバー（検索・フィルター・ソート） */}
            <div className="bg-white border border-[#D8CEBE] rounded-lg p-3 space-y-3 shadow-xs">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="UID・愛馬名・プロバイダー・路線で検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-[#FAF8F3] border border-[#D8CEBE] rounded px-3 py-1.5 text-xs focus:outline-hidden focus:border-[#0D3322]"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#ECE6D8] text-xs">
                {/* ステータスフィルター */}
                <div className="flex items-center gap-1">
                  <span className="text-stone-700 text-[11px] font-bold mr-1">状態:</span>
                  {(['all', 'active', 'linked', 'deleted'] as const).map((st) => (
                    <button
                      type="button"
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
                      type="button"
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
                      <div className="flex flex-wrap items-center justify-between gap-1.5 pb-2 border-b border-[#ECE6D8]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-[11px] font-bold text-stone-800 bg-[#FAF8F3] px-1.5 py-0.5 rounded border border-[#D8CEBE]">
                            {u.uid.length > 20
                              ? `${u.uid.slice(0, 8)}...${u.uid.slice(-6)}`
                              : u.uid}
                          </span>
                          <button
                            type="button"
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
                            <span>
                              路線:{' '}
                              <strong className="text-stone-800">
                                {getRouteLabel(u.currentHorseRoute)}
                              </strong>
                            </span>
                            <span>
                              通算:{' '}
                              <strong className="text-stone-800 font-racing-num">
                                {u.totalRaceWins}
                              </strong>{' '}
                              勝
                            </span>
                            <span>
                              殿堂:{' '}
                              <strong className="text-stone-800 font-racing-num">
                                {u.totalHallOfFameCount}
                              </strong>{' '}
                              頭
                            </span>
                          </div>
                        </div>

                        {/* 学習進捗ステータス */}
                        <div className="bg-[#FAF8F3] border border-[#ECE6D8] rounded p-2.5">
                          <div className="text-[10px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                            📖 学習進捗・習慣化
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm font-racing-num text-[#071D13]">
                              {u.learnedCount} / {totalMasterPhrases} 問 ({u.progressPercent}%)
                            </span>
                            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              🔥 {u.streakDays} 日連続
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-1.5 text-[11px] text-stone-600">
                            <span>
                              所持にんじん:{' '}
                              <strong className="text-stone-800">🥕 {u.carrotCount} / 3</strong>
                            </span>
                            <span>
                              登録日:{' '}
                              <span className="font-mono text-stone-700">{u.createdAtText}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {u.isDeleted && (
                        <div className="mt-2.5 pt-2 border-t border-red-100 flex items-center justify-between">
                          <span className="text-[11px] text-red-700">
                            ※ 退会手続き済みユーザーです（誤操作時のデータ復旧が可能です）
                          </span>
                          <button
                            type="button"
                            onClick={() => void handleRestore(u.uid)}
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
        )}

        {/* ============================================================
            TAB 3: 📝 フレーズ動的配信管理
           ============================================================ */}
        {activeTab === 'phrases' && (
          <div className="space-y-4">
            <div className="bg-white border border-[#D8CEBE] rounded-lg p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-[#ECE6D8] pb-2">
                <div>
                  <h3 className="text-xs font-bold text-[#071D13]">
                    ➕ クラウド配信フレーズの追加・上書き編集
                  </h3>
                  <p className="text-[11px] text-stone-600 mt-0.5">
                    Firestore の <code className="font-mono">phrases</code> コレクションへ登録し、アプリの再ビルドなしで全ユーザーへ即時配信します。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resetPhraseForm}
                  className="text-[11px] text-stone-700 hover:text-stone-900 border border-[#D8CEBE] rounded px-2.5 py-1 bg-[#FAF8F3]"
                >
                  フォームをクリア
                </button>
              </div>

              <form onSubmit={handleSavePhrase} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      フレーズ ID
                    </label>
                    <input
                      type="text"
                      required
                      value={phraseId}
                      onChange={(e) => setPhraseId(e.target.value)}
                      placeholder="phrase-121"
                      className="w-full bg-[#FAF8F3] border border-[#D8CEBE] rounded px-2.5 py-1.5 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      カテゴリ
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as PhraseCategory)}
                      className="w-full bg-[#FAF8F3] border border-[#D8CEBE] rounded px-2.5 py-1.5 text-xs"
                    >
                      {(Object.keys(CATEGORY_LABELS) as PhraseCategory[]).map((cat) => (
                        <option key={cat} value={cat}>
                          {CATEGORY_LABELS[cat]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      コース難易度
                    </label>
                    <select
                      value={level}
                      onChange={(e) => setLevel(e.target.value as PhraseLevel)}
                      className="w-full bg-[#FAF8F3] border border-[#D8CEBE] rounded px-2.5 py-1.5 text-xs"
                    >
                      <option value="beginner">beginner（坂路・基礎）</option>
                      <option value="intermediate">intermediate（ウッド・実戦）</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      出題タイプ
                    </label>
                    <select
                      value={phraseType}
                      onChange={(e) => setPhraseType(e.target.value as PhraseType)}
                      className="w-full bg-[#FAF8F3] border border-[#D8CEBE] rounded px-2.5 py-1.5 text-xs"
                    >
                      <option value="phrase">phrase（フレーズ・慣用句）</option>
                      <option value="vocabulary">vocabulary（専門ボキャブラリー）</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      出題シチュエーション
                    </label>
                    <input
                      type="text"
                      required
                      value={situation}
                      onChange={(e) => setSituation(e.target.value)}
                      placeholder="例: レース後の騎手インタビュー（直線の脚色を振り返って）"
                      className="w-full bg-[#FAF8F3] border border-[#D8CEBE] rounded px-2.5 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      直訳ヒント（任意）
                    </label>
                    <input
                      type="text"
                      value={literalTranslation}
                      onChange={(e) => setLiteralTranslation(e.target.value)}
                      placeholder="例: 小銭を落とすように一瞬で加速した"
                      className="w-full bg-[#FAF8F3] border border-[#D8CEBE] rounded px-2.5 py-1.5 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    英語フレーズ / ボキャブラリー（必須・公式メディアや実在の現場表現に準拠）
                  </label>
                  <input
                    type="text"
                    required
                    value={phraseText}
                    onChange={(e) => setPhraseText(e.target.value)}
                    placeholder="例: He quickened up smartly when I asked him for an effort."
                    className="w-full bg-[#FAF8F3] border border-[#D8CEBE] rounded px-2.5 py-1.5 text-xs font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-stone-700">
                    4択の選択肢（ラジオボタンで正解を1つ選択）
                  </label>
                  {optionTexts.map((txt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <label className="flex items-center gap-1 text-[11px] font-bold text-[#071D13] shrink-0 cursor-pointer">
                        <input
                          type="radio"
                          name="correctOption"
                          checked={correctIndex === idx}
                          onChange={() => setCorrectIndex(idx)}
                        />
                        <span>選択肢 {idx + 1}</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={txt}
                        onChange={(e) => {
                          const next: [string, string, string, string] = [...optionTexts] as [
                            string,
                            string,
                            string,
                            string,
                          ];
                          next[idx] = e.target.value;
                          setOptionTexts(next);
                        }}
                        placeholder={
                          idx === correctIndex
                            ? '正解の日本語訳を入力...'
                            : 'ダミー選択肢の日本語訳を入力...'
                        }
                        className={`flex-1 border rounded px-2.5 py-1 text-xs ${
                          correctIndex === idx
                            ? 'bg-emerald-50/60 border-emerald-400 font-bold'
                            : 'bg-[#FAF8F3] border-[#D8CEBE]'
                        }`}
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    ワンポイント解説
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                    placeholder="競馬ファンが直感的に納得できる背景・ニュアンス解説を記述..."
                    className="w-full bg-[#FAF8F3] border border-[#D8CEBE] rounded px-2.5 py-1.5 text-xs"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#ECE6D8]">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-stone-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPublishedForm}
                      onChange={(e) => setIsPublishedForm(e.target.checked)}
                    />
                    <span>保存と同時に公開配信する（isPublished = true）</span>
                  </label>
                  <button
                    type="submit"
                    disabled={isSavingPhrase}
                    className="bg-[#071D13] hover:bg-[#0D3322] text-[#E6C762] text-xs font-bold px-4 py-2 rounded border border-[#C59B27]/80 transition disabled:opacity-50"
                  >
                    {isSavingPhrase ? '保存中...' : '💾 フレーズを保存・配信反映'}
                  </button>
                </div>
              </form>
            </div>

            {/* 登録済みクラウド配信フレーズ一覧 */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs text-stone-700 font-bold px-1">
                <span>クラウド登録済みフレーズ一覧: {cloudPhrases.length} 件</span>
                <span className="text-[11px] font-normal text-stone-600">
                  静的マスター ({INITIAL_PHRASES.length} 問) と自動マージされます
                </span>
              </div>

              {cloudPhrases.length === 0 ? (
                <div className="bg-white border border-[#D8CEBE] rounded p-6 text-center text-stone-700 text-xs">
                  現在クラウド追加分のフレーズはありません（上のフォームから新規フレーズや既存IDの改訂版を登録できます）。
                </div>
              ) : (
                cloudPhrases.map((cp) => (
                  <div
                    key={cp.id}
                    className={`bg-white border rounded-lg p-3.5 shadow-xs space-y-2 ${
                      cp.isPublished
                        ? 'border-[#D8CEBE]'
                        : 'border-stone-300 bg-stone-100/60 opacity-80'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#ECE6D8] pb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-[11px] font-bold bg-[#FAF8F3] px-2 py-0.5 rounded border border-[#D8CEBE]">
                          {cp.id}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#071D13] text-[#E6C762]">
                          {CATEGORY_LABELS[cp.category]}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-800 border border-stone-300">
                          {cp.level}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            cp.isPublished
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                              : 'bg-stone-200 text-stone-700 border-stone-400'
                          }`}
                        >
                          {cp.isPublished ? '公開配信中' : '非公開（下書き）'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleEditCloudPhrase(cp)}
                          className="text-[11px] font-bold text-[#071D13] bg-[#FAF8F3] hover:bg-stone-200 border border-[#D8CEBE] px-2.5 py-1 rounded transition"
                        >
                          ✏️ 編集
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleTogglePhrasePublish(cp)}
                          className="text-[11px] font-bold text-stone-800 bg-white hover:bg-stone-100 border border-[#D8CEBE] px-2.5 py-1 rounded transition"
                        >
                          {cp.isPublished ? '非公開にする' : '公開する'}
                        </button>
                      </div>
                    </div>

                    <div className="text-xs">
                      <div className="text-[11px] text-stone-600">{cp.situation}</div>
                      <div className="font-bold text-sm text-[#071D13] mt-0.5">{cp.phrase}</div>
                      <div className="text-[11px] text-emerald-800 font-bold mt-1">
                        正解: {cp.options.find((o) => o.isCorrect)?.text}
                      </div>
                      <div className="text-[11px] text-stone-700 mt-1">{cp.explanation}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
