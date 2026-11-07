import { useEffect, useRef, useState, type FC } from 'react';
import type { HorseCoatColor } from '../types';
import {
  getHorseImageUrl,
  getBackgroundImageUrl,
  resolveStaticSceneBackground,
  STATIC_ILLUSTRATION_WIDTH,
  STATIC_ILLUSTRATION_HEIGHT,
  applyStaticSceneFloodFillTransparency,
  type StaticHorseSceneType,
} from '../lib/horseAssets';

interface HorseIllustrationProps {
  color: HorseCoatColor;
  scene: StaticHorseSceneType;
  alt?: string;
  className?: string;
  priority?: boolean;
}

const SCENE_LABEL_MAP: Record<StaticHorseSceneType, string> = {
  standing_left: '公式立ち絵',
  training_complete: '調教完了立ち絵',
  race_victory: 'レース勝利立ち絵',
  race_cooldown: 'レース惜敗・息整え立ち絵',
};

const SCENE_LOCATION_BADGE_MAP: Record<StaticHorseSceneType, string> = {
  standing_left: '牧場パドック',
  training_complete: 'トレセン厩舎',
  race_victory: 'ウィナーズサークル',
  race_cooldown: 'クールダウン馬房',
};

export const HorseIllustration: FC<HorseIllustrationProps> = ({
  color,
  scene,
  alt,
  className = '',
  priority = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isHorseReady, setIsHorseReady] = useState(false);
  const [hasCanvasError, setHasCanvasError] = useState(false);

  const imageUrl = getHorseImageUrl(color, scene);
  const bgType = resolveStaticSceneBackground(scene);
  const bgImageUrl = getBackgroundImageUrl(bgType);
  const defaultAlt = `${color}の愛馬（${SCENE_LABEL_MAP[scene]}）`;

  useEffect(() => {
    let isCancelled = false;
    setIsHorseReady(false);
    setHasCanvasError(false);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;

    img.onload = () => {
      if (isCancelled) return;
      try {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          setHasCanvasError(true);
          setIsHorseReady(true);
          return;
        }

        ctx.clearRect(0, 0, STATIC_ILLUSTRATION_WIDTH, STATIC_ILLUSTRATION_HEIGHT);
        ctx.drawImage(
          img,
          0,
          0,
          STATIC_ILLUSTRATION_WIDTH,
          STATIC_ILLUSTRATION_HEIGHT
        );

        const imgData = ctx.getImageData(
          0,
          0,
          STATIC_ILLUSTRATION_WIDTH,
          STATIC_ILLUSTRATION_HEIGHT
        );
        applyStaticSceneFloodFillTransparency(
          imgData.data,
          STATIC_ILLUSTRATION_WIDTH,
          STATIC_ILLUSTRATION_HEIGHT,
          scene
        );
        ctx.putImageData(imgData, 0, 0);
        setIsHorseReady(true);
      } catch (err) {
        console.error('Failed to process static horse illustration:', err);
        setHasCanvasError(true);
        setIsHorseReady(true);
      }
    };

    img.onerror = () => {
      if (!isCancelled) {
        setHasCanvasError(true);
        setIsHorseReady(true);
      }
    };

    return () => {
      isCancelled = true;
    };
  }, [imageUrl, scene]);

  return (
    <div
      className={`relative overflow-hidden bg-stone-800 rounded-xl select-none ${className}`}
      style={{ aspectRatio: '1376 / 768' }}
    >
      {/* 背面のシーン別背景イラスト（牧場 / 厩舎 / ウィナーズサークル） */}
      <img
        src={bgImageUrl}
        alt=""
        aria-hidden="true"
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
      />

      {/* 馬体が背景から浮き立つための微細な下部ビネット */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-t from-black/20 via-transparent to-black/10 pointer-events-none"
      />

      {!isHorseReady && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/25 backdrop-blur-[1px] text-[11px] font-semibold text-white/90">
          読み込み中...
        </div>
      )}

      {/* 白背景を透過した競走馬立ち絵レイヤー */}
      {hasCanvasError ? (
        <img
          src={imageUrl}
          alt={alt ?? defaultAlt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          className="relative z-10 w-full h-full object-contain"
        />
      ) : (
        <canvas
          ref={canvasRef}
          width={STATIC_ILLUSTRATION_WIDTH}
          height={STATIC_ILLUSTRATION_HEIGHT}
          role="img"
          aria-label={alt ?? defaultAlt}
          className={`relative z-10 w-full h-full object-contain transition-opacity duration-300 drop-shadow-[0_4px_6px_rgba(0,0,0,0.35)] ${
            isHorseReady ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {/* シーンロケーションラベル */}
      <div className="absolute top-2 left-2 z-20 pointer-events-none">
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm bg-black/50 text-amber-100/95 backdrop-blur-2xs border border-amber-300/30 shadow-2xs tracking-wide">
          {SCENE_LOCATION_BADGE_MAP[scene]}
        </span>
      </div>
    </div>
  );
};
