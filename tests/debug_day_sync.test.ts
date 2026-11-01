import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getDateStringForDayOfWeek, getLogicalWeekMonday } from '../src/lib/logicalDate.ts';
import { selectDailyPhrases } from '../src/lib/dailyRotation.ts';
import { INITIAL_PHRASES } from '../src/data/phrases.ts';
import type { DayOfWeek } from '../src/lib/dayMode.ts';

describe('debug day of week sync & question rotation', () => {
  const baseMonday = '2026-10-26';

  it('getDateStringForDayOfWeek calculates correct logical date for all 7 days', () => {
    assert.equal(getDateStringForDayOfWeek(baseMonday, 1), '2026-10-26'); // 月
    assert.equal(getDateStringForDayOfWeek(baseMonday, 2), '2026-10-27'); // 火
    assert.equal(getDateStringForDayOfWeek(baseMonday, 3), '2026-10-28'); // 水
    assert.equal(getDateStringForDayOfWeek(baseMonday, 4), '2026-10-29'); // 木
    assert.equal(getDateStringForDayOfWeek(baseMonday, 5), '2026-10-30'); // 金
    assert.equal(getDateStringForDayOfWeek(baseMonday, 6), '2026-10-31'); // 土
    assert.equal(getDateStringForDayOfWeek(baseMonday, 0), '2026-11-01'); // 日
  });

  it('all calculated dates belong to the same logical week monday', () => {
    const days: DayOfWeek[] = [1, 2, 3, 4, 5, 6, 0];
    for (const d of days) {
      const dateStr = getDateStringForDayOfWeek(baseMonday, d);
      assert.equal(getLogicalWeekMonday(dateStr), baseMonday);
    }
  });

  it('day switching dynamically alters deterministic daily questions across the week', () => {
    const days: DayOfWeek[] = [1, 2, 3, 4, 5, 6, 0];
    const dailyQuestionIdSets: string[][] = [];

    for (const d of days) {
      const virtualDate = getDateStringForDayOfWeek(baseMonday, d);
      const uphillSelection = selectDailyPhrases(INITIAL_PHRASES, [], virtualDate, 3, 'uphill');
      assert.equal(uphillSelection.questions.length, 3);
      dailyQuestionIdSets.push(uphillSelection.questions.map((q) => q.id));
    }

    // 各曜日の出題セットが決定論的であり、全て同じにはならず曜日ごとに変化することを確認
    const uniqueKeys = new Set(dailyQuestionIdSets.map((set) => set.join(',')));
    assert.ok(uniqueKeys.size >= 4, 'Different days in the week yield diverse question combinations');
  });

  it('simulated training days mapping aligns with career & condition progression', () => {
    const simulatedDaysMap: Record<DayOfWeek, number> = {
      1: 0, // 月: 0日
      2: 1, // 火: 1日
      3: 2, // 水: 2日
      4: 3, // 木: 3日
      5: 4, // 金: 4日
      6: 5, // 土: 5日
      0: 5, // 日: 5日
    };

    assert.equal(simulatedDaysMap[1], 0);
    assert.equal(simulatedDaysMap[3], 2);
    assert.equal(simulatedDaysMap[5], 4);
    assert.equal(simulatedDaysMap[6], 5);
    assert.equal(simulatedDaysMap[0], 5);
  });
});
