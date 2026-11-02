import type { CareerHorse, PhrasePartnerHorse } from '../types';

/**
 * 新しく正解・習得したフレーズに対して、現在の担当愛馬をパートナー馬として記録する
 * （すでにパートナーが記録されているフレーズは初習得時の愛馬として保持し、上書きしない）
 */
export function recordNewPhrasePartners(
  currentPartners: Record<string, PhrasePartnerHorse> | undefined,
  correctPhraseIds: readonly string[],
  careerHorse: CareerHorse
): Record<string, PhrasePartnerHorse> {
  const partners: Record<string, PhrasePartnerHorse> = { ...currentPartners };
  const partnerData: PhrasePartnerHorse = {
    generation: careerHorse.generation,
    name: careerHorse.name,
    color: careerHorse.color,
  };

  for (const phraseId of correctPhraseIds) {
    if (!partners[phraseId]) {
      partners[phraseId] = partnerData;
    }
  }

  return partners;
}

/**
 * フレーズの習得パートナー馬情報を解決する
 * - phrasePartners に登録がある場合はそれを返す
 * - 登録はないが習得済み（isLearned === true）のレガシーデータの場合は fallbackHorse を補完して返す
 * - 未習得（isLearned === false）の場合は null を返す
 */
export function resolvePhrasePartner(
  phraseId: string,
  phrasePartners: Record<string, PhrasePartnerHorse> | undefined,
  isLearned: boolean,
  fallbackHorse?: CareerHorse | null
): PhrasePartnerHorse | null {
  if (!isLearned) {
    return null;
  }

  if (phrasePartners && phrasePartners[phraseId]) {
    return phrasePartners[phraseId];
  }

  if (fallbackHorse) {
    return {
      generation: fallbackHorse.generation,
      name: fallbackHorse.name,
      color: fallbackHorse.color,
    };
  }

  return null;
}
