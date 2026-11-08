import { useState, useEffect, useCallback } from 'react';
import {
  type PhraseItem,
  getMergedPhrases,
  fetchCloudPhrasesFromFirestore,
  saveCachedCloudPhrases,
  mergePhrases,
} from '../lib/phraseSync.ts';
import { INITIAL_PHRASES } from '../data/phrases.ts';

export interface UsePhrasesReturn {
  phrases: PhraseItem[];
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  refreshPhrases: () => Promise<void>;
}

export function usePhrases(): UsePhrasesReturn {
  // 初期レンダリング時からキャッシュ（または静的マスター）を即時返し、描画遅延を防ぐ
  const [phrases, setPhrases] = useState<PhraseItem[]>(() => getMergedPhrases());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const refreshPhrases = useCallback(async () => {
    setIsSyncing(true);
    try {
      const cloudPhrases = await fetchCloudPhrasesFromFirestore();
      if (cloudPhrases && cloudPhrases.length > 0) {
        saveCachedCloudPhrases(cloudPhrases);
        const merged = mergePhrases(INITIAL_PHRASES, cloudPhrases);
        setPhrases(merged);
      }
      setLastSyncedAt(new Date());
    } catch (e) {
      console.warn('[usePhrases] Sync failed:', e);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    // 起動時にバックグラウンドで Firestore から最新フレーズを取得
    refreshPhrases();
  }, [refreshPhrases]);

  return {
    phrases,
    isSyncing,
    lastSyncedAt,
    refreshPhrases,
  };
}
