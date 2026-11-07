import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import {
  HORSE_COAT_KEY_MAP,
  REVERSE_HORSE_COAT_KEY_MAP,
  getHorseImageUrl,
  getCoatKey,
  SPRITE_FRAME_WIDTH,
  SPRITE_FRAME_HEIGHT,
  SPRITE_TOTAL_FRAMES,
  TRAINING_REINS_SEEDS,
  RACE_REINS_SEEDS,
  CROSSED_HIND_LEGS_SEEDS,
  isProtectedWhiteSaddleCloth,
  applyFrameFloodFillTransparency,
  type HorseSceneType,
} from '../src/lib/horseAssets.ts';
import type { HorseCoatColor } from '../src/types/index.ts';

test('horse assets: coat key mappings cover all 8 JRA coat colors', () => {
  const expectedColors: HorseCoatColor[] = [
    '鹿毛',
    '栗毛',
    '黒鹿毛',
    '芦毛',
    '青鹿毛',
    '青毛',
    '栃栗毛',
    '白毛',
  ];

  assert.strictEqual(Object.keys(HORSE_COAT_KEY_MAP).length, 8);
  for (const color of expectedColors) {
    const key = HORSE_COAT_KEY_MAP[color];
    assert.ok(key, `Coat key must exist for ${color}`);
    assert.strictEqual(REVERSE_HORSE_COAT_KEY_MAP[key], color);
    assert.strictEqual(getCoatKey(color), key);
  }
});

test('horse assets: image URL resolution for all 8 coat colors and 6 scenes', () => {
  const colors: HorseCoatColor[] = [
    '鹿毛',
    '栗毛',
    '黒鹿毛',
    '芦毛',
    '青鹿毛',
    '青毛',
    '栃栗毛',
    '白毛',
  ];

  const scenes: HorseSceneType[] = [
    'standing_left',
    'training_gallop',
    'training_complete',
    'race_gallop',
    'race_victory',
    'race_cooldown',
  ];

  for (const color of colors) {
    const coatKey = HORSE_COAT_KEY_MAP[color];
    for (const scene of scenes) {
      const url = getHorseImageUrl(color, scene);
      assert.ok(url.includes(`${coatKey}_${scene}.jpg`), `URL should contain ${coatKey}_${scene}.jpg, got: ${url}`);
    }
  }
});

test('horse assets: verify all 48 asset files (8 coats * 6 scenes) exist on disk', () => {
  const colors: HorseCoatColor[] = [
    '鹿毛',
    '栗毛',
    '黒鹿毛',
    '芦毛',
    '青鹿毛',
    '青毛',
    '栃栗毛',
    '白毛',
  ];

  const scenes: HorseSceneType[] = [
    'standing_left',
    'training_gallop',
    'training_complete',
    'race_gallop',
    'race_victory',
    'race_cooldown',
  ];

  const assetsDir = path.resolve(process.cwd(), 'src/assets/horses');
  assert.ok(fs.existsSync(assetsDir), 'src/assets/horses directory must exist');

  let verifiedCount = 0;
  for (const color of colors) {
    const coatKey = HORSE_COAT_KEY_MAP[color];
    for (const scene of scenes) {
      const fileName = `${coatKey}_${scene}.jpg`;
      const filePath = path.join(assetsDir, fileName);
      assert.ok(fs.existsSync(filePath), `Asset file ${fileName} must exist`);
      const stat = fs.statSync(filePath);
      assert.ok(stat.size > 1000, `Asset file ${fileName} should not be empty (size: ${stat.size} bytes)`);
      verifiedCount++;
    }
  }

  assert.strictEqual(verifiedCount, 48, 'Exactly 48 horse visual asset files must be verified');
});

test('sprite transparency: white saddle cloth guard protects only actual cloth interior and never blocks area above saddle', () => {
  // 鞍の周囲・背中より上の背景領域 (Y = 80..100) は保護対象外であり透過されるべき
  for (let x = 175; x <= 320; x += 15) {
    for (let y = 80; y <= 100; y += 5) {
      assert.strictEqual(
        isProtectedWhiteSaddleCloth(x, y, true),
        false,
        `Area above back/saddle (${x}, ${y}) must NOT be blocked from transparency`
      );
    }
  }

  // 実際の白ゼッケン内部 (X: 228..276, Y: 105..150) は平日調教時のみ保護される
  assert.strictEqual(isProtectedWhiteSaddleCloth(250, 125, true), true);
  assert.strictEqual(isProtectedWhiteSaddleCloth(228, 105, true), true);
  assert.strictEqual(isProtectedWhiteSaddleCloth(276, 150, true), true);
  assert.strictEqual(isProtectedWhiteSaddleCloth(250, 125, false), false);
});

test('sprite transparency: pinpoint closed-region seeds are defined for all 6 frames', () => {
  assert.strictEqual(TRAINING_REINS_SEEDS.length, SPRITE_TOTAL_FRAMES);
  assert.strictEqual(RACE_REINS_SEEDS.length, SPRITE_TOTAL_FRAMES);
  assert.strictEqual(CROSSED_HIND_LEGS_SEEDS.length, SPRITE_TOTAL_FRAMES);

  assert.strictEqual(CROSSED_HIND_LEGS_SEEDS[0], null);
  assert.strictEqual(CROSSED_HIND_LEGS_SEEDS[1], null);
  assert.deepStrictEqual(CROSSED_HIND_LEGS_SEEDS[2], [195, 225]);
  assert.deepStrictEqual(CROSSED_HIND_LEGS_SEEDS[3], [199, 222]);
  assert.strictEqual(CROSSED_HIND_LEGS_SEEDS[4], null);
  assert.strictEqual(CROSSED_HIND_LEGS_SEEDS[5], null);
});

test('sprite transparency: clears background around saddle in training and keeps white coat opaque in race/training', () => {
  const w = SPRITE_FRAME_WIDTH;
  const h = SPRITE_FRAME_HEIGHT;

  // ヘルパー: 矩形の黒主線枠 (1px) の内側を指定色で塗る
  const drawOutlinedBox = (
    buf: Uint8ClampedArray,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    fillRgb: [number, number, number]
  ) => {
    for (let y = y1; y <= y2; y++) {
      for (let x = x1; x <= x2; x++) {
        const idx = (y * w + x) * 4;
        const isBorder = x === x1 || x === x2 || y === y1 || y === y2;
        if (isBorder) {
          buf[idx] = 20;
          buf[idx + 1] = 17;
          buf[idx + 2] = 15;
          buf[idx + 3] = 255;
        } else {
          buf[idx] = fillRgb[0];
          buf[idx + 1] = fillRgb[1];
          buf[idx + 2] = fillRgb[2];
          buf[idx + 3] = 255;
        }
      }
    }
  };

  for (const isTraining of [true, false]) {
    // Frame 2 (交差脚閉空間あり) を模擬したRGBAバッファを作成
    const frameIdx = 2;
    const data = new Uint8ClampedArray(w * h * 4);
    // 全面を純白背景 (255, 255, 255, 255) で初期化
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = 255;
    }

    // 白毛の胴体 (X: 160..350, Y: 100..175) を黒主線 + 白毛ベース被毛 (#F7F9FC = 247, 249, 252) で描画
    drawOutlinedBox(data, 160, 100, 350, 175, [247, 249, 252]);

    // 白毛の首・頭部 (X: 350..388, Y: 72..135) を黒主線 + 白毛たてがみ色 (#F2F5FA = 242, 245, 250) で描画
    drawOutlinedBox(data, 350, 72, 388, 135, [242, 245, 250]);

    // 白毛の脚 (X: 210..240, Y: 180..320) を黒主線 + 白毛ベース被毛 (#F7F9FC) で描画
    drawOutlinedBox(data, 210, 180, 240, 320, [247, 249, 252]);

    // 閉領域①: 手綱と首の間の三角形閉空間 (シード座標を含む小ボックス、内部は白背景)
    const reinsSeed = isTraining ? TRAINING_REINS_SEEDS[frameIdx] : RACE_REINS_SEEDS[frameIdx];
    drawOutlinedBox(data, reinsSeed[0] - 5, reinsSeed[1] - 4, reinsSeed[0] + 5, reinsSeed[1] + 4, [255, 255, 255]);

    // 閉領域②: 交差する後肢間の閉空間 (Frame 2 シード座標 (195, 225) を含む小ボックス、内部は白背景)
    const legSeed = CROSSED_HIND_LEGS_SEEDS[frameIdx]!;
    drawOutlinedBox(data, legSeed[0] - 4, legSeed[1] - 6, legSeed[0] + 4, legSeed[1] + 6, [255, 255, 255]);

    applyFrameFloodFillTransparency(data, w, h, frameIdx, isTraining);

    const getAlpha = (x: number, y: number) => data[(y * w + x) * 4 + 3];

    // 1. 鞍の周囲・背中より上の外側背景 (Y = 85, X = 180..310) が完全に透過されていること
    assert.strictEqual(getAlpha(185, 85), 0, 'Background behind saddle (185, 85) must be transparent');
    assert.strictEqual(getAlpha(250, 85), 0, 'Background above saddle (250, 85) must be transparent');
    assert.strictEqual(getAlpha(310, 85), 0, 'Background in front of saddle (310, 85) must be transparent');

    // 2. 白毛の胴体・首・脚の内部が透けずに不透明 (alpha = 255) のまま維持されていること
    assert.strictEqual(getAlpha(200, 130), 255, 'White horse body (200, 130) must remain opaque');
    assert.strictEqual(getAlpha(250, 125), 255, 'Saddle cloth / body center (250, 125) must remain opaque');
    assert.strictEqual(getAlpha(370, 95), 255, 'White horse neck (370, 95) must remain opaque');
    assert.strictEqual(getAlpha(225, 250), 255, 'White horse leg (225, 250) must remain opaque');

    // 3. 手綱間・交差脚間の閉空間はピンポイントシードにより透過 (alpha = 0) されていること
    assert.strictEqual(getAlpha(reinsSeed[0], reinsSeed[1]), 0, 'Reins closed space must be transparent');
    assert.strictEqual(getAlpha(legSeed[0], legSeed[1]), 0, 'Crossed legs closed space must be transparent');
  }
});
