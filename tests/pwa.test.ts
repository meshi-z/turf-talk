import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  STORAGE_KEY_PWA_DISMISSED,
  isStandalone,
  isIos,
  hasDismissedPwaInstall,
  dismissPwaInstall,
  resetPwaDismissed,
} from '../src/lib/pwa.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

test('pwa: STORAGE_KEY_PWA_DISMISSED constant is properly defined', () => {
  assert.equal(STORAGE_KEY_PWA_DISMISSED, 'turf_talk_pwa_dismissed');
});

test('pwa: isStandalone handles custom checks and fallback', () => {
  // In Node environment without window
  assert.equal(isStandalone(), false);

  // Custom checks
  assert.equal(isStandalone({ standalone: true }), true);
  assert.equal(isStandalone({ displayModeStandalone: true }), true);
  assert.equal(isStandalone({ standalone: false, displayModeStandalone: false }), false);
});

test('pwa: isIos detects iOS user agents accurately', () => {
  // Node environment default
  assert.equal(isIos(), false);

  // iPhone UA
  const iphoneUa = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1';
  assert.equal(isIos(iphoneUa), true);

  // iPad UA
  const ipadUa = 'Mozilla/5.0 (iPad; CPU OS 16_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1';
  assert.equal(isIos(ipadUa), true);

  // iPadOS with Macintosh UA and touch points > 1
  const macIpadUa = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15';
  assert.equal(isIos(macIpadUa, 5), true);
  assert.equal(isIos(macIpadUa, 0), false);

  // Desktop Windows UA
  const windowsUa = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36';
  assert.equal(isIos(windowsUa, 0), false);

  // Android UA
  const androidUa = 'Mozilla/5.0 (Linux; Android 13; SM-S908B) AppleWebKit/537.36 Chrome/112.0.0.0 Mobile Safari/537.36';
  assert.equal(isIos(androidUa, 5), false);
});

test('pwa: localStorage dismiss state persistence works safely', () => {
  const store = new Map<string, string>();
  const mockStorage: Storage = {
    length: 0,
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    key: () => null,
  };

  const originalWindow = globalThis.window;
  const originalLocalStorage = globalThis.localStorage;

  try {
    (globalThis as unknown as { window: unknown }).window = {};
    globalThis.localStorage = mockStorage;

    assert.equal(hasDismissedPwaInstall(), false);
    dismissPwaInstall();
    assert.equal(hasDismissedPwaInstall(), true);
    assert.equal(store.get(STORAGE_KEY_PWA_DISMISSED), 'true');

    resetPwaDismissed();
    assert.equal(hasDismissedPwaInstall(), false);
    assert.equal(store.has(STORAGE_KEY_PWA_DISMISSED), false);
  } finally {
    if (originalWindow === undefined) {
      delete (globalThis as unknown as { window?: unknown }).window;
    } else {
      globalThis.window = originalWindow;
    }
    if (originalLocalStorage === undefined) {
      delete (globalThis as unknown as { localStorage?: unknown }).localStorage;
    } else {
      globalThis.localStorage = originalLocalStorage;
    }
  }
});

test('pwa: vite.config.ts contains VitePWA configuration with workbox caching rules', () => {
  const configPath = path.join(rootDir, 'vite.config.ts');
  const content = fs.readFileSync(configPath, 'utf-8');

  assert.match(content, /import\s+\{\s*VitePWA\s*\}\s+from\s+['"]vite-plugin-pwa['"]/);
  assert.match(content, /registerType:\s*['"]autoUpdate['"]/);
  assert.match(content, /manifest:\s*false/);
  assert.ok(content.includes('fonts.googleapis.com') || content.includes('googleapis'));
  assert.ok(content.includes('fonts.gstatic.com') || content.includes('gstatic'));
  assert.match(content, /globPatterns:\s*\[[^\]]*webmanifest/);
});

test('pwa: build artifacts dist contains sw.js and registerSW.js', () => {
  const distDir = path.join(rootDir, 'dist');
  if (!fs.existsSync(distDir)) {
    // If not built yet, skip gracefully
    return;
  }

  const swPath = path.join(distDir, 'sw.js');
  const registerSwPath = path.join(distDir, 'registerSW.js');

  assert.ok(fs.existsSync(swPath), 'dist/sw.js should exist after build');
  assert.ok(fs.existsSync(registerSwPath), 'dist/registerSW.js should exist after build');

  const swContent = fs.readFileSync(swPath, 'utf-8');
  assert.match(swContent, /workbox|precache/i);
});
