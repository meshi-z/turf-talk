import { useState, useEffect, useCallback } from 'react';
import {
  type SpeechAccent,
  type SpeechRate,
  type SpeechSettings,
  loadSpeechSettings,
  saveSpeechSettings,
} from '../lib/speech';

const SPEECH_SETTINGS_EVENT = 'turftalk_speech_settings_changed';

export function useSpeechSettings() {
  const [settings, setSettingsState] = useState<SpeechSettings>(() => loadSpeechSettings());

  useEffect(() => {
    const handleSettingsChanged = () => {
      setSettingsState(loadSpeechSettings());
    };

    window.addEventListener(SPEECH_SETTINGS_EVENT, handleSettingsChanged);
    window.addEventListener('storage', handleSettingsChanged);

    return () => {
      window.removeEventListener(SPEECH_SETTINGS_EVENT, handleSettingsChanged);
      window.removeEventListener('storage', handleSettingsChanged);
    };
  }, []);

  const updateSettings = useCallback((newSettings: Partial<SpeechSettings>) => {
    setSettingsState((prev) => {
      const merged: SpeechSettings = {
        accent: newSettings.accent ?? prev.accent,
        rate: newSettings.rate ?? prev.rate,
      };
      saveSpeechSettings(merged);
      window.dispatchEvent(new CustomEvent(SPEECH_SETTINGS_EVENT));
      return merged;
    });
  }, []);

  const setAccent = useCallback(
    (accent: SpeechAccent) => {
      updateSettings({ accent });
    },
    [updateSettings]
  );

  const setRate = useCallback(
    (rate: SpeechRate) => {
      updateSettings({ rate });
    },
    [updateSettings]
  );

  const toggleRate = useCallback(() => {
    setSettingsState((prev) => {
      const nextRate: SpeechRate = prev.rate === 1.0 ? 0.8 : 1.0;
      const nextSettings: SpeechSettings = { ...prev, rate: nextRate };
      saveSpeechSettings(nextSettings);
      window.dispatchEvent(new CustomEvent(SPEECH_SETTINGS_EVENT));
      return nextSettings;
    });
  }, []);

  return {
    settings,
    accent: settings.accent,
    rate: settings.rate,
    setAccent,
    setRate,
    toggleRate,
  };
}
