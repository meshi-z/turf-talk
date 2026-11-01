import type { HallOfFameHorse, HorseCoatColor } from '../types';

/**
 * 毛色ごとの視覚的カラーパレット（Tailwind クラス & Canvas用 HEX）
 */
export interface CoatColorTheme {
  label: HorseCoatColor;
  bgClass: string;
  textClass: string;
  borderClass: string;
  hex: string;
}

export const COAT_COLOR_THEMES: Record<HorseCoatColor, CoatColorTheme> = {
  鹿毛: {
    label: '鹿毛',
    bgClass: 'bg-amber-900/10',
    textClass: 'text-amber-800',
    borderClass: 'border-amber-800/30',
    hex: '#78350f',
  },
  栗毛: {
    label: '栗毛',
    bgClass: 'bg-orange-800/10',
    textClass: 'text-orange-700',
    borderClass: 'border-orange-700/30',
    hex: '#c2410c',
  },
  黒鹿毛: {
    label: '黒鹿毛',
    bgClass: 'bg-stone-900/10',
    textClass: 'text-stone-800',
    borderClass: 'border-stone-800/30',
    hex: '#292524',
  },
  芦毛: {
    label: '芦毛',
    bgClass: 'bg-zinc-700/10',
    textClass: 'text-zinc-700',
    borderClass: 'border-zinc-700/30',
    hex: '#52525b',
  },
  青鹿毛: {
    label: '青鹿毛',
    bgClass: 'bg-slate-900/10',
    textClass: 'text-slate-800',
    borderClass: 'border-slate-800/30',
    hex: '#1e293b',
  },
  青毛: {
    label: '青毛',
    bgClass: 'bg-neutral-950/10',
    textClass: 'text-neutral-900',
    borderClass: 'border-neutral-900/30',
    hex: '#0a0a0a',
  },
  栃栗毛: {
    label: '栃栗毛',
    bgClass: 'bg-yellow-950/10',
    textClass: 'text-yellow-900',
    borderClass: 'border-yellow-900/30',
    hex: '#422006',
  },
  白毛: {
    label: '白毛',
    bgClass: 'bg-slate-100',
    textClass: 'text-slate-700',
    borderClass: 'border-slate-300',
    hex: '#f8fafc',
  },
};

export type HallOfFameSortOption = 'generation-desc' | 'generation-asc' | 'wins-desc';

/**
 * 殿堂入り馬の統計サマリー
 */
export interface HallOfFameStats {
  totalHorses: number;
  totalWins: number;
  totalTitles: number;
  totalLearnedCount: number;
  undefeatedCount: number;
}

/**
 * 殿堂入り愛馬一覧から統計情報を集計
 */
export function calculateHallOfFameStats(hallOfFame: HallOfFameHorse[]): HallOfFameStats {
  if (!Array.isArray(hallOfFame) || hallOfFame.length === 0) {
    return {
      totalHorses: 0,
      totalWins: 0,
      totalTitles: 0,
      totalLearnedCount: 0,
      undefeatedCount: 0,
    };
  }

  let totalWins = 0;
  let totalTitles = 0;
  let totalLearnedCount = 0;
  let undefeatedCount = 0;

  for (const horse of hallOfFame) {
    totalWins += horse.wins ?? 0;
    totalTitles += Array.isArray(horse.titles) ? horse.titles.length : 0;
    totalLearnedCount += horse.learnedCount ?? 0;
    if (horse.totalRaces > 0 && horse.wins === horse.totalRaces) {
      undefeatedCount += 1;
    }
  }

  return {
    totalHorses: hallOfFame.length,
    totalWins,
    totalTitles,
    totalLearnedCount,
    undefeatedCount,
  };
}

/**
 * 殿堂入り愛馬のソート
 */
export function sortHallOfFame(
  hallOfFame: HallOfFameHorse[],
  sortBy: HallOfFameSortOption
): HallOfFameHorse[] {
  const cloned = [...hallOfFame];
  switch (sortBy) {
    case 'generation-desc':
      return cloned.sort((a, b) => b.generation - a.generation);
    case 'generation-asc':
      return cloned.sort((a, b) => a.generation - b.generation);
    case 'wins-desc':
      return cloned.sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        return b.generation - a.generation;
      });
    default:
      return cloned;
  }
}

/**
 * SNS（X等）シェア用テキストの生成
 */
export function generateHallOfFameShareText(horse: HallOfFameHorse): string {
  const titlesText =
    horse.titles.length > 0 ? ` (${horse.titles.slice(0, 2).join('・')})` : '';

  return `🏇 TurfTalk 殿堂入り愛馬カード 🏛️
第${horse.generation}世代「${horse.name}」（${horse.color}）
二つ名: 【${horse.titleName}】
路線: ${horse.routeName}
通算戦績: ${horse.totalRaces}戦${horse.wins}勝${titlesText}
習得フレーズ: ${horse.learnedCount}問マスター！

競馬英語マイクロラーニング TurfTalk で愛馬と英語を学ぼう！
#TurfTalk #競馬英語 #HallOfFame
https://meshi-z.github.io/turf-talk/`;
}

/**
 * X（旧Twitter）共有用のWeb Intent URLを生成
 */
export function generateHallOfFameTwitterUrl(horse: HallOfFameHorse): string {
  const text = generateHallOfFameShareText(horse);
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
}

/**
 * クリップボードにテキストをコピー
 */
export async function copyShareTextToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // コピー失敗
    }
  }
  return false;
}

/**
 * HTML5 Canvas を用いて「殿堂入り記念カード画像（PNG）」を生成
 * 解像度: 800px × 500px
 */
export async function generateHallOfFameCardDataUrl(horse: HallOfFameHorse): Promise<string> {
  if (typeof document === 'undefined') {
    return '';
  }

  const canvas = document.createElement('canvas');
  const width = 800;
  const height = 500;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // 1. 背景グラデーション（深いエメラルドグリーンからダークスレートへ）
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#064e3b'); // emerald-900
  bgGrad.addColorStop(0.5, '#022c22'); // emerald-950
  bgGrad.addColorStop(1, '#0f172a'); // slate-900
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. 外枠ゴールドフレーム
  ctx.save();
  ctx.lineWidth = 4;
  const goldGrad = ctx.createLinearGradient(0, 0, width, height);
  goldGrad.addColorStop(0, '#fef08a'); // yellow-200
  goldGrad.addColorStop(0.5, '#eab308'); // yellow-500
  goldGrad.addColorStop(1, '#ca8a04'); // yellow-600
  ctx.strokeStyle = goldGrad;
  ctx.strokeRect(20, 20, width - 40, height - 40);

  // 内側の細い二重枠
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(254, 240, 138, 0.4)';
  ctx.strokeRect(26, 26, width - 52, height - 52);
  ctx.restore();

  // 3. 上部ヘッダー（HALL OF FAME 紋章バナー）
  ctx.save();
  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 16px "Noto Sans JP", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🏛️ TURFTALK HALL OF FAME 🏛️', width / 2, 60);

  ctx.fillStyle = 'rgba(209, 250, 229, 0.7)';
  ctx.font = '12px "Noto Sans JP", sans-serif';
  ctx.fillText('歴代殿堂入り愛馬アーカイブ', width / 2, 80);
  ctx.restore();

  // 4. 世代 & 路線 & 毛色バッジ
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = 'bold 15px "Noto Sans JP", sans-serif';
  ctx.fillStyle = '#6ee7b7'; // emerald-300
  ctx.fillText(`第${horse.generation}世代  •  ${horse.routeName}  •  ${horse.color}`, width / 2, 125);
  ctx.restore();

  // 5. 授与された二つ名・称号（ゴールド帯）
  ctx.save();
  const titleBoxY = 145;
  const titleBoxHeight = 38;
  const titleBoxWidth = 520;
  const titleBoxX = (width - titleBoxWidth) / 2;

  // 称号ボックスの背景
  ctx.fillStyle = 'rgba(234, 179, 8, 0.15)';
  ctx.fillRect(titleBoxX, titleBoxY, titleBoxWidth, titleBoxHeight);
  ctx.strokeStyle = '#eab308';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(titleBoxX, titleBoxY, titleBoxWidth, titleBoxHeight);

  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 20px "Noto Sans JP", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`👑 【 ${horse.titleName} 】`, width / 2, titleBoxY + titleBoxHeight / 2);
  ctx.restore();

  // 6. 馬名（中央大フォント）
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 42px "Noto Sans JP", sans-serif';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = 8;
  ctx.fillText(horse.name, width / 2, 240);
  ctx.restore();

  // 7. 実績サマリー枠（戦績 & 習得フレーズ数）
  ctx.save();
  const statBoxY = 270;
  const statBoxWidth = 560;
  const statBoxHeight = 60;
  const statBoxX = (width - statBoxWidth) / 2;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.fillRect(statBoxX, statBoxY, statBoxWidth, statBoxHeight);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1;
  ctx.strokeRect(statBoxX, statBoxY, statBoxWidth, statBoxHeight);

  // 戦績
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = '13px "Noto Sans JP", sans-serif';
  ctx.fillText('通算戦績', statBoxX + statBoxWidth * 0.25, statBoxY + 22);

  ctx.fillStyle = '#fde047';
  ctx.font = 'bold 22px "Noto Sans JP", sans-serif';
  ctx.fillText(`${horse.totalRaces}戦 ${horse.wins}勝`, statBoxX + statBoxWidth * 0.25, statBoxY + 48);

  // 区切り線
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.beginPath();
  ctx.moveTo(width / 2, statBoxY + 10);
  ctx.lineTo(width / 2, statBoxY + statBoxHeight - 10);
  ctx.stroke();

  // 習得英語フレーズ
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = '13px "Noto Sans JP", sans-serif';
  ctx.fillText('習得英語フレーズ', statBoxX + statBoxWidth * 0.75, statBoxY + 22);

  ctx.fillStyle = '#6ee7b7';
  ctx.font = 'bold 22px "Noto Sans JP", sans-serif';
  ctx.fillText(`${horse.learnedCount} 問マスター`, statBoxX + statBoxWidth * 0.75, statBoxY + 48);
  ctx.restore();

  // 8. 獲得タイトルバッジ一覧
  ctx.save();
  ctx.textAlign = 'center';
  if (horse.titles.length > 0) {
    const titlesText = horse.titles.slice(0, 3).map((t) => `🏆 ${t}`).join('   ');
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 15px "Noto Sans JP", sans-serif';
    ctx.fillText(titlesText, width / 2, 365);
  } else {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '14px "Noto Sans JP", sans-serif';
    ctx.fillText('果敢なる挑戦と完走の証', width / 2, 365);
  }
  ctx.restore();

  // 9. フッター（引退日 & ブランドロゴ）
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = '12px "Noto Sans JP", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`引退登録: ${horse.retiredDate}`, 40, height - 35);

  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(110, 231, 183, 0.8)';
  ctx.fillText('TurfTalk • 競馬英語マイクロラーニング', width - 40, height - 35);
  ctx.restore();

  return canvas.toDataURL('image/png');
}

/**
 * 殿堂入りカード画像をダウンロード
 */
export async function downloadHallOfFameCard(
  horse: HallOfFameHorse,
  filename?: string
): Promise<void> {
  const dataUrl = await generateHallOfFameCardDataUrl(horse);
  if (!dataUrl || typeof document === 'undefined') return;

  const link = document.createElement('a');
  link.download = filename || `turftalk-hall-of-fame-gen${horse.generation}-${horse.name}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * デバッグ用サンプル殿堂入り馬データ
 */
export function createSampleHallOfFameHorses(): HallOfFameHorse[] {
  return [
    {
      id: 'sample-hof-1',
      generation: 1,
      name: 'ターフスター',
      color: '鹿毛',
      routeId: 'classic-colt',
      routeName: '3歳牡馬クラシック路線',
      retiredDate: '2026-10-25',
      wins: 4,
      totalRaces: 4,
      titles: ['メイクデビュー 制覇', '弥生賞 制覇', '日本ダービー 制覇', '凱旋門賞 制覇'],
      learnedCount: 12,
      titleName: '不敗の世界覇者',
      raceHistory: [
        { week: 1, raceName: 'メイクデビュー', score: 5, placementText: '1着 🥇 (優勝)' },
        { week: 2, raceName: '弥生賞 (G2)', score: 5, placementText: '1着 🥇 (優勝)' },
        { week: 3, raceName: '日本ダービー (G1)', score: 5, placementText: '1着 🥇 (優勝)' },
        { week: 4, raceName: '凱旋門賞 (世界G1)', score: 5, placementText: '1着 🥇 (優勝)' },
      ],
    },
    {
      id: 'sample-hof-2',
      generation: 2,
      name: 'クリスタルクラウン',
      color: '芦毛',
      routeId: 'classic-filly',
      routeName: '3歳牝馬クラシック路線',
      retiredDate: '2026-11-01',
      wins: 3,
      totalRaces: 4,
      titles: ['優駿牝馬/オークス 制覇', 'チューリップ賞 制覇'],
      learnedCount: 10,
      titleName: 'ターフに咲く優駿の女王',
      raceHistory: [
        { week: 1, raceName: 'メイクデビュー', score: 4, placementText: '2着 🥈' },
        { week: 2, raceName: 'チューリップ賞 (G2)', score: 5, placementText: '1着 🥇 (優勝)' },
        { week: 3, raceName: '優駿牝馬/オークス (G1)', score: 5, placementText: '1着 🥇 (優勝)' },
        { week: 4, raceName: 'オペラ賞 (世界牝馬G1)', score: 4, placementText: '2着 🥈' },
      ],
    },
  ];
}
