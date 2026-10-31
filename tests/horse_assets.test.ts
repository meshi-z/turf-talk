import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import {
  HORSE_COAT_KEY_MAP,
  REVERSE_HORSE_COAT_KEY_MAP,
  getHorseImageUrl,
  getCoatKey,
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
