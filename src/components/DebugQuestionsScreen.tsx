import { useState, useMemo, type FC } from 'react';
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
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { SpeechButton } from './SpeechButton';
import { SpeechControls } from './SpeechControls';

interface DebugQuestionsScreenProps {
  onBackToHome: () => void;
}

type CourseFilter = 'all' | 'phrase' | 'vocabulary';
type CategoryFilter = 'all' | PhraseCategory;

const CATEGORY_NAMES: Record<PhraseCategory, { phrase: string; vocab: string }> = {
  feel: { phrase: '手応え・感触', vocab: '馬場状態・コース条件' },
  tactics: { phrase: '仕掛け・展開', vocab: 'レース展開・位置取り・馬具' },
  reaction: { phrase: '勝負根性・反応', vocab: '競走馬の挙動・気性・状態' },
  comment: { phrase: 'コメント・総括', vocab: '着差・裁決・成績・斤量' },
};

export const DebugQuestionsScreen: FC<DebugQuestionsScreenProps> = ({
  onBackToHome,
}) => {
  const [courseFilter, setCourseFilter] = useState<CourseFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // フィルタリング処理
  const filteredPhrases = useMemo(() => {
    return INITIAL_PHRASES.filter((item) => {
      // 1. コース種別フィルター
      const itemType: PhraseType = item.type ?? 'phrase';
      if (courseFilter === 'phrase' && itemType !== 'phrase') return false;
      if (courseFilter === 'vocabulary' && itemType !== 'vocabulary') return false;

      // 2. カテゴリフィルター
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;

      // 3. キーワード検索（英語、日本語選択肢、解説、シチュエーション）
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
  }, [courseFilter, categoryFilter, searchQuery]);

  // コース別件数の集計
  const uphillCount = useMemo(
    () => INITIAL_PHRASES.filter((p) => (p.type ?? 'phrase') === 'phrase').length,
    []
  );
  const woodchipCount = useMemo(
    () => INITIAL_PHRASES.filter((p) => p.type === 'vocabulary').length,
    []
  );

  return (
    <div className="flex-1 flex flex-col bg-zinc-100 min-h-screen text-zinc-900">
      {/* 上部固定ヘッダー */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xs border-b border-zinc-200 px-3 sm:px-4 py-2.5 shadow-xs">
        <div className="flex items-center justify-between gap-2 max-w-md mx-auto w-full">
          <button
            onClick={onBackToHome}
            className="inline-flex items-center gap-1 text-xs font-bold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 px-2 py-1 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>ホームへ戻る</span>
          </button>

          <div className="text-right min-w-0">
            <h1 className="text-sm font-black text-emerald-950 flex items-center justify-end gap-1 truncate">
              <BookOpen className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>問題・解答一覧 (デバッグ用)</span>
            </h1>
            <p className="text-[10px] text-zinc-500 font-medium">
              全 {INITIAL_PHRASES.length} 問中 {filteredPhrases.length} 問表示
            </p>
          </div>
        </div>
      </header>

      {/* コントロール & フィルターエリア */}
      <div className="bg-white border-b border-zinc-200/80 px-3 sm:px-4 py-3 shadow-2xs">
        <div className="max-w-md mx-auto w-full space-y-2.5">
          {/* 検索インプット */}
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="フレーズ、用語、選択肢、解説を検索..."
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-0.5 cursor-pointer"
                title="検索をクリア"
              >
                ✕
              </button>
            )}
          </div>

          {/* コース種別選択チップ */}
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => setCourseFilter('all')}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                courseFilter === 'all'
                  ? 'bg-emerald-700 text-white shadow-xs ring-1 ring-emerald-600'
                  : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
              }`}
            >
              すべて ({INITIAL_PHRASES.length})
            </button>
            <button
              onClick={() => setCourseFilter('phrase')}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                courseFilter === 'phrase'
                  ? 'bg-emerald-700 text-white shadow-xs ring-1 ring-emerald-600'
                  : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
              }`}
            >
              🌿 坂路 ({uphillCount})
            </button>
            <button
              onClick={() => setCourseFilter('vocabulary')}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                courseFilter === 'vocabulary'
                  ? 'bg-emerald-700 text-white shadow-xs ring-1 ring-emerald-600'
                  : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
              }`}
            >
              🪵 ウッド ({woodchipCount})
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

      {/* 設問一覧リスト */}
      <main className="flex-1 p-3 sm:p-4 max-w-md mx-auto w-full space-y-3.5">
        {filteredPhrases.length === 0 ? (
          <div className="bg-white rounded-2xl border border-zinc-200 p-8 text-center text-zinc-500">
            <p className="text-sm font-bold">該当する問題が見つかりませんでした。</p>
            <p className="text-xs text-zinc-400 mt-1">
              フィルター条件や検索キーワードを変更してお試しください。
            </p>
          </div>
        ) : (
          filteredPhrases.map((item: PhraseItem, index: number) => {
            const isVocab = item.type === 'vocabulary';
            const categoryMeta = CATEGORY_NAMES[item.category];
            const categoryLabel = isVocab ? categoryMeta.vocab : categoryMeta.phrase;

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-zinc-200/90 shadow-2xs overflow-hidden"
              >
                {/* 設問カードヘッダー */}
                <div className="bg-zinc-50/90 border-b border-zinc-200/70 px-3.5 py-2 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-200/80 text-zinc-700">
                      #{index + 1} {item.id}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isVocab
                          ? 'bg-amber-50 text-amber-800 border-amber-300'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      }`}
                    >
                      {isVocab ? '🪵 基礎単語' : '🌿 実戦フレーズ'}
                    </span>
                    <span className="text-[10px] font-semibold text-zinc-600 bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded">
                      {categoryLabel}
                    </span>
                  </div>

                  <span className="text-[9px] font-semibold tracking-wider uppercase text-zinc-400">
                    {item.level}
                  </span>
                </div>

                {/* 設問内容ボディ */}
                <div className="p-3.5 space-y-2.5">
                  {/* シチュエーション */}
                  <div className="text-[11px] text-zinc-600 bg-zinc-50/70 border border-zinc-200/60 rounded-lg px-2.5 py-1 flex items-start gap-1">
                    <span className="shrink-0 text-xs">🎙️</span>
                    <span className="leading-snug">{item.situation}</span>
                  </div>

                  {/* 英語フレーズ / 単語 */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-base sm:text-lg font-black text-zinc-900 leading-snug tracking-tight">
                        {item.phrase}
                      </h2>
                      {item.literalTranslation && (
                        <p className="text-[11px] text-zinc-500 mt-0.5 leading-snug">
                          <span className="font-semibold text-zinc-400 mr-1">直訳:</span>
                          {item.literalTranslation}
                        </p>
                      )}
                    </div>
                    <SpeechButton text={item.phrase} size="xs" />
                  </div>

                  {/* 4択選択肢 */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold text-zinc-400 block uppercase tracking-wider">
                      Options / 4択選択肢
                    </span>
                    <div className="grid grid-cols-1 gap-1.5">
                      {item.options.map((option, optIdx) => (
                        <div
                          key={option.id}
                          className={`flex items-start justify-between gap-2 p-2 rounded-lg border text-xs leading-snug ${
                            option.isCorrect
                              ? 'bg-emerald-50/90 border-emerald-400/90 text-emerald-950 font-bold shadow-2xs'
                              : 'bg-zinc-50/80 border-zinc-200/70 text-zinc-600'
                          }`}
                        >
                          <div className="flex items-start gap-1.5 min-w-0">
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                                option.isCorrect
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-zinc-200 text-zinc-600'
                              }`}
                            >
                              {optIdx + 1}
                            </span>
                            <span className="break-words">{option.text}</span>
                          </div>
                          {option.isCorrect && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-emerald-600 text-white px-1.5 py-0.5 rounded-full shrink-0 shadow-2xs">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>正解</span>
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 解説 */}
                  <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-2.5 text-xs text-amber-950 leading-relaxed">
                    <p className="font-bold text-[11px] text-amber-900 flex items-center gap-1 mb-0.5">
                      <span>💡</span> ワンポイント解説
                    </p>
                    <p className="text-[11px] text-amber-900/90 leading-relaxed">
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
