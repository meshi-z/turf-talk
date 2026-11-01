/**
 * Web Speech API (speechSynthesis) を活用した英語音声読み上げマネージャー
 * - 競馬実況・騎手インタビューのリスニング補助
 * - 3カ国の競馬主要アクセント対応（英: en-GB, 米: en-US, 豪: en-AU）
 * - 再生速度切り替え（1.0x 等速 / 0.8x ゆっくり）
 * - 連打時の重複防止（cancel 制御）および安全なフォールバック
 */

export type SpeechAccent = 'en-GB' | 'en-US' | 'en-AU';
export type SpeechRate = 1.0 | 0.8;

export interface SpeechSettings {
  accent: SpeechAccent;
  rate: SpeechRate;
}

export const SPEECH_SETTINGS_STORAGE_KEY = 'turftalk_speech_settings_v1';

export const DEFAULT_SPEECH_SETTINGS: SpeechSettings = {
  accent: 'en-GB', // 欧州・競馬発祥の地に合わせた英国アクセントをデフォルトに設定
  rate: 1.0,
};

export const ACCENT_LABELS: Record<SpeechAccent, { flag: string; label: string; short: string }> = {
  'en-GB': { flag: '🇬🇧', label: 'イギリス (英)', short: 'UK' },
  'en-US': { flag: '🇺🇸', label: 'アメリカ (米)', short: 'US' },
  'en-AU': { flag: '🇦🇺', label: 'オーストラリア (豪)', short: 'AU' },
};

/**
 * Web Speech API (speechSynthesis) がブラウザでサポートされているか判定
 */
export function isSpeechSynthesisSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'speechSynthesis' in window && typeof window.speechSynthesis === 'object' && window.speechSynthesis !== null;
}

/**
 * LocalStorage から音声設定を読み込む
 */
export function loadSpeechSettings(): SpeechSettings {
  if (typeof localStorage === 'undefined') return DEFAULT_SPEECH_SETTINGS;
  try {
    const saved = localStorage.getItem(SPEECH_SETTINGS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const accent: SpeechAccent =
        parsed.accent === 'en-GB' || parsed.accent === 'en-US' || parsed.accent === 'en-AU'
          ? parsed.accent
          : DEFAULT_SPEECH_SETTINGS.accent;
      const rate: SpeechRate = parsed.rate === 0.8 ? 0.8 : 1.0;
      return { accent, rate };
    }
  } catch {
    // 読み込み失敗時はデフォルト
  }
  return DEFAULT_SPEECH_SETTINGS;
}

/**
 * 音声設定を LocalStorage に保存する
 */
export function saveSpeechSettings(settings: SpeechSettings): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(SPEECH_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // 保存失敗は無視
  }
}

/**
 * 利用可能なボイス一覧から指定アクセントに最も合致するボイスを検索
 */
export function findBestVoice(
  voices: SpeechSynthesisVoice[],
  targetLang: SpeechAccent
): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null;

  // 1. 完全一致 (例: 'en-GB' または 'en_GB')
  const exact = voices.find(
    (v) => v.lang === targetLang || v.lang.replace('_', '-') === targetLang
  );
  if (exact) return exact;

  // 2. 言語コード前方一致 (例: 'en-')
  const langPrefix = targetLang.split('-')[0];
  const prefixMatch = voices.find((v) => v.lang.startsWith(langPrefix));
  if (prefixMatch) return prefixMatch;

  return voices[0] ?? null;
}

class SpeechManager {
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private cachedVoices: SpeechSynthesisVoice[] = [];
  private isListeningForVoices = false;

  constructor() {
    this.initVoices();
  }

  private initVoices(): void {
    if (!isSpeechSynthesisSupported()) return;

    const synth = window.speechSynthesis;
    if (typeof synth.getVoices === 'function') {
      this.cachedVoices = synth.getVoices();
    }

    if (!this.isListeningForVoices && typeof synth.addEventListener === 'function') {
      synth.addEventListener('voiceschanged', () => {
        this.cachedVoices = synth.getVoices();
      });
      this.isListeningForVoices = true;
    } else if (!this.isListeningForVoices && 'onvoiceschanged' in synth) {
      synth.onvoiceschanged = () => {
        this.cachedVoices = synth.getVoices();
      };
      this.isListeningForVoices = true;
    }
  }

  public getVoices(): SpeechSynthesisVoice[] {
    if (this.cachedVoices.length === 0 && isSpeechSynthesisSupported()) {
      if (typeof window.speechSynthesis.getVoices === 'function') {
        this.cachedVoices = window.speechSynthesis.getVoices();
      }
    }
    return this.cachedVoices;
  }

  /**
   * 現在音声再生中かどうか
   */
  public isSpeaking(): boolean {
    if (!isSpeechSynthesisSupported()) return false;
    return Boolean(window.speechSynthesis.speaking);
  }

  /**
   * 現在アクティブな発話オブジェクトを取得（検証・デバッグ用）
   */
  public getActiveUtterance(): SpeechSynthesisUtterance | null {
    return this.activeUtterance;
  }

  /**
   * 再生中の音声を直ちに停止する
   */
  public cancel(): void {
    if (!isSpeechSynthesisSupported()) return;
    try {
      window.speechSynthesis.cancel();
      this.activeUtterance = null;
    } catch {
      // エラー無視
    }
  }

  /**
   * 英文・英単語を読み上げる
   */
  public speak(
    text: string,
    options: {
      accent?: SpeechAccent;
      rate?: SpeechRate;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: unknown) => void;
    } = {}
  ): boolean {
    if (!isSpeechSynthesisSupported()) {
      return false;
    }

    const cleanText = text.trim();
    if (!cleanText) return false;

    const synth = window.speechSynthesis;

    // 前回の発話を停止
    this.cancel();

    try {
      const currentSettings = loadSpeechSettings();
      const accent = options.accent ?? currentSettings.accent;
      const rate = options.rate ?? currentSettings.rate;

      const UtteranceConstructor =
        typeof window.SpeechSynthesisUtterance === 'function'
          ? window.SpeechSynthesisUtterance
          : typeof SpeechSynthesisUtterance === 'function'
          ? SpeechSynthesisUtterance
          : null;

      if (!UtteranceConstructor) return false;

      const utterance = new UtteranceConstructor(cleanText);
      utterance.lang = accent;
      utterance.rate = rate;

      // 最適なボイスを設定
      const voices = this.getVoices();
      const matchedVoice = findBestVoice(voices, accent);
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.onstart = () => {
        options.onStart?.();
      };

      utterance.onend = () => {
        this.activeUtterance = null;
        options.onEnd?.();
      };

      utterance.onerror = (e) => {
        this.activeUtterance = null;
        // cancel による中断イベントは正常フローとして扱う
        if (e.error === 'canceled' || e.error === 'interrupted') {
          options.onEnd?.();
          return;
        }
        options.onError?.(e);
        options.onEnd?.();
      };

      this.activeUtterance = utterance;
      synth.speak(utterance);
      return true;
    } catch (err) {
      this.activeUtterance = null;
      options.onError?.(err);
      options.onEnd?.();
      return false;
    }
  }
}

export const speechManager = new SpeechManager();
