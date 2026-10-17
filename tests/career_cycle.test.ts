import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CAREER_ROUTES,
  DEFAULT_COAT_COLOR,
  DEFAULT_HORSE_NAME,
  DEFAULT_HORSE_WEIGHT,
  DEFAULT_ROUTE_ID,
  HORSE_COAT_COLORS,
  HORSE_COAT_COLOR_WEIGHTS,
  MAX_HORSE_NAME_LENGTH,
  advanceCareerHorseAfterRace,
  createDefaultCareerHorse,
  evaluateCareerRaceReadiness,
  generateRandomHorseName,
  getCareerRouteInfo,
  getCareerStageLabel,
  getCurrentWeekRaceInfo,
  migrateToCareerHorse,
  rollHorseCoatColor,
  sanitizeHorseName,
  updateCareerHorseAfterTraining,
  validateHorseName,
} from '../src/lib/careerCycle.ts';

test('coat colors: defines all 8 JRA coat colors with weights summing to 100% and 白毛 at 1%', () => {
  assert.equal(HORSE_COAT_COLORS.length, 8);
  assert.deepEqual(HORSE_COAT_COLORS, [
    '鹿毛',
    '栗毛',
    '黒鹿毛',
    '芦毛',
    '青鹿毛',
    '青毛',
    '栃栗毛',
    '白毛',
  ]);

  const totalWeight = HORSE_COAT_COLOR_WEIGHTS.reduce((sum, entry) => sum + entry.weight, 0);
  assert.equal(totalWeight, 100);

  const whiteEntry = HORSE_COAT_COLOR_WEIGHTS.find((e) => e.color === '白毛');
  assert.ok(whiteEntry);
  assert.equal(whiteEntry.weight, 1, '白毛 should have the minimum weight of 1%');

  // 境界値での抽選テスト
  assert.equal(rollHorseCoatColor(0.0), '鹿毛');
  assert.equal(rollHorseCoatColor(0.399), '鹿毛');
  assert.equal(rollHorseCoatColor(0.40), '栗毛');
  assert.equal(rollHorseCoatColor(0.62), '黒鹿毛');
  assert.equal(rollHorseCoatColor(0.78), '芦毛');
  assert.equal(rollHorseCoatColor(0.86), '青鹿毛');
  assert.equal(rollHorseCoatColor(0.92), '青毛');
  assert.equal(rollHorseCoatColor(0.96), '栃栗毛');
  assert.equal(rollHorseCoatColor(0.995), '白毛');
});

test('horse naming: generateRandomHorseName returns valid 2-9 char katakana names', () => {
  for (let i = 0; i < 30; i++) {
    const generated = generateRandomHorseName('ターフスター');
    assert.ok(generated.length >= 2 && generated.length <= 9, `Name length out of range: ${generated}`);
    assert.notEqual(generated, 'ターフスター');
    const validation = validateHorseName(generated);
    assert.equal(validation.isValid, true);
  }
});

test('security: sanitizeHorseName and validateHorseName prevent XSS and invalid input', () => {
  // 1. 通常の馬名（カタカナ・英字）は有効
  const validJa = validateHorseName('サイレントヒーロー');
  assert.equal(validJa.isValid, true);
  assert.equal(validJa.sanitized, 'サイレントヒーロー');

  const validEn = validateHorseName('Silent Hero');
  assert.equal(validEn.isValid, true);
  assert.equal(validEn.sanitized, 'Silent Hero');

  // 2. XSSペイロードやHTMLタグを含む入力は拒否・無害化されること
  const xssInput = '<script>alert("xss")</script>';
  const xssValidation = validateHorseName(xssInput);
  assert.equal(xssValidation.isValid, false);
  const sanitizedXss = sanitizeHorseName(xssInput);
  assert.ok(!sanitizedXss.includes('<'));
  assert.ok(!sanitizedXss.includes('>'));
  assert.ok(!sanitizedXss.includes('"'));
  assert.ok(!sanitizedXss.includes('('));

  // 3. 記号のみの場合はフォールバック名が返ること
  assert.equal(sanitizeHorseName('"><img onerror=1>', 'フォールバック'), 'フォールバック');
  assert.equal(sanitizeHorseName('   ', 'フォールバック'), 'フォールバック');
  assert.equal(sanitizeHorseName(null, 'フォールバック'), 'フォールバック');

  // 4. 文字数上限（18文字）チェック
  const tooLong = 'ア'.repeat(MAX_HORSE_NAME_LENGTH + 1);
  const longValidation = validateHorseName(tooLong);
  assert.equal(longValidation.isValid, false);
  assert.equal(sanitizeHorseName(tooLong).length, MAX_HORSE_NAME_LENGTH);

  // 5. 制御文字・ゼロ幅文字の除去
  const withControl = 'ターフ\u200B\u0000スター';
  assert.equal(sanitizeHorseName(withControl), 'ターフスター');
});

test('career routes & stages: defines 8 routes and returns correct stage labels for Week 1 to 4', () => {
  assert.equal(CAREER_ROUTES.length, 8);

  for (const route of CAREER_ROUTES) {
    assert.equal(route.races.length, 4);
    assert.deepEqual(
      route.races.map((r) => r.week),
      [1, 2, 3, 4]
    );
  }

  const coltRoute = getCareerRouteInfo('classic-colt');
  assert.equal(coltRoute.name, '3歳牡馬クラシック路線');
  assert.equal(getCurrentWeekRaceInfo('classic-colt', 1).raceName, 'メイクデビュー');
  assert.equal(getCurrentWeekRaceInfo('classic-colt', 2).raceName, '弥生賞');
  assert.equal(getCurrentWeekRaceInfo('classic-colt', 3).raceName, '日本ダービー');
  assert.equal(getCurrentWeekRaceInfo('classic-colt', 4).raceName, '凱旋門賞');

  assert.equal(getCareerStageLabel(1, []), 'Week 1: 初陣前');
  assert.equal(getCareerStageLabel(2, []), 'Week 2: 前哨戦前');
  assert.equal(getCareerStageLabel(3, []), 'Week 3: 国内頂点前');
  assert.equal(getCareerStageLabel(4, []), 'Week 4: ラストラン直前');
  assert.equal(
    getCareerStageLabel(4, [
      { week: 4, raceName: '凱旋門賞', score: 5, placementText: '1着 🥇 (優勝)' },
    ]),
    'Week 4: ラストラン完走'
  );
});

test('career progression: training updates learned phrases and race advances Week 1 -> 2 -> 3 -> 4', () => {
  const readinessLow = evaluateCareerRaceReadiness(2, false);
  assert.equal(readinessLow.isTrainingGoalMet, false);
  assert.equal(readinessLow.remainingTrainingDaysForGoal, 1);
  assert.equal(readinessLow.canEnterRace, false);

  const readinessMet = evaluateCareerRaceReadiness(3, false);
  assert.equal(readinessMet.isTrainingGoalMet, true);
  assert.equal(readinessMet.remainingTrainingDaysForGoal, 0);
  assert.equal(readinessMet.canEnterRace, true);

  let horse = createDefaultCareerHorse();
  assert.equal(horse.currentWeek, 1);

  // 平日調教でフレーズ習得
  horse = updateCareerHorseAfterTraining(horse, ['p01', 'p02'], 480);
  assert.equal(horse.weight, 480);
  assert.deepEqual(horse.learnedPhraseIdsInCareer, ['p01', 'p02']);

  // Week 1 レース完走 -> Week 2 へ
  const res1 = advanceCareerHorseAfterRace(horse, 4, '2着 🥈 (惜敗)', 476);
  assert.equal(res1.completedWeek, 1);
  assert.equal(res1.nextWeek, 2);
  assert.equal(res1.steppedUp, true);
  assert.equal(res1.isFinalWeekCompleted, false);
  assert.equal(res1.nextHorse.currentWeek, 2);
  assert.equal(res1.nextHorse.raceHistory.length, 1);
  assert.equal(res1.nextHorse.raceHistory[0].raceName, 'メイクデビュー');

  // Week 2 -> Week 3 -> Week 4
  const res2 = advanceCareerHorseAfterRace(res1.nextHorse, 5, '1着 🥇 (優勝)', 472);
  assert.equal(res2.nextHorse.currentWeek, 3);

  const res3 = advanceCareerHorseAfterRace(res2.nextHorse, 5, '1着 🥇 (優勝)', 468);
  assert.equal(res3.nextHorse.currentWeek, 4);

  // Week 4 ラストラン完走（Week上限は4で維持し、履歴が4戦記録される）
  const res4 = advanceCareerHorseAfterRace(res3.nextHorse, 5, '1着 🥇 (優勝)', 464);
  assert.equal(res4.completedWeek, 4);
  assert.equal(res4.nextWeek, 4);
  assert.equal(res4.steppedUp, false);
  assert.equal(res4.isFinalWeekCompleted, true);
  assert.equal(res4.nextHorse.raceHistory.length, 4);
  assert.equal(res4.nextHorse.raceHistory[3].raceName, '凱旋門賞');
});

test('migration: migrateToCareerHorse safely migrates legacy single-horse data and corrupted data', () => {
  // 1. 旧バージョンの単頭データ（careerHorse 未定義）からの引き継ぎ
  const legacySaved = {
    horseName: 'ゴールデンランナー',
    horseWeight: 492,
    learnedPhraseIds: ['p01', 'p05', 'p10'],
  };
  const migrated = migrateToCareerHorse(legacySaved);
  assert.equal(migrated.generation, 1);
  assert.equal(migrated.name, 'ゴールデンランナー');
  assert.equal(migrated.weight, 492);
  assert.equal(migrated.color, DEFAULT_COAT_COLOR);
  assert.equal(migrated.routeId, DEFAULT_ROUTE_ID);
  assert.equal(migrated.currentWeek, 1);
  assert.deepEqual(migrated.learnedPhraseIdsInCareer, ['p01', 'p05', 'p10']);

  // 2. 不正値・破損データが含まれる場合の防御的フォールバック
  const corrupted = {
    careerHorse: {
      generation: -5,
      name: '<script>evil()</script>',
      color: '透明毛', // 存在しない毛色
      routeId: 'invalid-route',
      currentWeek: 99,
      weight: 9999,
      raceHistory: [{ week: 9, raceName: '', score: 100, placementText: '' }],
    },
  };
  const recovered = migrateToCareerHorse(corrupted);
  assert.equal(recovered.generation, 1);
  assert.equal(recovered.name, DEFAULT_HORSE_NAME);
  assert.equal(recovered.color, DEFAULT_COAT_COLOR);
  assert.equal(recovered.routeId, DEFAULT_ROUTE_ID);
  assert.equal(recovered.currentWeek, 1);
  assert.equal(recovered.weight, DEFAULT_HORSE_WEIGHT);
  assert.equal(recovered.raceHistory.length, 1);
  assert.equal(recovered.raceHistory[0].week, 1);
  assert.equal(recovered.raceHistory[0].score, 5);
});
