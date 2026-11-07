import { useState, type FC } from 'react';
import type { HorseCoatColor } from '../types';
import { getHorseImageUrl, type HorseSceneType } from '../lib/horseAssets';

interface HorseIllustrationProps {
  color: HorseCoatColor;
  scene: Extract<HorseSceneType, 'standing_left' | 'training_complete' | 'race_victory' | 'race_cooldown'>;
  alt?: string;
  className?: string;
  priority?: boolean;
}

const SCENE_LABEL_MAP: Record<HorseIllustrationProps['scene'], string> = {
  standing_left: '公式立ち絵',
  training_complete: '調教完了立ち絵',
  race_victory: 'レース勝利立ち絵',
  race_cooldown: 'レース惜敗・息整え立ち絵',
};

export const HorseIllustration: FC<HorseIllustrationProps> = ({
  color,
  scene,
  alt,
  className = '',
  priority = false,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const imageUrl = getHorseImageUrl(color, scene);
  const defaultAlt = `${color}の愛馬（${SCENE_LABEL_MAP[scene]}）`;

  return (
    <div
      className={`relative overflow-hidden bg-zinc-100/80 rounded-xl select-none ${className}`}
      style={{ aspectRatio: '1376 / 768' }}
    >
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-200/50 animate-pulse text-[11px] text-zinc-400">
          読み込み中...
        </div>
      )}
      <img
        src={imageUrl}
        alt={alt ?? defaultAlt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
};
