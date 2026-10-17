import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createDefaultCareerHorse,
  updateCareerHorseAfterTraining,
  isHorseProfileLocked,
} from '../src/lib/careerCycle.ts';

test('weekend race unlock: initial horse has not trained (hasTrained = false)', () => {
  const horse = createDefaultCareerHorse();
  assert.equal(horse.hasTrained, false, 'New horse must have hasTrained = false');
  assert.equal(isHorseProfileLocked(horse), false, 'Profile must not be locked before training');
});

test('weekend race unlock: training updates hasTrained to true and locks profile', () => {
  const horse = createDefaultCareerHorse();
  const trainedHorse = updateCareerHorseAfterTraining(horse, ['p01', 'p02'], 480);

  assert.equal(trainedHorse.hasTrained, true, 'Trained horse must have hasTrained = true');
  assert.equal(isHorseProfileLocked(trainedHorse), true, 'Profile must be locked after training');
});

test('weekend race unlock: weekend race entry condition requires hasTrained = true', () => {
  const isWeekendMode = true;
  const hasCompletedWeeklyRace = false;

  // 未調教の場合
  const untrainedHorse = createDefaultCareerHorse();
  const canEnterUntrained = isWeekendMode && untrainedHorse.hasTrained && !hasCompletedWeeklyRace;
  assert.equal(
    canEnterUntrained,
    false,
    'Untrained horse must not be able to enter weekend race even on weekend'
  );

  // 調教済みの場合
  const trainedHorse = updateCareerHorseAfterTraining(untrainedHorse, ['p01'], 480);
  const canEnterTrained = isWeekendMode && trainedHorse.hasTrained && !hasCompletedWeeklyRace;
  assert.equal(
    canEnterTrained,
    true,
    'Trained horse must be able to enter weekend race on weekend when not completed'
  );

  // 調教済みだが今週出走完了している場合
  const canEnterCompleted = isWeekendMode && trainedHorse.hasTrained && !true;
  assert.equal(
    canEnterCompleted,
    false,
    'Completed horse must not be able to enter weekend race again'
  );
});
