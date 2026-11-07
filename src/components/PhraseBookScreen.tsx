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
  Volume2,
  Radio,
  Lightbulb,
  Award,
  X,
} from 'lucide-react';
import { SpeechButton } from './SpeechButton';
import { SpeechControls } from './SpeechControls';
import { resolvePhrasePartner } from '../lib/phrasePartner';
import { COAT_COLOR_THEMES } from '../lib/hallOfFame';

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

  // フィルタリング処理
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
    <div className="flex-1 flex flex-col bg-[#FAF8F3] min-h-screen text-stone-900 pb-12">
      {/* 上部固定ヘッダー */}
      <header className="sticky top-14 z-40 bg-[#FAF8F3]/95 backdrop-blur-xs border-b border-[#D8CEBE] px-3 sm:px-4 py-2.5 shadow-2xs">
        <div className="flex items-center justify-between gap-2 max-w-md mx-auto w-full">
          <button
            onClick={onBackToHome}
            className="inline-flex items-center gap-1 text-xs font-bold text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 px-2 py-1 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>ホーム（厩舎）へ</span>
          </button>

          <div className="text-right min-w-0">
            <h1 className="text-sm font-bold text-[#0D3322] font-racing-serif flex items-center justify-end gap-1.5 truncate">
              <BookOpen className="w-4 h-4 text-[#9A7418] shrink-0" />
              <span>競馬英語フレーズ図鑑</span>
            </h1>
            <p className="text-[10px] text-stone-600 font-medium font-racing-num">
              {filteredPhrases.length} 件表示（全 {totalCount} 問）
            </p>
          </div>
        </div>
      </header>

      {/* 習得進捗サマリーカード */}
      <div className="bg-linear-to-b from-[#FFFDF9] to-[#F5F1E6] border-b border-[#D8CEBE] px-4 py-3.5 shadow-2xs">
        <div className="max-w-md mx-auto w-full">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-[#0D3322] font-racing-serif flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#9A7418]" />
              <span>総合マスター進捗</span>
            </span>
            <span className="text-xs font-black text-[#0D3322] font-racing-num">
              {learnedTotalCount} / {totalCount} 問 ({progressPercent}%)
            </span>
          </div>

          {/* プログレスバー */}
          <div className="w-full bg-[#DED6C6] h-2.5 rounded-full overflow-hidden mb-2.5">
            <div
              className="bg-linear-to-r from-[#0D3322] to-[#1D6344] h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* コース別 & ブックマーク進捗バッジ */}
          <div className="grid grid-cols-3 gap-1.5 text-center text-[11px]">
            <div className="bg-[#FFFDF9] rounded-lg p-1.5 border border-[#BDCEB9]">
              <span className="text-[10px] text-stone-600 flex items-center justify-center gap-1">
                <span className="saddle-cloth-badge w-3.5 h-3.5 bg-[#0D3322] text-[#FAF8F3] text-[8px]">1</span>
                <span>坂路実戦</span>
              </span>
              <span className="font-extrabold text-[#0D3322] font-racing-num block mt-0.5">
                {uphillLearned} / {uphillTotal}
              </span>
            </div>
            <div className="bg-[#FFFDF9] rounded-lg p-1.5 border border-[#DEC8A8]">
              <span className="text-[10px] text-stone-600 flex items-center justify-center gap-1">
                <span className="saddle-cloth-badge w-3.5 h-3.5 bg-[#6B3A1E] text-[#FAF8F3] text-[8px]">2</span>
                <span>ウッド単語</span>
              </span>
              <span className="font-extrabold text-[#6B3A1E] font-racing-num block mt-0.5">
                {woodchipLearned} / {woodchipTotal}
              </span>
            </div>
            <div className="bg-[#FFFDF9] rounded-lg p-1.5 border border-[#E2C98A]">
              <span className="text-[10px] text-[#8A6D1B] flex items-center justify-center gap-1">
                <Star className="w-3 h-3 fill-[#C59B27] text-[#9A7418]" />
                <span>要復習</span>
              </span>
              <span className="font-extrabold text-stone-900 font-racing-num block mt-0.5">
                {bookmarkCount} 件
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 検索 & フィルターエリア */}
      <div className="bg-[#FFFDF9] border-b border-[#D8CEBE] px-3 sm:px-4 py-3 shadow-2xs">
        <div className="max-w-md mx-auto w-full space-y-2.5">
          {/* 検索インプット */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="英語、日本語訳、解説、シチュエーションを検索..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-[#F7F4EC] border border-[#D4C9B5] rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#0D3322] focus:bg-[#FFFDF9] shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
                title="検索をクリア"
                aria-label="検索をクリア"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* 習得状態フィルター（すべて / 習得済 / 未習得 / 要復習） */}
          <div className="grid grid-cols-4 gap-1 text-[11px] font-bold font-racing-num">
            <button
              onClick={() => setStatusFilter('all')}
              className={`py-1.5 px-1 rounded-lg transition-all text-center cursor-pointer border ${
                statusFilter === 'all'
                  ? 'bg-stone-800 text-[#FAF8F3] border-stone-800 shadow-xs'
                  : 'bg-[#F3EFE6] hover:bg-[#EAE3D5] text-stone-700 border-[#D8CEBE]'
              }`}
            >
              すべて
            </button>
            <button
              onClick={() => setStatusFilter('learned')}
              className={`py-1.5 px-1 rounded-lg transition-all text-center cursor-pointer border inline-flex items-center justify-center gap-1 ${
                statusFilter === 'learned'
                  ? 'bg-[#0D3322] text-[#FAF8F3] border-[#C59B27]/60 shadow-xs'
                  : 'bg-[#F3EFE6] hover:bg-[#EAE3D5] text-stone-700 border-[#D8CEBE]'
              }`}
            >
              <CheckCircle2 className="w-3 h-3 shrink-0" />
              <span>習得済 ({learnedTotalCount})</span>
            </button>
            <button
              onClick={() => setStatusFilter('unlearned')}
              className={`py-1.5 px-1 rounded-lg transition-all text-center cursor-pointer border inline-flex items-center justify-center gap-1 ${
                statusFilter === 'unlearned'
                  ? 'bg-[#6B3A1E] text-[#FAF8F3] border-[#C59B27]/60 shadow-xs'
                  : 'bg-[#F3EFE6] hover:bg-[#EAE3D5] text-stone-700 border-[#D8CEBE]'
              }`}
            >
              <Clock className="w-3 h-3 shrink-0" />
              <span>未習得 ({totalCount - learnedTotalCount})</span>
            </button>
            <button
              onClick={() => setStatusFilter('bookmarked')}
              className={`py-1.5 px-1 rounded-lg transition-all text-center cursor-pointer border inline-flex items-center justify-center gap-1 ${
                statusFilter === 'bookmarked'
                  ? 'bg-[#C59B27] text-stone-950 border-[#9A7418] shadow-xs'
                  : 'bg-[#F3EFE6] hover:bg-[#EAE3D5] text-stone-700 border-[#D8CEBE]'
              }`}
            >
              <Star className="w-3 h-3 shrink-0" />
              <span>要復習 ({bookmarkCount})</span>
            </button>
          </div>

          {/* コース種別選択チップ */}
          <div className="grid grid-cols-3 gap-1.5 text-xs font-bold font-racing-num">
            <button
              onClick={() => setCourseFilter('all')}
              className={`py-1 px-2 rounded-lg transition-all text-center cursor-pointer border ${
                courseFilter === 'all'
                  ? 'bg-[#0D3322] text-[#FAF8F3] border-[#C59B27]/60 shadow-xs'
                  : 'bg-[#F3EFE6] hover:bg-[#EAE3D5] text-stone-700 border-[#D8CEBE]'
              }`}
            >
              全コース
            </button>
            <button
              onClick={() => setCourseFilter('phrase')}
              className={`py-1 px-2 rounded-lg transition-all text-center cursor-pointer border inline-flex items-center justify-center gap-1.5 ${
                courseFilter === 'phrase'
                  ? 'bg-[#0D3322] text-[#FAF8F3] border-[#C59B27]/60 shadow-xs'
                  : 'bg-[#F3EFE6] hover:bg-[#EAE3D5] text-stone-700 border-[#D8CEBE]'
              }`}
            >
              <span className="saddle-cloth-badge w-4 h-4 bg-[#0D3322] text-[#FAF8F3] text-[9px] border border-[#C59B27]">1</span>
              <span>坂路 ({uphillTotal})</span>
            </button>
            <button
              onClick={() => setCourseFilter('vocabulary')}
              className={`py-1 px-2 rounded-lg transition-all text-center cursor-pointer border inline-flex items-center justify-center gap-1.5 ${
                courseFilter === 'vocabulary'
                  ? 'bg-[#6B3A1E] text-[#FAF8F3] border-[#C59B27]/60 shadow-xs'
                  : 'bg-[#F3EFE6] hover:bg-[#EAE3D5] text-stone-700 border-[#D8CEBE]'
              }`}
            >
              <span className="saddle-cloth-badge w-4 h-4 bg-[#6B3A1E] text-[#FAF8F3] text-[9px] border border-[#C59B27]">2</span>
              <span>ウッド ({woodchipTotal})</span>
            </button>
          </div>

          {/* カテゴリ選択チップ */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] scrollbar-none">
            <span className="text-stone-500 shrink-0 flex items-center gap-0.5 mr-0.5">
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
                  className={`px-2.5 py-0.5 rounded-sm font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
                    isSelected
                      ? 'bg-[#0D3322] text-[#E6C762] border-[#C59B27]'
                      : 'bg-[#F3EFE6] text-stone-700 border-[#D8CEBE] hover:bg-[#EAE3D5]'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* 音声発音設定バー */}
          <div className="flex items-center justify-between pt-1.5 border-t border-[#E5DEC9] text-[11px] text-stone-600">
            <span className="font-semibold text-stone-700 flex items-center gap-1">
              <Volume2 className="w-3.5 h-3.5 text-[#0D3322]" />
              <span>発音設定:</span>
            </span>
            <SpeechControls />
          </div>
        </div>
      </div>

      {/* フレーズカード一覧リスト */}
      <main className="flex-1 p-3 sm:p-4 max-w-md mx-auto w-full space-y-3">
        {filteredPhrases.length === 0 ? (
          <div className="bg-[#FFFDF9] rounded-2xl border border-[#D4C9B5] p-8 text-center text-stone-600">
            <p className="text-sm font-bold font-racing-serif text-stone-800">
              該当するフレーズが見つかりませんでした
            </p>
            <p className="text-xs text-stone-500 mt-1">
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
            const partnerHorse = resolvePhrasePartner(
              item.id,
              progress.phrasePartners,
              isLearned,
              progress.careerHorse
            );

            return (
              <div
                key={item.id}
                className={`bg-[#FFFDF9] rounded-2xl border transition-all shadow-2xs overflow-hidden ${
                  isBookmarked
                    ? 'border-[#C59B27] ring-1 ring-[#C59B27]/60'
                    : 'border-[#D4C9B5]'
                }`}
              >
                {/* カードヘッダー */}
                <div className="bg-[#F5F1E6] border-b border-[#DFD6C5] px-3.5 py-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-mono font-racing-num font-bold px-1.5 py-0.5 rounded-xs bg-[#E6DFD1] text-stone-800">
                      #{index + 1}
                    </span>

                    {/* 習得状態バッジ */}
                    {isLearned ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-xs bg-[#0D3322] text-[#E6C762] border border-[#C59B27]">
                        <CheckCircle2 className="w-3 h-3 text-[#E6C762]" />
                        <span>習得済</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-xs bg-stone-200/80 text-stone-600 border border-stone-300">
                        <Clock className="w-3 h-3 text-stone-500" />
                        <span>未習得</span>
                      </span>
                    )}

                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-xs border ${
                        isVocab
                          ? 'bg-[#FBF5E9] text-[#6B3A1E] border-[#DEC49A]'
                          : 'bg-[#EEF5F0] text-[#0D3322] border-[#B4CEBD]'
                      }`}
                    >
                      {isVocab ? '基礎単語' : '実戦フレーズ'}
                    </span>
                    <span className="text-[10px] text-stone-600 font-medium">
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
                        ? 'text-[#9A7418] bg-[#FDF6E2] hover:bg-[#F8EBC7]'
                        : 'text-stone-400 hover:text-[#9A7418] hover:bg-stone-200/50'
                    }`}
                  >
                    <Star
                      className={`w-4 h-4 ${isBookmarked ? 'fill-[#C59B27] text-[#9A7418]' : ''}`}
                    />
                  </button>
                </div>

                {/* カード本文 */}
                <div className="p-3.5 space-y-2.5">
                  {/* シチュエーション */}
                  <div className="text-[11px] text-stone-700 bg-[#F7F4EC] border border-[#E2DAC9] rounded-lg px-2.5 py-1 flex items-start gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-[#0D3322] shrink-0 mt-0.5" />
                    <span className="leading-snug">{item.situation}</span>
                  </div>

                  {/* 英語表現 & 発音ボタン */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-base sm:text-lg font-bold text-stone-900 font-racing-serif leading-snug tracking-tight">
                        “{item.phrase}”
                      </h2>
                      {item.literalTranslation && (
                        <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">
                          <span className="font-semibold text-stone-600 mr-1">直訳:</span>
                          {item.literalTranslation}
                        </p>
                      )}
                    </div>
                    <SpeechButton text={item.phrase} size="sm" showLabel label="発音" />
                  </div>

                  {/* 正解の日本語意味 */}
                  <div className="bg-[#EEF6F0] border border-[#A9CDB6] rounded-xl p-2.5 text-xs text-[#0D3322] font-bold flex items-start gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#0D3322] shrink-0 mt-0.5" />
                    <span className="leading-snug">{correctOption?.text}</span>
                  </div>

                  {/* 解説 */}
                  <div className="bg-[#FBF7F0] border border-[#DEC8A8] rounded-xl p-2.5 text-xs text-stone-900 leading-relaxed">
                    <p className="font-bold text-[11px] text-[#6B3A1E] flex items-center gap-1 mb-0.5">
                      <Lightbulb className="w-3.5 h-3.5 text-[#9A7418] shrink-0" />
                      <span>ワンポイント解説</span>
                    </p>
                    <p className="text-[11px] text-stone-700 leading-relaxed">
                      {item.explanation}
                    </p>
                  </div>

                  {/* 初習得パートナー馬 */}
                  {isLearned ? (
                    partnerHorse ? (
                      <div className="bg-[#F5F1E6] border border-[#D8CEBE] rounded-xl p-2.5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#0D3322]">
                          <Award className="w-3.5 h-3.5 text-[#9A7418] shrink-0" />
                          <span>初習得パートナー:</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="saddle-cloth-badge text-[10px] px-1.5 py-0.5 bg-[#0D3322] text-[#FAF8F3] border border-[#C59B27] font-racing-num">
                            第{partnerHorse.generation}世代
                          </span>
                          <span className="font-bold text-stone-900 font-racing-serif text-xs">
                            {partnerHorse.name}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-xs border ${
                              COAT_COLOR_THEMES[partnerHorse.color]?.borderClass ?? 'border-stone-300'
                            } ${
                              COAT_COLOR_THEMES[partnerHorse.color]?.bgClass ?? 'bg-stone-100'
                            } ${
                              COAT_COLOR_THEMES[partnerHorse.color]?.textClass ?? 'text-stone-700'
                            }`}
                          >
                            {partnerHorse.color}
                          </span>
                        </div>
                      </div>
                    ) : null
                  ) : (
                    <div className="bg-[#F7F4EC] border border-dashed border-[#D4C9B5] rounded-xl p-2 flex items-center justify-between text-[11px] text-stone-600">
                      <div className="flex items-center gap-1 font-medium text-stone-700">
                        <Award className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                        <span>パートナー:</span>
                      </div>
                      <span className="text-stone-700 font-medium">
                        第{progress.careerHorse.generation}世代「{progress.careerHorse.name}」と調教で習得しよう
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </main>
    </div>
  );
};
