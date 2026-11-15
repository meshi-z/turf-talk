import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  LEGAL_TABS,
  OFFICIAL_X_HANDLE,
  OFFICIAL_X_URL,
  getLegalTabById,
  generateFeedbackTemplate,
} from '../src/lib/legalContent.ts';
import { APP_VERSION } from '../src/version.ts';

describe('Legal, Privacy, Storage & Support definitions (legalContent.ts)', () => {
  it('defines all 4 tabs (terms, privacy, storage, contact) with complete structure', () => {
    assert.equal(LEGAL_TABS.length, 4);

    const expectedIds = ['terms', 'privacy', 'storage', 'contact'] as const;
    LEGAL_TABS.forEach((tab, idx) => {
      assert.equal(tab.id, expectedIds[idx]);
      assert.equal(tab.tabNumber, idx + 1);
      assert.ok(tab.shortLabel.length > 0);
      assert.ok(tab.subtitle.length > 0);
      assert.ok(tab.title.length > 0);
      assert.ok(tab.lead.length > 0);
      assert.ok(tab.note.length > 0);
      assert.ok(tab.sections.length >= 2, `Tab ${tab.id} should have at least 2 sections`);

      for (const sec of tab.sections) {
        assert.ok(sec.badge.length > 0);
        assert.ok(sec.title.length > 0);
        assert.ok(sec.paragraphs.length > 0);
      }
    });
  });

  it('includes explicit non-affiliation disclaimer with official racing organizations in terms tab', () => {
    const termsTab = getLegalTabById('terms');
    const allText = termsTab.sections
      .flatMap((s) => [s.title, ...s.paragraphs, ...(s.bullets ?? [])])
      .join(' ');

    assert.ok(allText.includes('非公式'), 'Must state that the service is unofficial');
    assert.ok(allText.includes('JRA'), 'Must mention JRA non-affiliation');
    assert.ok(allText.includes('NAR'), 'Must mention NAR non-affiliation');
    assert.ok(allText.includes('一切関係ありません'), 'Must explicitly state non-affiliation');
    assert.ok(allText.includes('勝馬投票券（馬券）'), 'Must clarify non-gambling purpose');
  });

  it('includes privacy policy details covering LocalStorage, Firebase Auth/Firestore, and Analytics', () => {
    const privacyTab = getLegalTabById('privacy');
    const allText = privacyTab.sections
      .flatMap((s) => [s.title, ...s.paragraphs, ...(s.bullets ?? [])])
      .join(' ');

    assert.ok(allText.includes('LocalStorage'));
    assert.ok(allText.includes('Firestore'));
    assert.ok(allText.includes('Firebase Authentication'));
    assert.ok(allText.includes('Firebase Analytics'));
    assert.ok(allText.includes('第三者へ提供することはありません'));
    assert.ok(allText.includes('退会'));
  });

  it('includes LocalStorage data reset warnings, device migration disclaimer, and cloud backup guidance', () => {
    const storageTab = getLegalTabById('storage');
    const allText = storageTab.sections
      .flatMap((s) => [s.title, ...s.paragraphs, ...(s.bullets ?? [])])
      .join(' ');

    assert.ok(allText.includes('LocalStorage'));
    assert.ok(allText.includes('キャッシュ'));
    assert.ok(allText.includes('Cookie'));
    assert.ok(allText.includes('シークレットモード'));
    assert.ok(allText.includes('機種変更'));
    assert.ok(allText.includes('データ復旧はいたしかねます'));
    assert.ok(allText.includes('クラウド連携'));
  });

  it('configures official X (@meshi__z) contact link and generates feedback template accurately', () => {
    assert.equal(OFFICIAL_X_HANDLE, '@meshi__z');
    assert.equal(OFFICIAL_X_URL, 'https://x.com/meshi__z');

    const contactTab = getLegalTabById('contact');
    const allText = contactTab.sections
      .flatMap((s) => [s.title, ...s.paragraphs, ...(s.bullets ?? [])])
      .join(' ');
    assert.ok(allText.includes('@meshi__z'));
    assert.ok(allText.includes('DM'));

    const guestTemplate = generateFeedbackTemplate({ isCloudLinked: false });
    assert.ok(guestTemplate.includes(APP_VERSION));
    assert.ok(guestTemplate.includes('ゲスト（未連携）'));

    const linkedTemplate = generateFeedbackTemplate({
      appVersion: 'v1.0.0',
      isCloudLinked: true,
    });
    assert.ok(linkedTemplate.includes('v1.0.0'));
    assert.ok(linkedTemplate.includes('クラウド連携済'));
  });
});
