import { useState, type FC } from 'react';
import type { HallOfFameHorse } from '../types';
import {
  calculateHallOfFameStats,
  sortHallOfFame,
  generateHallOfFameTwitterUrl,
  generateHallOfFameShareText,
  downloadHallOfFameCard,
  copyShareTextToClipboard,
  COAT_COLOR_THEMES,
  type HallOfFameSortOption,
} from '../lib/hallOfFame';
import {
  Trophy,
  ArrowLeft,
  Share2,
  Download,
  Copy,
  ChevronDown,
  ChevronUp,
  Award,
  Sparkles,
  BookOpen,
  Calendar,
  Layers,
  CheckCircle2,
} from 'lucide-react';

interface HallOfFameScreenProps {
  hallOfFame: HallOfFameHorse[];
  onBackToHome: () => void;
}

export const HallOfFameScreen: FC<HallOfFameScreenProps> = ({ hallOfFame, onBackToHome }) => {
  const [sortBy, setSortBy] = useState<HallOfFameSortOption>('generation-desc');
  const [expandedHorseId, setExpandedHorseId] = useState<string | null>(null);
  const [copiedHorseId, setCopiedHorseId] = useState<string | null>(null);
  const [downloadingHorseId, setDownloadingHorseId] = useState<string | null>(null);

  const stats = calculateHallOfFameStats(hallOfFame);
  const sortedHorses = sortHallOfFame(hallOfFame, sortBy);

  const toggleExpand = (id: string) => {
    setExpandedHorseId((prev) => (prev === id ? null : id));
  };

  const handleCopyText = async (horse: HallOfFameHorse) => {
    const text = generateHallOfFameShareText(horse);
    const ok = await copyShareTextToClipboard(text);
    if (ok) {
      setCopiedHorseId(horse.id);
      setTimeout(() => {
        setCopiedHorseId((prev) => (prev === horse.id ? null : prev));
      }, 2000);
    }
  };

  const handleDownloadImage = async (horse: HallOfFameHorse) => {
    setDownloadingHorseId(horse.id);
    try {
      await downloadHallOfFameCard(horse);
    } finally {
      setDownloadingHorseId(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-zinc-50 pb-12">
      {/* 画面トップヘッダー */}
      <div className="sticky top-0 z-20 bg-zinc-50/95 backdrop-blur-md border-b border-zinc-200/80 px-4 py-3 flex items-center justify-between">
        <button
          type="button"
          onClick={onBackToHome}
          className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 transition-colors py-1 px-2 rounded-lg hover:bg-zinc-100"
          aria-label="ホームへ戻る"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>ホームへ戻る</span>
        </button>
        <h1 className="text-sm font-bold text-zinc-900 flex items-center gap-1.5">
          <Trophy className="w-4 h-4 text-amber-500" />
          <span>殿堂入りギャラリー</span>
        </h1>
        <div className="w-16 text-right">
          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-full">
            {stats.totalHorses} 頭
          </span>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* 殿堂入りサマリー統計バナー */}
        <div className="bg-gradient-to-br from-emerald-900 via-emerald-950 to-slate-900 text-white rounded-2xl p-4 shadow-md border border-emerald-800/40">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h2 className="text-xs font-bold tracking-wider text-emerald-200 uppercase">
              Hall of Fame Summary
            </h2>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center pt-1">
            <div className="bg-white/10 rounded-xl p-2 border border-white/5">
              <div className="text-[10px] text-zinc-300 font-medium">殿堂入り</div>
              <div className="text-lg font-black text-white">{stats.totalHorses}</div>
              <div className="text-[9px] text-zinc-400">頭</div>
            </div>
            <div className="bg-white/10 rounded-xl p-2 border border-white/5">
              <div className="text-[10px] text-zinc-300 font-medium">通算勝利</div>
              <div className="text-lg font-black text-amber-400">{stats.totalWins}</div>
              <div className="text-[9px] text-zinc-400">勝</div>
            </div>
            <div className="bg-white/10 rounded-xl p-2 border border-white/5">
              <div className="text-[10px] text-zinc-300 font-medium">全勝馬</div>
              <div className="text-lg font-black text-emerald-400">{stats.undefeatedCount}</div>
              <div className="text-[9px] text-zinc-400">頭</div>
            </div>
            <div className="bg-white/10 rounded-xl p-2 border border-white/5">
              <div className="text-[10px] text-zinc-300 font-medium">習得英語</div>
              <div className="text-lg font-black text-cyan-300">{stats.totalLearnedCount}</div>
              <div className="text-[9px] text-zinc-400">問</div>
            </div>
          </div>
        </div>

        {/* コントロールバー（ソート切り替え） */}
        {hallOfFame.length > 0 && (
          <div className="flex items-center justify-between bg-zinc-100/80 p-2 rounded-xl text-xs">
            <span className="text-zinc-600 font-medium flex items-center gap-1 pl-1">
              <Layers className="w-3.5 h-3.5 text-zinc-500" />
              <span>並び替え</span>
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setSortBy('generation-desc')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  sortBy === 'generation-desc'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-white text-zinc-700 hover:bg-zinc-200/80'
                }`}
              >
                最新世代順
              </button>
              <button
                type="button"
                onClick={() => setSortBy('generation-asc')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  sortBy === 'generation-asc'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-white text-zinc-700 hover:bg-zinc-200/80'
                }`}
              >
                初代から
              </button>
              <button
                type="button"
                onClick={() => setSortBy('wins-desc')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  sortBy === 'wins-desc'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-white text-zinc-700 hover:bg-zinc-200/80'
                }`}
              >
                勝利数順
              </button>
            </div>
          </div>
        )}

        {/* エンプティステート */}
        {hallOfFame.length === 0 && (
          <div className="text-center py-12 px-6 bg-white rounded-2xl border border-zinc-200 shadow-sm space-y-4">
            <div className="w-16 h-16 mx-auto bg-amber-50 rounded-full flex items-center justify-center text-3xl border border-amber-200">
              🏛️
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-zinc-900">殿堂入りした愛馬はまだいません</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                4週間のキャリアサイクル（Week 1〜Week 4）を完走すると、
                共に歩んだ愛馬が二つ名（称号）と共にここに永く讃えられます。
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={onBackToHome}
                className="inline-flex items-center justify-center px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
              >
                育成に戻る
              </button>
            </div>
          </div>
        )}

        {/* 殿堂入り愛馬カード一覧 */}
        <div className="space-y-4">
          {sortedHorses.map((horse) => {
            const isExpanded = expandedHorseId === horse.id;
            const isCopied = copiedHorseId === horse.id;
            const isDownloading = downloadingHorseId === horse.id;
            const twitterUrl = generateHallOfFameTwitterUrl(horse);
            const colorTheme = COAT_COLOR_THEMES[horse.color] ?? COAT_COLOR_THEMES['鹿毛'];

            return (
              <div
                key={horse.id}
                className="bg-white rounded-2xl border border-zinc-200/90 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* カードヘッダー */}
                <div className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 text-white p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full bg-amber-400 text-zinc-950 shadow-sm">
                        第{horse.generation}世代
                      </span>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/15 text-zinc-200">
                        {horse.routeName}
                      </span>
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${colorTheme.borderClass} ${colorTheme.bgClass} ${colorTheme.textClass} bg-white`}
                      >
                        {horse.color}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-zinc-400" />
                      {horse.retiredDate}
                    </span>
                  </div>

                  {/* 二つ名・称号 */}
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-black tracking-wide mb-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span>【 {horse.titleName} 】</span>
                  </div>

                  {/* 馬名 */}
                  <h3 className="text-2xl font-black tracking-wide text-white drop-shadow-sm">
                    {horse.name}
                  </h3>
                </div>

                {/* カードボディ */}
                <div className="p-4 space-y-3">
                  {/* 主要実績グリッド */}
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-zinc-50 border border-zinc-200/70 rounded-xl p-2.5">
                      <div className="text-[11px] text-zinc-500 font-medium">通算戦績</div>
                      <div className="text-base font-black text-zinc-900">
                        {horse.totalRaces}戦 <span className="text-amber-600">{horse.wins}勝</span>
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        勝率 {Math.round((horse.wins / Math.max(1, horse.totalRaces)) * 100)}%
                      </div>
                    </div>
                    <div className="bg-zinc-50 border border-zinc-200/70 rounded-xl p-2.5">
                      <div className="text-[11px] text-zinc-500 font-medium">マスター英語フレーズ</div>
                      <div className="text-base font-black text-emerald-700">
                        {horse.learnedCount} <span className="text-xs font-normal text-zinc-600">問</span>
                      </div>
                      <div className="text-[10px] text-zinc-500">この馬と習得</div>
                    </div>
                  </div>

                  {/* 獲得タイトル一覧 */}
                  {horse.titles && horse.titles.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[11px] font-bold text-zinc-600 flex items-center gap-1">
                        <Trophy className="w-3 h-3 text-amber-500" />
                        <span>獲得タイトル</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {horse.titles.map((title) => (
                          <span
                            key={title}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200/80 text-[11px] font-semibold"
                          >
                            <span>🏆</span>
                            <span>{title}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 4週間の出走軌跡アコーディオン */}
                  {horse.raceHistory && horse.raceHistory.length > 0 && (
                    <div className="border border-zinc-200 rounded-xl overflow-hidden">
                      <button
                        type="button"
                        onClick={() => toggleExpand(horse.id)}
                        className="w-full px-3 py-2 bg-zinc-50 flex items-center justify-between text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition-colors"
                      >
                        <span className="flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-zinc-500" />
                          <span>4週間の出走戦績 ({horse.raceHistory.length}戦)</span>
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-zinc-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-zinc-500" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="p-3 bg-white space-y-2 text-xs divide-y divide-zinc-100">
                          {horse.raceHistory.map((race) => (
                            <div
                              key={`${race.week}-${race.raceName}`}
                              className="pt-2 first:pt-0 flex items-center justify-between"
                            >
                              <div>
                                <span className="font-bold text-zinc-800 mr-1.5">
                                  Week {race.week}:
                                </span>
                                <span className="text-zinc-700">{race.raceName}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded-md">
                                  {race.placementText}
                                </span>
                                <span className="text-[11px] text-zinc-500">
                                  {race.score}/5点
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* アクションボタンバー（シェア・画像保存・コピー） */}
                  <div className="pt-2 border-t border-zinc-100 flex items-center gap-2">
                    <a
                      href={twitterUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-colors shadow-sm"
                      aria-label="Xでシェアする"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>𝕏 でシェア</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => handleDownloadImage(horse)}
                      disabled={isDownloading}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
                      aria-label="殿堂入りカード画像を保存する"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{isDownloading ? '生成中...' : 'カード画像'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyText(horse)}
                      className="inline-flex items-center justify-center p-2 rounded-xl border border-zinc-300 hover:bg-zinc-100 text-zinc-700 transition-colors"
                      title="テキストをコピー"
                      aria-label="シェアテキストをクリップボードにコピー"
                    >
                      {isCopied ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {isCopied && (
                    <div className="text-[11px] text-center font-bold text-emerald-700">
                      テキストをクリップボードにコピーしました！
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
