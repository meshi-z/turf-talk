import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  HELP_GUIDE_STEPS,
  HELP_GUIDE_STORAGE_KEY,
  hasSeenHelpGuide,
  markHelpGuideSeen,
} from '../src/lib/helpGuide.ts';
import { MAX_CARROTS } from '../src/lib/carrotBonus.ts';

describe('Help guide definitions & onboarding storage (helpGuide.ts)', () => {
  it('defines 5 ordered guide steps with complete metadata and highlights', () => {
    assert.equal(HELP_GUIDE_STEPS.length, 5);

    const expectedIds = [
      'overview',
      'weekday-training',
      'weekend-race',
      'career-retirement',
      'archive-features',
    ];

    HELP_GUIDE_STEPS.forEach((step, idx) => {
      assert.equal(step.id, expectedIds[idx]);
      assert.equal(step.stepNumber, idx + 1);
      assert.ok(step.shortLabel.length > 0, 'shortLabel must not be empty');
      assert.ok(step.subtitle.length > 0, 'subtitle must not be empty');
      assert.ok(step.title.length > 0, 'title must not be empty');
      assert.ok(step.lead.length > 0, 'lead must not be empty');
      assert.equal(step.highlights.length, 3, 'Each step must have 3 key highlights');
      for (const h of step.highlights) {
        assert.ok(h.badge.length > 0);
        assert.ok(h.title.length > 0);
        assert.ok(h.description.length > 0);
      }
      assert.ok(step.tip.length > 0, 'tip must not be empty');
    });

    const raceStep = HELP_GUIDE_STEPS.find((s) => s.id === 'weekend-race');
    assert.ok(raceStep);
    const reservesHighlight = raceStep.highlights[1];
    const carrotHighlight = raceStep.highlights[2];
    assert.ok(reservesHighlight.description.includes('最大2回'));
    assert.ok(carrotHighlight.description.includes(`最大${MAX_CARROTS}本`));
  });

  it('tracks onboarding seen flag accurately in storage', () => {
    const store = new Map<string, string>();
    const mockStorage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, val: string) => {
        store.set(key, val);
      },
    };

    assert.equal(hasSeenHelpGuide(mockStorage), false);

    markHelpGuideSeen(mockStorage);
    assert.equal(store.get(HELP_GUIDE_STORAGE_KEY), 'true');
    assert.equal(hasSeenHelpGuide(mockStorage), true);
  });

  it('safely falls back when storage is null or throws errors', () => {
    assert.equal(hasSeenHelpGuide(null), false);
    assert.doesNotThrow(() => markHelpGuideSeen(null));

    const throwingStorage = {
      getItem: (): string | null => {
        throw new Error('Storage access denied');
      },
      setItem: (): void => {
        throw new Error('QuotaExceededError');
      },
    };

    assert.equal(hasSeenHelpGuide(throwingStorage), false);
    assert.doesNotThrow(() => markHelpGuideSeen(throwingStorage));
  });
});
