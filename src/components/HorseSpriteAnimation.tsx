import { useEffect, useRef, useState, type FC } from 'react';
import type { HorseCoatColor, TrainingCourse } from '../types';
import { getHorseImageUrl } from '../lib/horseAssets';

interface HorseSpriteAnimationProps {
  color: HorseCoatColor;
  scene: 'training_gallop' | 'race_gallop';
  courseType?: TrainingCourse;
  className?: string;
}

const FRAME_WIDTH = 500;
const FRAME_HEIGHT = 360;
const TOTAL_FRAMES = 6;
const COLS = 3;
const FRAME_INTERVAL_MS = 85; // 約11.7 FPS（自然なギャロップ速度）

// 外周および閉領域フラッドフィル用の判定
function isWhiteLike(r: number, g: number, b: number): boolean {
  return r >= 232 && g >= 232 && b >= 232;
}

function isBoundaryBlack(r: number, g: number, b: number): boolean {
  return r < 70 && g < 70 && b < 70;
}

/**
 * 6コマのスプライトシートから各コマの白背景を透過した ImageData を作成する
 */
function processTransparentFrames(image: HTMLImageElement, isTraining: boolean): ImageData[] {
  const canvas = document.createElement('canvas');
  canvas.width = FRAME_WIDTH;
  canvas.height = FRAME_HEIGHT;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return [];

  const frames: ImageData[] = [];

  for (let f = 0; f < TOTAL_FRAMES; f++) {
    const col = f % COLS;
    const row = Math.floor(f / COLS);
    const sx = col * FRAME_WIDTH;
    const sy = row * FRAME_HEIGHT;

    ctx.clearRect(0, 0, FRAME_WIDTH, FRAME_HEIGHT);
    ctx.drawImage(image, sx, sy, FRAME_WIDTH, FRAME_HEIGHT, 0, 0, FRAME_WIDTH, FRAME_HEIGHT);

    const imgData = ctx.getImageData(0, 0, FRAME_WIDTH, FRAME_HEIGHT);
    const data = imgData.data;
    const visited = new Uint8Array(FRAME_WIDTH * FRAME_HEIGHT);

    // フラッドフィル関数（キュー方式）
    const floodFill = (startX: number, startY: number) => {
      if (startX < 0 || startX >= FRAME_WIDTH || startY < 0 || startY >= FRAME_HEIGHT) return;
      const startIdx = startY * FRAME_WIDTH + startX;
      if (visited[startIdx]) return;

      const pIdx = startIdx * 4;
      if (!isWhiteLike(data[pIdx], data[pIdx + 1], data[pIdx + 2])) return;

      const queue: number[] = [startIdx];
      visited[startIdx] = 1;

      while (queue.length > 0) {
        const curr = queue.pop()!;
        const cx = curr % FRAME_WIDTH;
        const cy = Math.floor(curr / FRAME_WIDTH);
        const cp = curr * 4;

        // 白ゼッケン保護（平日調教時: X: 175..320, Y: 80..165）
        if (isTraining && cx >= 175 && cx <= 320 && cy >= 80 && cy <= 165) {
          continue;
        }

        // 透明化
        data[cp + 3] = 0;

        // 4近傍走査
        const neighbors = [
          cy > 0 ? (cy - 1) * FRAME_WIDTH + cx : -1,
          cy < FRAME_HEIGHT - 1 ? (cy + 1) * FRAME_WIDTH + cx : -1,
          cx > 0 ? cy * FRAME_WIDTH + (cx - 1) : -1,
          cx < FRAME_WIDTH - 1 ? cy * FRAME_WIDTH + (cx + 1) : -1,
        ];

        for (const n of neighbors) {
          if (n === -1 || visited[n]) continue;
          const np = n * 4;
          const nr = data[np];
          const ng = data[np + 1];
          const nb = data[np + 2];

          // 黒主線や馬体色でなければ白背景として透過伝播
          if (!isBoundaryBlack(nr, ng, nb) && isWhiteLike(nr, ng, nb)) {
            visited[n] = 1;
            queue.push(n);
          }
        }
      }
    };

    // 1. 外周4辺の全ピクセルからフラッドフィル
    for (let x = 0; x < FRAME_WIDTH; x++) {
      floodFill(x, 0);
      floodFill(x, FRAME_HEIGHT - 1);
    }
    for (let y = 0; y < FRAME_HEIGHT; y++) {
      floodFill(0, y);
      floodFill(FRAME_WIDTH - 1, y);
    }

    // 2. 閉領域シードのフラッドフィル（仕様書 Section 3-②）
    // A. 首・手綱の間の三角形空間 (X: 355..430, Y: 70..140)
    for (let x = 360; x <= 425; x += 5) {
      for (let y = 75; y <= 135; y += 5) {
        floodFill(x, y);
      }
    }

    // B. 交差脚間の閉空間 (Y >= 180)
    for (let x = 120; x <= 400; x += 8) {
      for (let y = 185; y <= 340; y += 8) {
        floodFill(x, y);
      }
    }

    frames.push(imgData);
  }

  return frames;
}

export const HorseSpriteAnimation: FC<HorseSpriteAnimationProps> = ({
  color,
  scene,
  courseType = 'uphill',
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [frames, setFrames] = useState<ImageData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const frameIndexRef = useRef(0);
  const animationTimerRef = useRef<number | null>(null);

  const imageUrl = getHorseImageUrl(color, scene);
  const isTraining = scene === 'training_gallop';

  // 画像のロードと透過フレームの生成
  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;

    img.onload = () => {
      if (isCancelled) return;
      try {
        const processed = processTransparentFrames(img, isTraining);
        if (!isCancelled && processed.length === TOTAL_FRAMES) {
          setFrames(processed);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to process horse sprite frames:', err);
        setIsLoading(false);
      }
    };

    img.onerror = () => {
      if (!isCancelled) {
        setIsLoading(false);
      }
    };

    return () => {
      isCancelled = true;
    };
  }, [imageUrl, isTraining]);

  // アニメーションループの実行
  useEffect(() => {
    if (frames.length !== TOTAL_FRAMES) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const animate = (time: number) => {
      if (time - lastTime >= FRAME_INTERVAL_MS) {
        lastTime = time;
        frameIndexRef.current = (frameIndexRef.current + 1) % TOTAL_FRAMES;

        const currentFrame = frames[frameIndexRef.current];
        if (currentFrame) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.putImageData(currentFrame, 0, 0);
        }
      }
      animationTimerRef.current = requestAnimationFrame(animate);
    };

    // 初期フレーム描画
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.putImageData(frames[0], 0, 0);

    animationTimerRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationTimerRef.current) {
        cancelAnimationFrame(animationTimerRef.current);
      }
    };
  }, [frames]);

  // 背景コーススタイルの決定
  const isRace = scene === 'race_gallop';
  const isWoodchip = courseType === 'woodchip';

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden shadow-xs border select-none ${
        isRace
          ? 'bg-linear-to-r from-emerald-800 via-green-700 to-emerald-900 border-emerald-600/50'
          : isWoodchip
          ? 'bg-linear-to-r from-amber-900 via-stone-800 to-amber-950 border-amber-700/50'
          : 'bg-linear-to-r from-emerald-900 via-teal-800 to-emerald-950 border-emerald-600/40'
      } ${className}`}
      style={{ minHeight: '110px' }}
    >
      {/* 背景装飾: コース演出（ターフ／坂路／ウッドチップ） */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* コース地面 */}
        <div
          className={`absolute bottom-0 inset-x-0 h-9 ${
            isRace
              ? 'bg-linear-to-t from-emerald-950 to-emerald-600/70 border-t border-emerald-400/30'
              : isWoodchip
              ? 'bg-linear-to-t from-stone-950 to-amber-800/80 border-t border-amber-500/30'
              : 'bg-linear-to-t from-zinc-950 to-teal-800/70 border-t border-emerald-400/20'
          }`}
        />

        {/* コースラチ・白線フェンス */}
        <div className="absolute bottom-8 inset-x-0 h-1 bg-white/20 border-b border-white/40" />

        {/* スピードライン（疾走風エフェクト） */}
        <div className="absolute inset-0 opacity-25">
          <div className="w-full h-full bg-[repeating-linear-gradient(90deg,transparent,transparent_40px,rgba(255,255,255,0.15)_40px,rgba(255,255,255,0.15)_45px)] animate-pulse" />
        </div>
      </div>

      {/* スプライトCanvas本体 */}
      <div className="relative z-10 flex items-center justify-center p-1.5 h-full">
        {isLoading && (
          <div className="flex items-center justify-center text-xs text-white/80 py-8 gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>愛馬スタンバイ中...</span>
          </div>
        )}
        <canvas
          ref={canvasRef}
          width={FRAME_WIDTH}
          height={FRAME_HEIGHT}
          className={`w-full max-w-[280px] sm:max-w-[320px] h-auto object-contain transition-opacity duration-300 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          aria-label={`${color}の愛馬疾走アニメーション`}
        />
      </div>

      {/* コース情報バッジ */}
      <div className="absolute top-2 left-2 z-20 pointer-events-none">
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/40 text-white/90 backdrop-blur-2xs border border-white/20 shadow-2xs">
          {isRace ? '🏇 本馬場ターフ' : isWoodchip ? '🪵 ウッドチップコース' : '🌿 栗東・美浦坂路'}
        </span>
      </div>
    </div>
  );
};
