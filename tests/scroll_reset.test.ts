import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scrollToTop } from '../src/lib/utils.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

describe('Scroll reset on screen and question navigation (Issue #146)', () => {
  it('scrollToTop invokes scrollTo(0, 0) on provided target', () => {
    const calls: Array<[number, number]> = [];
    const mockTarget = {
      scrollTo: (x: number, y: number) => {
        calls.push([x, y]);
      },
    };

    scrollToTop(mockTarget);

    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0], [0, 0]);
  });

  it('scrollToTop defaults to globalThis.window when no target is passed', () => {
    const calls: Array<[number, number]> = [];
    const originalWindow = globalThis.window;

    try {
      (globalThis as unknown as { window: unknown }).window = {
        scrollTo: (x: number, y: number) => {
          calls.push([x, y]);
        },
      };

      scrollToTop();

      assert.equal(calls.length, 1);
      assert.deepEqual(calls[0], [0, 0]);
    } finally {
      if (originalWindow === undefined) {
        delete (globalThis as unknown as { window?: unknown }).window;
      } else {
        globalThis.window = originalWindow;
      }
    }
  });

  it('scrollToTop safely handles null, undefined, or missing scrollTo without throwing', () => {
    assert.doesNotThrow(() => scrollToTop(null));
    assert.doesNotThrow(() => scrollToTop(undefined));
    assert.doesNotThrow(() => scrollToTop({}));
  });

  it('App.tsx resets scroll position on currentScreen, currentQuestionIndex, and raceCurrentIndex changes', () => {
    const appPath = path.join(rootDir, 'src', 'App.tsx');
    const content = fs.readFileSync(appPath, 'utf-8');

    assert.match(content, /import\s+\{\s*scrollToTop\s*\}\s+from\s+['"]\.\/lib\/utils['"]/);
    assert.match(
      content,
      /useEffect\(\(\)\s*=>\s*\{\s*scrollToTop\(\);\s*\},\s*\[currentScreen,\s*currentQuestionIndex,\s*raceCurrentIndex\]\)/
    );
  });
});
