import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  APP_SITE_URL,
  generateTrainingShareText,
  generateRaceShareText,
  generateTwitterShareUrl,
  copyShareTextToClipboard,
} from '../src/lib/share.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');

function readPngDimensions(filePath: string): { width: number; height: number } {
  const buf = fs.readFileSync(filePath);
  const signature = buf.subarray(0, 8).toString('hex');
  assert.equal(signature, '89504e470d0a1a0a', `${path.basename(filePath)} should have a valid PNG signature`);
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  return { width, height };
}

test('share: APP_SITE_URL is defined and points to GitHub Pages', () => {
  assert.equal(APP_SITE_URL, 'https://meshi-z.github.io/turf-talk/');
});

test('share: generateTrainingShareText produces concise, accurate Japanese text under 120 chars', () => {
  // Perfect score with uphill course
  const text1 = generateTrainingShareText({
    horseName: 'サクラバクシンオー',
    score: 3,
    totalQuestions: 3,
    streakDays: 14,
    condition: 'peak',
    course: 'uphill',
  });

  assert.match(text1, /🏇 TurfTalk 調教完了！/);
  assert.match(text1, /サクラバクシンオー/);
  assert.match(text1, /坂路/);
  assert.match(text1, /3\/3問 満点💮/);
  assert.match(text1, /連続: 14日/);
  assert.match(text1, /絶好調 ⤴/);
  assert.match(text1, /#TurfTalk #競馬英語/);
  assert.match(text1, new RegExp(APP_SITE_URL));
  assert.ok(text1.length <= 120, `Training share text length (${text1.length}) should be <= 120 chars`);

  // Partial score with woodchip course
  const text2 = generateTrainingShareText({
    horseName: 'ディープインパクト',
    score: 2,
    totalQuestions: 3,
    streakDays: 5,
    condition: 'up',
    course: 'woodchip',
  });

  assert.match(text2, /ウッド/);
  assert.match(text2, /2\/3問/);
  assert.match(text2, /好調 ↗/);
  assert.ok(text2.length <= 120);
});

test('share: generateRaceShareText generates stage, placement, and score text under 120 chars', () => {
  // 1st place victory
  const text1 = generateRaceShareText({
    horseName: 'オグリキャップ',
    generation: 2,
    week: 4,
    raceName: '凱旋門賞',
    placementRank: 1,
    score: 5,
    totalQuestions: 5,
  });

  assert.match(text1, /🏁 TurfTalk 週末レース結果！/);
  assert.match(text1, /W4「凱旋門賞」/);
  assert.match(text1, /第2世代「オグリキャップ」/);
  assert.match(text1, /1着 🏆/);
  assert.match(text1, /5\/5問/);
  assert.match(text1, /#TurfTalk #競馬英語/);
  assert.match(text1, new RegExp(APP_SITE_URL));
  assert.ok(text1.length <= 120, `Race victory share text length (${text1.length}) should be <= 120 chars`);

  // 2nd place
  const text2 = generateRaceShareText({
    horseName: 'トウカイテイオー',
    generation: 1,
    week: 2,
    raceName: '弥生賞ディープ記念',
    placementRank: 2,
    score: 4,
    totalQuestions: 5,
  });
  assert.match(text2, /2着 🥈/);
  assert.ok(text2.length <= 120);

  // 3rd place board
  const text3 = generateRaceShareText({
    horseName: 'ナリタブライアン',
    generation: 3,
    week: 3,
    raceName: '日本ダービー',
    placementRank: 3,
    score: 3,
    totalQuestions: 5,
  });
  assert.match(text3, /3着 🎖️/);
  assert.ok(text3.length <= 120);
});

test('share: generateTwitterShareUrl encodes message into valid intent URL', () => {
  const text = '🏇 TurfTalk テスト\n#競馬英語';
  const url = generateTwitterShareUrl(text);

  assert.ok(url.startsWith('https://twitter.com/intent/tweet?text='));
  assert.ok(url.includes(encodeURIComponent('🏇 TurfTalk テスト')));
  assert.ok(url.includes(encodeURIComponent('#競馬英語')));
});

test('share: copyShareTextToClipboard handles Node environment and mock clipboard gracefully', async () => {
  // In Node environment without clipboard or document
  const resultNode = await copyShareTextToClipboard('test');
  assert.equal(typeof resultNode, 'boolean');

  // With customClipboard parameter
  let written = '';
  const mockClipboard = {
    writeText: async (t: string) => {
      written = t;
    },
  };
  const res = await copyShareTextToClipboard('hello turf-talk', mockClipboard);
  assert.equal(res, true);
  assert.equal(written, 'hello turf-talk');

  // When customClipboard fails
  const failingClipboard = {
    writeText: async () => {
      throw new Error('Permission denied');
    },
  };
  const failRes = await copyShareTextToClipboard('fail test', failingClipboard);
  assert.equal(failRes, false);
});

test('share: official OGP image exists with exactly 1200x630 dimensions', () => {
  const ogpPath = path.join(publicDir, 'og-image.png');
  assert.ok(fs.existsSync(ogpPath), 'public/og-image.png should exist');

  const { width, height } = readPngDimensions(ogpPath);
  assert.equal(width, 1200, 'OGP image width must be 1200px');
  assert.equal(height, 630, 'OGP image height must be 630px');
});
