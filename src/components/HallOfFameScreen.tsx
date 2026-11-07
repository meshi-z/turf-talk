import { useState, type FC } from 'react';
import type { HallOfFameHorse } from '../types';
import { HorseIllustration } from './HorseIllustration';
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
  Crown,
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
    <div className="flex-1 flex flex-col bg-[#FAF8F3] pb-12">
      {/* 画面トップヘッダー */}
      <div className="sticky top-14 z-20 bg-[#FAF8F3]/95 backdrop-blur-md border-b border-[#D8CEBE] px-4 py-3 flex items-center justify-between">
        <button
          type="button"
          onClick={onBackToHome}
          className="flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-stone-900 transition-colors py-1 px-2 rounded-lg hover:bg-stone-200/60 cursor-pointer"
          aria-label="ホームへ戻る"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>ホームへ戻る</span>
        </button>
        <h1 className="text-sm font-bold text-[#0D3322] font-racing-serif flex items-center gap-1.5">
          <Trophy className="w-4 h-4 text-[#9A7418]" />
          <span>殿堂入りギャラリー</span>
        </h1>
        <div className="w-16 text-right">
          <span className="text-[11px] font-bold font-racing-num text-[#0D3322] bg-[#EEF5F0] border border-[#B4CEBD] px-2 py-0.5 rounded-xs">
            {stats.totalHorses} 頭
          </span>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* 殿堂入りサマリー統計バナー（クラブハウス記念銘板仕様） */}
        <div className="bg-linear-to-br from-[#123F2B] via-[#0D3322] to-[#082015] text-[#FAF8F3] rounded-2xl p-4 shadow-md border border-[#C59B27]/55 racing-stitch-border">
          <div className="flex items-center gap-2 mb-2.5">
            <Sparkles className="w-4 h-4 text-[#E6C762]" />
            <h2 className="text-xs font-bold tracking-widest text-[#E6C762] uppercase">
              Hall of Fame Summary
            </h2>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center pt-1">
            <div className="bg-[#071D13]/75 rounded-xl p-2 border border-[#C59B27]/30">
              <div className="text-[10px] text-[#C8D8CE] font-medium">殿堂入り</div>
              <div className="text-lg font-black text-[#FAF8F3] font-racing-num">{stats.totalHorses}</div>
              <div className="text-[9px] text-[#9AB5A4]">頭</div>
            </div>
            <div className="bg-[#071D13]/75 rounded-xl p-2 border border-[#C59B27]/30">
              <div className="text-[10px] text-[#C8D8CE] font-medium">通算勝利</div>
              <div className="text-lg font-black text-[#E6C762] font-racing-num">{stats.totalWins}</div>
              <div className="text-[9px] text-[#9AB5A4]">勝</div>
            </div>
            <div className="bg-[#071D13]/75 rounded-xl p-2 border border-[#C59B27]/30">
              <div className="text-[10px] text-[#C8D8CE] font-medium">全勝馬</div>
              <div className="text-lg font-black text-emerald-300 font-racing-num">{stats.undefeatedCount}</div>
              <div className="text-[9px] text-[#9AB5A4]">頭</div>
            </div>
            <div className="bg-[#071D13]/75 rounded-xl p-2 border border-[#C59B27]/30">
              <div className="text-[10px] text-[#C8D8CE] font-medium">習得英語</div>
              <div className="text-lg font-black text-[#FAF8F3] font-racing-num">{stats.totalLearnedCount}</div>
              <div className="text-[9px] text-[#9AB5A4]">問</div>
            </div>
          </div>
        </div>

        {/* コントロールバー（ソート切り替え） */}
        {hallOfFame.length > 0 && (
          <div className="flex items-center justify-between bg-[#F3EFE6] border border-[#D8CEBE] p-2 rounded-xl text-xs">
            <span className="text-stone-700 font-semibold flex items-center gap-1 pl-1">
              <Layers className="w-3.5 h-3.5 text-[#0D3322]" />
              <span>並び替え</span>
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setSortBy('generation-desc')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer border ${
                  sortBy === 'generation-desc'
                    ? 'bg-[#0D3322] text-[#FAF8F3] border-[#C59B27]/60 shadow-2xs'
                    : 'bg-[#FFFDF9] text-stone-700 border-[#D4C9B5] hover:bg-stone-100'
                }`}
              >
                最新世代順
              </button>
              <button
                type="button"
                onClick={() => setSortBy('generation-asc')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer border ${
                  sortBy === 'generation-asc'
                    ? 'bg-[#0D3322] text-[#FAF8F3] border-[#C59B27]/60 shadow-2xs'
                    : 'bg-[#FFFDF9] text-stone-700 border-[#D4C9B5] hover:bg-stone-100'
                }`}
              >
                初代から
              </button>
              <button
                type="button"
                onClick={() => setSortBy('wins-desc')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer border ${
                  sortBy === 'wins-desc'
                    ? 'bg-[#0D3322] text-[#FAF8F3] border-[#C59B27]/60 shadow-2xs'
                    : 'bg-[#FFFDF9] text-stone-700 border-[#D4C9B5] hover:bg-stone-100'
                }`}
              >
                勝利数順
              </button>
            </div>
          </div>
        )}

        {/* エンプティステート */}
        {hallOfFame.length === 0 && (
          <div className="text-center py-12 px-6 bg-[#FFFDF9] rounded-2xl border border-[#D4C9B5] shadow-xs space-y-4">
            <div className="w-16 h-16 mx-auto bg-[#FDF6E2] rounded-full flex items-center justify-center border border-[#C59B27]/60 shadow-2xs">
              <Crown className="w-8 h-8 text-[#9A7418]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#0D3322] font-racing-serif">
                殿堂入りした愛馬はまだいません
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                4週間のキャリアサイクル（Week 1〜Week 4）を完走すると、
                共に歩んだ愛馬が二つ名（称号）と共にここに永く讃えられます。
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={onBackToHome}
                className="inline-flex items-center justify-center px-5 py-2.5 bg-[#0D3322] hover:bg-[#164B33] text-[#FAF8F3] border border-[#C59B27]/50 rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
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
                className="bg-[#FFFDF9] rounded-2xl border border-[#C59B27]/65 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* カードヘッダー（クラブハウス記念レリーフ銘板仕様） */}
                <div className="bg-linear-to-r from-[#123F2B] via-[#0D3322] to-[#1D1508] text-[#FAF8F3] p-4 border-b border-[#C59B27]/55 racing-stitch-border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="saddle-cloth-badge text-[10px] tracking-wider px-2 py-0.5 bg-[#FAF8F3] text-[#0D3322] border border-[#C59B27] font-racing-num">
                        第{horse.generation}世代
                      </span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-xs bg-black/35 text-[#E6C762] border border-[#C59B27]/35">
                        {horse.routeName}
                      </span>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-xs border ${colorTheme.borderClass} ${colorTheme.bgClass} ${colorTheme.textClass} bg-[#FFFDF9]`}
                      >
                        {horse.color}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#C8D8CE] flex items-center gap-1 font-racing-num">
                      <Calendar className="w-3 h-3 text-[#E6C762]" />
                      {horse.retiredDate}
                    </span>
                  </div>

                  {/* 二つ名・称号 */}
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xs bg-[#C59B27]/20 border border-[#C59B27]/55 text-[#E6C762] text-xs font-bold font-racing-serif tracking-wide mb-1.5">
                    <Award className="w-3.5 h-3.5 text-[#E6C762]" />
                    <span>【 {horse.titleName} 】</span>
                  </div>

                  {/* 馬名 */}
                  <h3 className="text-2xl font-bold tracking-wide text-[#FAF8F3] font-racing-serif drop-shadow-xs">
                    {horse.name}
                  </h3>
                </div>

                {/* カードボディ */}
                <div className="p-4 space-y-3">
                  {/* 歴代愛馬・殿堂入り記念肖像画（毛色別立ち絵 × 殿堂入り専用額装背景） */}
                  <div className="rounded-xl overflow-hidden border border-[#C59B27]/65 shadow-xs">
                    <HorseIllustration
                      color={horse.color}
                      scene="standing_left"
                      backgroundOverride="hall_of_fame"
                      alt={`${horse.name}（${horse.color}・${horse.titleName}）の殿堂入り記念肖像画`}
                    />
                  </div>

                  {/* 主要実績グリッド */}
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-[#F5F1E6] border border-[#DFD6C5] rounded-xl p-2.5">
                      <div className="text-[11px] text-stone-600 font-medium">通算戦績</div>
                      <div className="text-base font-black text-stone-900 font-racing-num">
                        {horse.totalRaces}戦 <span className="text-[#9A7418]">{horse.wins}勝</span>
                      </div>
                      <div className="text-[10px] text-stone-600 font-racing-num">
                        勝率 {Math.round((horse.wins / Math.max(1, horse.totalRaces)) * 100)}%
                      </div>
                    </div>
                    <div className="bg-[#EEF5F0] border border-[#BDCEB9] rounded-xl p-2.5">
                      <div className="text-[11px] text-[#0D3322] font-medium">マスター英語フレーズ</div>
                      <div className="text-base font-black text-[#0D3322] font-racing-num">
                        {horse.learnedCount} <span className="text-xs font-normal text-stone-600">問</span>
                      </div>
                      <div className="text-[10px] text-stone-600">この馬と習得</div>
                    </div>
                  </div>

                  {/* 獲得タイトル一覧 */}
                  {horse.titles && horse.titles.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[11px] font-bold text-stone-700 flex items-center gap-1">
                        <Trophy className="w-3 h-3 text-[#9A7418]" />
                        <span>獲得タイトル</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {horse.titles.map((title) => (
                          <span
                            key={title}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xs bg-[#FDF6E2] text-[#5C3A08] border border-[#C59B27]/60 text-[11px] font-bold"
                          >
                            <Trophy className="w-3 h-3 text-[#9A7418] shrink-0" />
                            <span>{title}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 4週間の出走軌跡アコーディオン */}
                  {horse.raceHistory && horse.raceHistory.length > 0 && (
                    <div className="border border-[#D4C9B5] rounded-xl overflow-hidden">
                      <button
                        type="button"
                        onClick={() => toggleExpand(horse.id)}
                        className="w-full px-3 py-2 bg-[#F5F1E6] flex items-center justify-between text-xs font-bold text-stone-800 hover:bg-[#ECE5D5] transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5 font-racing-num">
                          <BookOpen className="w-3.5 h-3.5 text-[#0D3322]" />
                          <span>4週間の出走戦績 ({horse.raceHistory.length}戦)</span>
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-stone-600" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-stone-600" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="p-3 bg-[#FFFDF9] space-y-2 text-xs divide-y divide-[#EAE3D5]">
                          {horse.raceHistory.map((race) => (
                            <div
                              key={`${race.week}-${race.raceName}`}
                              className="pt-2 first:pt-0 flex items-center justify-between"
                            >
                              <div>
                                <span className="font-bold text-stone-800 font-racing-num mr-1.5">
                                  Week {race.week}:
                                </span>
                                <span className="text-stone-800 font-racing-serif font-semibold">
                                  {race.raceName}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 font-racing-num">
                                <span className="font-bold text-[#0D3322] bg-[#EEF5F0] border border-[#B4CEBD] px-2 py-0.5 rounded-xs">
                                  {race.placementText}
                                </span>
                                <span className="text-[11px] text-stone-600">
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
                  <div className="pt-2 border-t border-[#E5DEC9] flex items-center gap-2">
                    <a
                      href={twitterUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#0D3322] hover:bg-[#164B33] text-[#FAF8F3] border border-[#C59B27]/50 text-xs font-bold transition-colors shadow-xs"
                      aria-label="Xでシェアする"
                    >
                      <Share2 className="w-3.5 h-3.5 text-[#E6C762]" />
                      <span>𝕏 でシェア</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => handleDownloadImage(horse)}
                      disabled={isDownloading}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-linear-to-r from-[#E6C762] to-[#C59B27] hover:from-[#F2D675] hover:to-[#D4AA32] text-stone-950 text-xs font-bold transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                      aria-label="殿堂入りカード画像を保存する"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{isDownloading ? '生成中...' : 'カード画像'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyText(horse)}
                      className="inline-flex items-center justify-center p-2 rounded-xl border border-[#D4C9B5] bg-[#F5F1E6] hover:bg-[#EAE3D5] text-stone-700 transition-colors cursor-pointer"
                      title="テキストをコピー"
                      aria-label="シェアテキストをクリップボードにコピー"
                    >
                      {isCopied ? (
                        <CheckCircle2 className="w-4 h-4 text-[#0D3322]" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {isCopied && (
                    <div className="text-[11px] text-center font-bold text-[#0D3322]">
                      テキストをクリップボードにコピーしました
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
