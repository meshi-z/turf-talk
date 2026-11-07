import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  isSpeechSynthesisSupported,
  findBestVoice,
  loadSpeechSettings,
  saveSpeechSettings,
  DEFAULT_SPEECH_SETTINGS,
  ACCENT_LABELS,
  speechManager,
  type SpeechAccent,
  SPEECH_SETTINGS_STORAGE_KEY,
} from '../src/lib/speech.ts';

describe('Web Speech API manager (speech.ts)', () => {
  describe('environment & support detection', () => {
    it('isSpeechSynthesisSupported returns false when window is missing or unsupported', () => {
      // global.window がない場合は false
      const originalWindow = (globalThis as Record<string, unknown>).window;
      delete (globalThis as Record<string, unknown>).window;

      assert.equal(isSpeechSynthesisSupported(), false);

      if (originalWindow !== undefined) {
        (globalThis as Record<string, unknown>).window = originalWindow;
      }
    });

    it('defines labels and flags for all 3 major racing accents', () => {
      const accents: SpeechAccent[] = ['en-GB', 'en-US', 'en-AU'];
      for (const acc of accents) {
        const info = ACCENT_LABELS[acc];
        assert.ok(info, `Accent ${acc} should have info defined`);
        assert.ok(info.flag.length > 0, `Accent ${acc} should have a flag emoji`);
        assert.ok(info.short.length > 0, `Accent ${acc} should have a short name`);
      }
    });
  });

  describe('findBestVoice selection logic', () => {
    const mockVoices: SpeechSynthesisVoice[] = [
      {
        lang: 'en-US',
        name: 'Samantha (US)',
        default: true,
        localService: true,
        voiceURI: 'samantha-us',
      },
      {
        lang: 'en-GB',
        name: 'Daniel (UK)',
        default: false,
        localService: true,
        voiceURI: 'daniel-gb',
      },
      {
        lang: 'ja-JP',
        name: 'Kyoko (JP)',
        default: false,
        localService: true,
        voiceURI: 'kyoko-jp',
      },
    ];

    it('finds exact language match when available', () => {
      const gbVoice = findBestVoice(mockVoices, 'en-GB');
      assert.equal(gbVoice?.name, 'Daniel (UK)');

      const usVoice = findBestVoice(mockVoices, 'en-US');
      assert.equal(usVoice?.name, 'Samantha (US)');
    });

    it('falls back to prefix match when exact accent is missing', () => {
      const auVoice = findBestVoice(mockVoices, 'en-AU');
      assert.ok(auVoice?.lang.startsWith('en-'));
    });

    it('returns null when voice list is empty', () => {
      const emptyResult = findBestVoice([], 'en-GB');
      assert.equal(emptyResult, null);
    });
  });

  describe('loadSpeechSettings and saveSpeechSettings', () => {
    let storage: Record<string, string> = {};

    beforeEach(() => {
      storage = {};
      (globalThis as unknown as { localStorage: Storage }).localStorage = {
        getItem: (key: string) => storage[key] ?? null,
        setItem: (key: string, value: string) => {
          storage[key] = String(value);
        },
        removeItem: (key: string) => {
          delete storage[key];
        },
        clear: () => {
          storage = {};
        },
        key: () => null,
        length: 0,
      };
    });

    afterEach(() => {
      delete (globalThis as Record<string, unknown>).localStorage;
    });

    it('returns default settings when storage is empty', () => {
      const settings = loadSpeechSettings();
      assert.deepEqual(settings, DEFAULT_SPEECH_SETTINGS);
    });

    it('saves and loads customized speech settings', () => {
      saveSpeechSettings({ accent: 'en-AU', rate: 0.8 });
      const loaded = loadSpeechSettings();
      assert.equal(loaded.accent, 'en-AU');
      assert.equal(loaded.rate, 0.8);
    });

    it('sanitizes corrupted storage values to safe defaults', () => {
      storage[SPEECH_SETTINGS_STORAGE_KEY] = '{"accent":"fr-FR","rate":3.5}';
      const loaded = loadSpeechSettings();
      assert.equal(loaded.accent, DEFAULT_SPEECH_SETTINGS.accent);
      assert.equal(loaded.rate, 1.0);
    });
  });

  describe('speechManager with mock window.speechSynthesis', () => {
    let spokenUtterance: { text: string; lang: string; rate: number } | null = null;
    let cancelCalled = false;
    let originalWindow: unknown = undefined;

    beforeEach(() => {
      spokenUtterance = null;
      cancelCalled = false;
      originalWindow = (globalThis as Record<string, unknown>).window;

      class MockUtterance {
        public text: string;
        public lang: string = 'en-US';
        public rate: number = 1.0;
        public voice: SpeechSynthesisVoice | null = null;
        public onstart: (() => void) | null = null;
        public onend: (() => void) | null = null;
        public onerror: ((e: unknown) => void) | null = null;
        constructor(text: string) {
          this.text = text;
        }
      }

      const mockWindow = {
        speechSynthesis: {
          speaking: false,
          cancel: () => {
            cancelCalled = true;
          },
          speak: (utterance: { text: string; lang: string; rate: number; onstart?: () => void; onend?: () => void }) => {
            spokenUtterance = {
              text: utterance.text,
              lang: utterance.lang,
              rate: utterance.rate,
            };
            utterance.onstart?.();
            utterance.onend?.();
          },
          getVoices: () => [],
        },
        SpeechSynthesisUtterance: MockUtterance,
      };

      (globalThis as Record<string, unknown>).window = mockWindow;
      (globalThis as Record<string, unknown>).SpeechSynthesisUtterance = MockUtterance;
    });

    afterEach(() => {
      if (originalWindow !== undefined) {
        (globalThis as Record<string, unknown>).window = originalWindow;
      } else {
        delete (globalThis as Record<string, unknown>).window;
      }
      delete (globalThis as Record<string, unknown>).SpeechSynthesisUtterance;
    });

    it('cancels previous speech and speaks given phrase with specified rate and accent', () => {
      let started = false;
      let ended = false;

      const success = speechManager.speak('Turn of foot', {
        accent: 'en-US',
        rate: 0.8,
        onStart: () => {
          started = true;
        },
        onEnd: () => {
          ended = true;
        },
      });

      assert.equal(success, true);
      assert.equal(cancelCalled, true);
      assert.equal(spokenUtterance?.text, 'Turn of foot');
      assert.equal(spokenUtterance?.lang, 'en-US');
      assert.equal(spokenUtterance?.rate, 0.8);
      assert.equal(started, true);
      assert.equal(ended, true);
    });

    it('ignores empty or blank text gracefully', () => {
      const result = speechManager.speak('   ');
      assert.equal(result, false);
    });
  });
});
