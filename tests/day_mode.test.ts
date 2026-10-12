import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getDayOfWeek,
  isWeekend,
  getDaysUntilWeekend,
  getAppMode,
  DAY_NAMES_JA,
  type DayOfWeek,
} from '../src/lib/dayMode.ts';

test('getDayOfWeek: correctly identifies day from YYYY-MM-DD string', () => {
  // 2026-10-11 is Sunday (0)
  assert.equal(getDayOfWeek('2026-10-11'), 0);
  // 2026-10-12 is Monday (1)
  assert.equal(getDayOfWeek('2026-10-12'), 1);
  // 2026-10-13 is Tuesday (2)
  assert.equal(getDayOfWeek('2026-10-13'), 2);
  // 2026-10-14 is Wednesday (3)
  assert.equal(getDayOfWeek('2026-10-14'), 3);
  // 2026-10-15 is Thursday (4)
  assert.equal(getDayOfWeek('2026-10-15'), 4);
  // 2026-10-16 is Friday (5)
  assert.equal(getDayOfWeek('2026-10-16'), 5);
  // 2026-10-17 is Saturday (6)
  assert.equal(getDayOfWeek('2026-10-17'), 6);
});

test('getDayOfWeek: correctly identifies day from Date object', () => {
  const dateSunday = new Date(2026, 9, 11); // October is month index 9
  assert.equal(getDayOfWeek(dateSunday), 0);
  const dateSaturday = new Date(2026, 9, 17);
  assert.equal(getDayOfWeek(dateSaturday), 6);
});

test('isWeekend: identifies Saturday (6) and Sunday (0) as weekend', () => {
  const allDays: DayOfWeek[] = [0, 1, 2, 3, 4, 5, 6];
  const expectedWeekend = [true, false, false, false, false, false, true];

  allDays.forEach((day, index) => {
    assert.equal(
      isWeekend(day),
      expectedWeekend[index],
      `Failed for day index ${day} (${DAY_NAMES_JA[day]})`
    );
  });

  // Check with date strings
  assert.equal(isWeekend('2026-10-12'), false); // Mon
  assert.equal(isWeekend('2026-10-16'), false); // Fri
  assert.equal(isWeekend('2026-10-17'), true); // Sat
  assert.equal(isWeekend('2026-10-18'), true); // Sun
});

test('getDaysUntilWeekend: calculates remaining days until Saturday', () => {
  assert.equal(getDaysUntilWeekend(1), 5); // Monday -> 5 days
  assert.equal(getDaysUntilWeekend(2), 4); // Tuesday -> 4 days
  assert.equal(getDaysUntilWeekend(3), 3); // Wednesday -> 3 days
  assert.equal(getDaysUntilWeekend(4), 2); // Thursday -> 2 days
  assert.equal(getDaysUntilWeekend(5), 1); // Friday -> 1 day
  assert.equal(getDaysUntilWeekend(6), 0); // Saturday -> 0 (race day)
  assert.equal(getDaysUntilWeekend(0), 0); // Sunday -> 0 (race day)

  assert.equal(getDaysUntilWeekend('2026-10-12'), 5); // Mon
  assert.equal(getDaysUntilWeekend('2026-10-16'), 1); // Fri
  assert.equal(getDaysUntilWeekend('2026-10-17'), 0); // Sat
});

test('getAppMode: returns weekend on Sat/Sun and weekday on Mon-Fri', () => {
  assert.equal(getAppMode(1), 'weekday');
  assert.equal(getAppMode(2), 'weekday');
  assert.equal(getAppMode(3), 'weekday');
  assert.equal(getAppMode(4), 'weekday');
  assert.equal(getAppMode(5), 'weekday');
  assert.equal(getAppMode(6), 'weekend');
  assert.equal(getAppMode(0), 'weekend');
});
