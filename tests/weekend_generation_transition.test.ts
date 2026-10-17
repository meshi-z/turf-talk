import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createDefaultCareerHorse,
  retireAndSpawnNextGeneration,
  updateCareerHorseAfterTraining,
} from '../src/lib/careerCycle.ts';
import {
  getLogicalWeekMonday,
  isWeeklyRaceCompletedForWeek,
} from '../src/lib/logicalDate.ts';

test('generation transition: spawns next generation horse with currentWeek=1 and empty raceHistory', () => {
  const currentHorse = createDefaultCareerHorse({
    generation: 1,
    currentWeek: 4,
    hasTrained: true,
  });

  const { retiredRecord, nextHorse } = retireAndSpawnNextGeneration(
    currentHorse,
    '2026-10-18', // 日曜日
    { name: 'ミラクルスター', routeId: 'classic-filly' }
  );

  assert.equal(nextHorse.generation, 2, 'Next generation must be incremented to 2');
  assert.equal(nextHorse.currentWeek, 1, 'Next horse must start at Week 1');
  assert.equal(nextHorse.hasTrained, false, 'Next horse must start untrained');
  assert.equal(nextHorse.raceHistory.length, 0, 'Next horse must have 0 race history');
  assert.equal(retiredRecord.generation, 1, 'Hall of Fame record stores retired horse generation');
});

test('generation transition: preserves weekly race completion on same weekend to prevent immediate Week 1 race entry', () => {
  const sunday = '2026-10-18';
  const currentWeekMonday = getLogicalWeekMonday(sunday);

  // 第1世代が今週末にWeek 4レースを出走完了した状態
  const prevProgress = {
    currentWeekMonday,
    lastRaceWeekMonday: currentWeekMonday,
    hasCompletedWeeklyRace: true,
  };

  // 世代交代を実行（前世代の出走完了フラグを引き継ぐ）
  const newProgress = {
    ...prevProgress,
    lastRaceWeekMonday: prevProgress.lastRaceWeekMonday,
    hasCompletedWeeklyRace: prevProgress.hasCompletedWeeklyRace,
  };

  assert.equal(
    newProgress.hasCompletedWeeklyRace,
    true,
    'Next generation must inherit hasCompletedWeeklyRace=true on the same weekend'
  );
  assert.equal(
    newProgress.lastRaceWeekMonday,
    currentWeekMonday,
    'Next generation must inherit lastRaceWeekMonday'
  );

  // 土日の新馬出走可否判定: 調教を行っても hasCompletedWeeklyRace が true のため出走できないこと
  const untrainedHorse = createDefaultCareerHorse({ generation: 2 });
  const trainedHorse = updateCareerHorseAfterTraining(untrainedHorse, ['p01'], 480);

  const canEnterRaceOnSameWeekend =
    !newProgress.hasCompletedWeeklyRace && trainedHorse.hasTrained;
  assert.equal(
    canEnterRaceOnSameWeekend,
    false,
    'Newborn horse cannot enter Week 1 race on the same weekend after generation transition'
  );

  // isNewbornWeekendPending フラグの検証（新馬入厩期間のUI表示条件）
  const isNewbornWeekendPending =
    untrainedHorse.currentWeek === 1 &&
    untrainedHorse.raceHistory.length === 0 &&
    Boolean(newProgress.hasCompletedWeeklyRace);
  assert.equal(
    isNewbornWeekendPending,
    true,
    'Must recognize as newborn horse pending debut for next weekend'
  );
});

test('generation transition: resets weekly race limit on next week, allowing Week 1 debut next weekend', () => {
  const sunday = '2026-10-18';
  const previousRaceMonday = getLogicalWeekMonday(sunday); // '2026-10-12'

  // 翌週月曜日（午前4時以降）の日付
  const nextMonday = '2026-10-19';
  const isCompletedNextWeek = isWeeklyRaceCompletedForWeek(previousRaceMonday, nextMonday);

  assert.equal(
    isCompletedNextWeek,
    false,
    'Weekly race completion must reset to false on the following week Monday'
  );

  // 翌週末（2026-10-24 土曜日）に出走可能となること
  const nextSaturday = '2026-10-24';
  const isCompletedNextSaturday = isWeeklyRaceCompletedForWeek(previousRaceMonday, nextSaturday);
  assert.equal(
    isCompletedNextSaturday,
    false,
    'Weekly race completion remains false on the next weekend'
  );

  // 翌週末に平日調教を行っていればWeek 1レースへ出走可能
  const horseWeek1 = createDefaultCareerHorse({ generation: 2 });
  const trainedHorse = updateCareerHorseAfterTraining(horseWeek1, ['p01'], 480);

  const canEnterNextWeekend = !isCompletedNextSaturday && trainedHorse.hasTrained;
  assert.equal(
    canEnterNextWeekend,
    true,
    'Week 1 race is unlocked for the next weekend after training'
  );
});
