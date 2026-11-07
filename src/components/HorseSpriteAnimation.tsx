import { useEffect, useRef, useState, type FC } from 'react';
import type { HorseCoatColor, TrainingCourse } from '../types';
import {
  getHorseImageUrl,
  getBackgroundImageUrl,
  resolveGallopSceneBackground,
  SPRITE_FRAME_WIDTH,
  SPRITE_FRAME_HEIGHT,
  SPRITE_TOTAL_FRAMES,
  SPRITE_COLS,
  applyFrameFloodFillTransparency,
} from '../lib/horseAssets';

interface HorseSpriteAnimationProps {
  color: HorseCoatColor;
  scene: 'training_gallop' | 'race_gallop';
  courseType?: TrainingCourse;
  raceSurface?: 'turf' | 'dirt' | 'jump';
  className?: string;
}

const FRAME_WIDTH = SPRITE_FRAME_WIDTH;
const FRAME_HEIGHT = SPRITE_FRAME_HEIGHT;
const TOTAL_FRAMES = SPRITE_TOTAL_FRAMES;
const COLS = SPRITE_COLS;
const FRAME_INTERVAL_MS = 85; // 約11.7 FPS（自然なギャロップ速度）

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
    applyFrameFloodFillTransparency(imgData.data, FRAME_WIDTH, FRAME_HEIGHT, f, isTraining);

    frames.push(imgData);
  }

  return frames;
}

export const HorseSpriteAnimation: FC<HorseSpriteAnimationProps> = ({
  color,
  scene,
  courseType = 'uphill',
  raceSurface = 'turf',
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [frames, setFrames] = useState<ImageData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const frameIndexRef = useRef(0);
  const animationTimerRef = useRef<number | null>(null);

  const imageUrl = getHorseImageUrl(color, scene);
  const isTraining = scene === 'training_gallop';
  const bgType = resolveGallopSceneBackground(scene, courseType, raceSurface);
  const bgImageUrl = getBackgroundImageUrl(bgType);

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
  const isDirtRace = isRace && raceSurface === 'dirt';
  const isWoodchip = courseType === 'woodchip';

  const courseLabel = isRace
    ? isDirtRace
      ? '本馬場ダート'
      : '本馬場ターフ'
    : isWoodchip
    ? 'ウッドチップコース'
    : '栗東・美浦坂路';

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden shadow-sm border select-none ${
        isDirtRace
          ? 'bg-amber-950 border-amber-700/60'
          : isRace
          ? 'bg-emerald-950 border-emerald-700/60'
          : isWoodchip
          ? 'bg-stone-900 border-amber-700/50'
          : 'bg-emerald-950 border-emerald-700/50'
      } ${className}`}
      style={{ minHeight: '120px' }}
    >
      {/* 背景イラストレイヤー（坂路 / ウッドチップ / 芝本馬場 / ダート本馬場） */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <img
          src={bgImageUrl}
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover object-center"
        />

        {/* 馬体輪郭を引き立てる微細なコントラストオーバーレイ */}
        <div className="absolute inset-0 bg-linear-to-t from-black/25 via-transparent to-black/15" />

        {/* スピードライン（疾走風エフェクト） */}
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full bg-[repeating-linear-gradient(90deg,transparent,transparent_40px,rgba(255,255,255,0.18)_40px,rgba(255,255,255,0.18)_45px)] animate-pulse" />
        </div>
      </div>

      {/* スプライトCanvas本体 */}
      <div className="relative z-10 flex items-center justify-center p-1.5 h-full">
        {isLoading && (
          <div className="flex items-center justify-center text-xs text-white/90 py-8 gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>愛馬スタンバイ中...</span>
          </div>
        )}
        <canvas
          ref={canvasRef}
          width={FRAME_WIDTH}
          height={FRAME_HEIGHT}
          className={`w-full max-w-[290px] sm:max-w-[330px] h-auto object-contain transition-opacity duration-300 drop-shadow-[0_3px_5px_rgba(0,0,0,0.4)] ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          aria-label={`${color}の愛馬疾走アニメーション`}
        />
      </div>

      {/* コース情報バッジ */}
      <div className="absolute top-2 left-2 z-20 pointer-events-none">
        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-sm bg-black/55 text-amber-100/95 backdrop-blur-2xs border border-amber-300/30 shadow-2xs tracking-wide">
          {courseLabel}
        </span>
      </div>
    </div>
  );
};
