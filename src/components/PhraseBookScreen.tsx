import { useState, useMemo, type FC } from 'react';
import type { UserProgress } from '../types';
import {
  INITIAL_PHRASES,
  type PhraseCategory,
  type PhraseItem,
  type PhraseType,
} from '../data/phrases';
import {
  ChevronLeft,
  Search,
  BookOpen,
  Filter,
  Star,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { SpeechButton } from './SpeechButton';
import { SpeechControls } from './SpeechControls';

interface PhraseBookScreenProps {
  progress: UserProgress;
  onBackToHome: () => void;
  onToggleBookmark: (phraseId: string) => void;
}

type StatusFilter = 'all' | 'learned' | 'unlearned' | 'bookmarked';
type CourseFilter = 'all' | 'phrase' | 'vocabulary';
type CategoryFilter = 'all' | PhraseCategory;

const CATEGORY_NAMES: Record<PhraseCategory, { phrase: string; vocab: string }> = {
  feel: { phrase: '手応え・感触', vocab: '馬場状態・コース条件' },
  tactics: { phrase: '仕掛け・展開', vocab: 'レース展開・位置取り・馬具' },
  reaction: { phrase: '勝負根性・反応', vocab: '競走馬の挙動・気性・状態' },
  comment: { phrase: 'コメント・総括', vocab: '着差・裁決・成績・斤量' },
};

export const PhraseBookScreen: FC<PhraseBookScreenProps> = ({
  progress,
  onBackToHome,
  onToggleBookmark,
}) => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [courseFilter, setCourseFilter] = useState<CourseFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const learnedSet = useMemo(
    () => new Set(progress.learnedPhraseIds ?? []),
    [progress.learnedPhraseIds]
  );

  const bookmarkedSet = useMemo(
    () => new Set(progress.bookmarkedPhraseIds ?? []),
    [progress.bookmarkedPhraseIds]
  );

  // 全体・コース別の習得進捗計算
  const totalCount = INITIAL_PHRASES.length;
  const learnedTotalCount = learnedSet.size;
  const progressPercent = Math.round((learnedTotalCount / totalCount) * 100);

  const uphillTotal = useMemo(
    () => INITIAL_PHRASES.filter((p) => (p.type ?? 'phrase') === 'phrase').length,
    []
  );
  const uphillLearned = useMemo(
    () => INITIAL_PHRASES.filter((p) => (p.type ?? 'phrase') === 'phrase' && learnedSet.has(p.id)).length,
    [learnedSet]
  );

  const woodchipTotal = useMemo(
    () => INITIAL_PHRASES.filter((p) => p.type === 'vocabulary').length,
    []
  );
  const woodchipLearned = useMemo(
    () => INITIAL_PHRASES.filter((p) => p.type === 'vocabulary' && learnedSet.has(p.id)).length,
    [learnedSet]
  );

  const bookmarkCount = bookmarkedSet.size;

  // フィルタリング処理（#89の構成を踏襲・拡張）
  const filteredPhrases = useMemo(() => {
    return INITIAL_PHRASES.filter((item) => {
      const isLearned = learnedSet.has(item.id);
      const isBookmarked = bookmarkedSet.has(item.id);
      const itemType: PhraseType = item.type ?? 'phrase';

      // 1. 習得状態フィルター
      if (statusFilter === 'learned' && !isLearned) return false;
      if (statusFilter === 'unlearned' && isLearned) return false;
      if (statusFilter === 'bookmarked' && !isBookmarked) return false;

      // 2. コース種別フィルター
      if (courseFilter === 'phrase' && itemType !== 'phrase') return false;
      if (courseFilter === 'vocabulary' && itemType !== 'vocabulary') return false;

      // 3. カテゴリフィルター
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;

      // 4. キーワード検索（英語、日本語選択肢、解説、シチュエーション、直訳）
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const inPhrase = item.phrase.toLowerCase().includes(q);
        const inSituation = item.situation.toLowerCase().includes(q);
        const inExplanation = item.explanation.toLowerCase().includes(q);
        const inLiteral = (item.literalTranslation ?? '').toLowerCase().includes(q);
        const inOptions = item.options.some((opt) => opt.text.toLowerCase().includes(q));

        if (!inPhrase && !inSituation && !inExplanation && !inLiteral && !inOptions) {
          return false;
        }
      }

      return true;
    });
  }, [statusFilter, courseFilter, categoryFilter, searchQuery, learnedSet, bookmarkedSet]);

  return (
    <div className="flex-1 flex flex-col bg-zinc-100 min-h-screen text-zinc-900 pb-12">
      {/* 上部固定ヘッダー */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xs border-b border-zinc-200 px-3 sm:px-4 py-2.5 shadow-xs">
        <div className="flex items-center justify-between gap-2 max-w-md mx-auto w-full">
          <button
            onClick={onBackToHome}
            className="inline-flex items-center gap-1 text-xs font-bold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 px-2 py-1 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>ホーム（厩舎）へ</span>
          </button>

          <div className="text-right min-w-0">
            <h1 className="text-sm font-black text-emerald-950 flex items-center justify-end gap-1 truncate">
              <BookOpen className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>競馬英語フレーズ図鑑</span>
            </h1>
            <p className="text-[10px] text-zinc-500 font-medium">
              {filteredPhrases.length} 件表示（全 {totalCount} 問）
            </p>
          </div>
        </div>
      </header>

      {/* 習得進捗サマリーカード */}
      <div className="bg-linear-to-b from-white to-emerald-50/30 border-b border-emerald-100/80 px-4 py-3.5 shadow-2xs">
        <div className="max-w-md mx-auto w-full">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-emerald-950 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>総合マスター進捗</span>
            </span>
            <span className="text-xs font-black text-emerald-800">
              {learnedTotalCount} / {totalCount} 問 ({progressPercent}%)
            </span>
          </div>

          {/* プログレスバー */}
          <div className="w-full bg-zinc-200/80 h-2.5 rounded-full overflow-hidden mb-2.5">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* コース別 & ブックマーク進捗バッジ */}
          <div className="grid grid-cols-3 gap-1.5 text-center text-[11px]">
            <div className="bg-white/80 rounded-lg p-1.5 border border-emerald-100">
              <span className="text-[10px] text-zinc-500 block">🌿 坂路実戦</span>
              <span className="font-extrabold text-emerald-900">
                {uphillLearned} / {uphillTotal}
              </span>
            </div>
            <div className="bg-white/80 rounded-lg p-1.5 border border-emerald-100">
              <span className="text-[10px] text-zinc-500 block">🪵 ウッド単語</span>
              <span className="font-extrabold text-amber-900">
                {woodchipLearned} / {woodchipTotal}
              </span>
            </div>
            <div className="bg-white/80 rounded-lg p-1.5 border border-amber-100">
              <span className="text-[10px] text-amber-800 block">⭐ 要復習</span>
              <span className="font-extrabold text-amber-950">
                {bookmarkCount} 件
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 検索 & フィルターエリア（#89の構成を踏襲・拡張） */}
      <div className="bg-white border-b border-zinc-200/80 px-3 sm:px-4 py-3 shadow-2xs">
        <div className="max-w-md mx-auto w-full space-y-2.5">
          {/* 検索インプット */}
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="英語、日本語訳、解説、シチュエーションを検索..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-1 cursor-pointer"
                title="検索をクリア"
              >
                ✕
              </button>
            )}
          </div>

          {/* 習得状態フィルター（すべて / 習得済 / 未習得 / ⭐ 要復習） */}
          <div className="grid grid-cols-4 gap-1 text-[11px] font-bold">
            <button
              onClick={() => setStatusFilter('all')}
              className={`py-1.5 px-1 rounded-lg transition-all text-center cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-zinc-800 text-white shadow-xs'
                  : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600'
              }`}
            >
              すべて
            </button>
            <button
              onClick={() => setStatusFilter('learned')}
              className={`py-1.5 px-1 rounded-lg transition-all text-center cursor-pointer ${
                statusFilter === 'learned'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600'
              }`}
            >
              ✅ 習得済 ({learnedTotalCount})
            </button>
            <button
              onClick={() => setStatusFilter('unlearned')}
              className={`py-1.5 px-1 rounded-lg transition-all text-center cursor-pointer ${
                statusFilter === 'unlearned'
                  ? 'bg-amber-700 text-white shadow-xs'
                  : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600'
              }`}
            >
              ⏳ 未習得 ({totalCount - learnedTotalCount})
            </button>
            <button
              onClick={() => setStatusFilter('bookmarked')}
              className={`py-1.5 px-1 rounded-lg transition-all text-center cursor-pointer ${
                statusFilter === 'bookmarked'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600'
              }`}
            >
              ⭐ 要復習 ({bookmarkCount})
            </button>
          </div>

          {/* コース種別選択チップ */}
          <div className="grid grid-cols-3 gap-1.5 text-xs font-bold">
            <button
              onClick={() => setCourseFilter('all')}
              className={`py-1 px-2 rounded-lg transition-all text-center cursor-pointer ${
                courseFilter === 'all'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
              }`}
            >
              全コース
            </button>
            <button
              onClick={() => setCourseFilter('phrase')}
              className={`py-1 px-2 rounded-lg transition-all text-center cursor-pointer ${
                courseFilter === 'phrase'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
              }`}
            >
              🌿 坂路 ({uphillTotal})
            </button>
            <button
              onClick={() => setCourseFilter('vocabulary')}
              className={`py-1 px-2 rounded-lg transition-all text-center cursor-pointer ${
                courseFilter === 'vocabulary'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
              }`}
            >
              🪵 ウッド ({woodchipTotal})
            </button>
          </div>

          {/* カテゴリ選択チップ */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] scrollbar-none">
            <span className="text-zinc-400 shrink-0 flex items-center gap-0.5 mr-0.5">
              <Filter className="w-3 h-3" />
            </span>
            {(
              [
                { key: 'all', label: '全カテゴリ' },
                { key: 'feel', label: '手応え・馬場' },
                { key: 'tactics', label: '仕掛け・展開' },
                { key: 'reaction', label: '勝負根性・挙動' },
                { key: 'comment', label: '総括・着差' },
              ] as const
            ).map((cat) => {
              const isSelected = categoryFilter === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => setCategoryFilter(cat.key)}
                  className={`px-2 py-0.5 rounded-full font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-zinc-800 text-white'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* 音声発音設定バー */}
          <div className="flex items-center justify-between pt-1 border-t border-zinc-100 text-[11px] text-zinc-500">
            <span className="font-semibold text-zinc-600 flex items-center gap-1">
              <span>🔊</span> 発音設定:
            </span>
            <SpeechControls />
          </div>
        </div>
      </div>

      {/* フレーズカード一覧リスト */}
      <main className="flex-1 p-3 sm:p-4 max-w-md mx-auto w-full space-y-3">
        {filteredPhrases.length === 0 ? (
          <div className="bg-white rounded-2xl border border-zinc-200 p-8 text-center text-zinc-500">
            <p className="text-sm font-bold">該当するフレーズが見つかりませんでした。</p>
            <p className="text-xs text-zinc-400 mt-1">
              検索キーワードやフィルター条件を変更してお試しください。
            </p>
          </div>
        ) : (
          filteredPhrases.map((item: PhraseItem, index: number) => {
            const isLearned = learnedSet.has(item.id);
            const isBookmarked = bookmarkedSet.has(item.id);
            const isVocab = item.type === 'vocabulary';
            const categoryMeta = CATEGORY_NAMES[item.category];
            const categoryLabel = isVocab ? categoryMeta.vocab : categoryMeta.phrase;
            const correctOption = item.options.find((o) => o.isCorrect);

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border transition-all shadow-2xs overflow-hidden ${
                  isBookmarked
                    ? 'border-amber-300 ring-1 ring-amber-300/60'
                    : 'border-zinc-200/90'
                }`}
              >
                {/* カードヘッダー */}
                <div className="bg-zinc-50/90 border-b border-zinc-200/70 px-3.5 py-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-200/80 text-zinc-700">
                      #{index + 1}
                    </span>

                    {/* 習得状態バッジ */}
                    {isLearned ? (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>習得済</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500 border border-zinc-200">
                        <Clock className="w-3 h-3 text-zinc-400" />
                        <span>未習得</span>
                      </span>
                    )}

                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm border ${
                        isVocab
                          ? 'bg-amber-50 text-amber-900 border-amber-200'
                          : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                      }`}
                    >
                      {isVocab ? '🪵 単語' : '🌿 フレーズ'}
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      {categoryLabel}
                    </span>
                  </div>

                  {/* ブックマーク（要復習）ボタン */}
                  <button
                    type="button"
                    onClick={() => onToggleBookmark(item.id)}
                    aria-label={isBookmarked ? '要復習ブックマークを解除' : '要復習ブックマークに追加'}
                    title={isBookmarked ? '要復習から外す' : '要復習・お気に入りに追加'}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                      isBookmarked
                        ? 'text-amber-500 bg-amber-50 hover:bg-amber-100'
                        : 'text-zinc-400 hover:text-amber-500 hover:bg-zinc-100'
                    }`}
                  >
                    <Star
                      className={`w-4 h-4 ${isBookmarked ? 'fill-amber-400 text-amber-500' : ''}`}
                    />
                  </button>
                </div>

                {/* カード本文 */}
                <div className="p-3.5 space-y-2.5">
                  {/* シチュエーション */}
                  <div className="text-[11px] text-zinc-600 bg-zinc-50/70 border border-zinc-200/60 rounded-lg px-2.5 py-1 flex items-start gap-1">
                    <span className="shrink-0 text-xs">🎙️</span>
                    <span className="leading-snug">{item.situation}</span>
                  </div>

                  {/* 英語表現 & 発音ボタン */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-base sm:text-lg font-black text-zinc-900 leading-snug tracking-tight">
                        “{item.phrase}”
                      </h2>
                      {item.literalTranslation && (
                        <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                          <span className="font-semibold text-zinc-400 mr-1">直訳:</span>
                          {item.literalTranslation}
                        </p>
                      )}
                    </div>
                    <SpeechButton text={item.phrase} size="sm" showLabel label="発音" />
                  </div>

                  {/* 正解の日本語意味 */}
                  <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-xl p-2.5 text-xs text-emerald-950 font-bold flex items-start gap-1.5">
                    <span className="text-emerald-700 shrink-0">🎯</span>
                    <span className="leading-snug">{correctOption?.text}</span>
                  </div>

                  {/* 解説 */}
                  <div className="bg-amber-50/60 border border-amber-200/70 rounded-xl p-2.5 text-xs text-amber-950 leading-relaxed">
                    <p className="font-bold text-[11px] text-amber-900 flex items-center gap-1 mb-0.5">
                      <span>💡</span> ワンポイント解説
                    </p>
                    <p className="text-[11px] text-zinc-700 leading-relaxed">
                      {item.explanation}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </main>
    </div>
  );
};
