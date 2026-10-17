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
  MIN_HORSE_NAME_LENGTH,
  MAX_HORSE_NAME_JA_LENGTH,
  MAX_HORSE_NAME_EN_LENGTH,
  MAX_HORSE_NAME_LENGTH,
  isAsciiHorseName,
  hasMixedLanguages,
  advanceCareerHorseAfterRace,
  changeHorseNameIfUnlocked,
  changeHorseRouteIfUnlocked,
  createDefaultCareerHorse,
  evaluateCareerRaceReadiness,
  generateRandomHorseName,
  getCareerRouteInfo,
  getCareerStageLabel,
  getCurrentWeekRaceInfo,
  isHorseProfileLocked,
  migrateToCareerHorse,
  rerollHorseIdentity,
  rollHorseCoatColor,
  sanitizeHorseName,
  updateCareerHorseAfterTraining,
  validateHorseName,
  isCareerWeek4Completed,
  determineHorseEpithet,
  evaluateRetirementSummary,
  createHallOfFameRecord,
  retireAndSpawnNextGeneration,
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

  // 4. 制御文字・ゼロ幅文字の除去
  const withControl = 'ターフ\u200B\u0000スター';
  assert.equal(sanitizeHorseName(withControl), 'ターフスター');
});

test('horse name validation: hybrid length limits (Katakana 2-9 chars, English 2-18 chars) and no mixed languages', () => {
  // 定数の確認
  assert.equal(MIN_HORSE_NAME_LENGTH, 2);
  assert.equal(MAX_HORSE_NAME_JA_LENGTH, 9);
  assert.equal(MAX_HORSE_NAME_EN_LENGTH, 18);
  assert.equal(MAX_HORSE_NAME_LENGTH, 18);

  // 1. 日本語（カタカナ等）の文字数制限（2〜9文字）
  // 正常系（2〜9文字）
  assert.equal(validateHorseName('タマ').isValid, true, '2-char Katakana should be valid');
  assert.equal(validateHorseName('サイレンススズカ').isValid, true, '8-char Katakana should be valid');
  assert.equal(validateHorseName('ディープインパクト').isValid, true, '9-char Katakana should be valid');

  // 異常系: 10文字以上のカタカナはエラー
  const tenCharsJa = 'ディープインパクト号';
  const valTenCharsJa = validateHorseName(tenCharsJa);
  assert.equal(valTenCharsJa.isValid, false, '10-char Katakana must be invalid');
  assert.ok(valTenCharsJa.error?.includes('9文字以内'), 'Error should mention 9 characters limit');
  assert.equal(sanitizeHorseName(tenCharsJa).length, MAX_HORSE_NAME_JA_LENGTH);

  // 2. 英字馬名の文字数制限（2〜18文字）
  // 正常系（2〜18文字）
  assert.equal(validateHorseName('Go').isValid, true, '2-char English should be valid');
  assert.equal(validateHorseName('Frankel').isValid, true, '7-char English should be valid');
  assert.equal(validateHorseName('City of Troy').isValid, true, '12-char English with space should be valid');
  assert.equal(validateHorseName('A'.repeat(MAX_HORSE_NAME_EN_LENGTH)).isValid, true, '18-char English should be valid');

  // 異常系: 19文字以上の英字はエラー
  const nineteenCharsEn = 'A'.repeat(MAX_HORSE_NAME_EN_LENGTH + 1);
  const valNineteenEn = validateHorseName(nineteenCharsEn);
  assert.equal(valNineteenEn.isValid, false, '19-char English must be invalid');
  assert.ok(valNineteenEn.error?.includes('18文字以内'), 'Error should mention 18 characters limit');
  assert.equal(sanitizeHorseName(nineteenCharsEn).length, MAX_HORSE_NAME_EN_LENGTH);

  // 3. 1文字入力の拒否（最小文字数: 2文字未満は拒否）
  const singleCharJa = validateHorseName('ア');
  assert.equal(singleCharJa.isValid, false, '1-char Katakana must be invalid');
  assert.ok(singleCharJa.error?.includes('2文字以上'), 'Error should mention 2 characters minimum');

  const singleCharEn = validateHorseName('A');
  assert.equal(singleCharEn.isValid, false, '1-char English must be invalid');
  assert.ok(singleCharEn.error?.includes('2文字以上'), 'Error should mention 2 characters minimum');

  const emptyName = validateHorseName('   ');
  assert.equal(emptyName.isValid, false, 'Empty input must be invalid');

  // 4. カタカナと英字の混在禁止（公式規則に基づく排他ルール）
  const mixed1 = validateHorseName('サンデーR');
  assert.equal(mixed1.isValid, false, 'Mixed Katakana and English must be invalid');
  assert.ok(mixed1.error?.includes('混在'), 'Error should mention rejection of mixed languages');

  const mixed2 = validateHorseName('Starスター');
  assert.equal(mixed2.isValid, false, 'Mixed English and Katakana must be invalid');
  assert.ok(mixed2.error?.includes('混在'), 'Error should mention rejection of mixed languages');

  const mixed3 = validateHorseName('Kingヘイロー');
  assert.equal(mixed3.isValid, false, 'Mixed English and Katakana must be invalid');
  assert.ok(mixed3.error?.includes('混在'), 'Error should mention rejection of mixed languages');

  // ヘルパー関数の動作確認
  assert.equal(hasMixedLanguages('サンデーR'), true);
  assert.equal(hasMixedLanguages('Starスター'), true);
  assert.equal(hasMixedLanguages('ディープインパクト'), false);
  assert.equal(hasMixedLanguages('Frankel'), false);
  assert.equal(isAsciiHorseName('Frankel'), true);
  assert.equal(isAsciiHorseName('City of Troy'), true);
  assert.equal(isAsciiHorseName('ディープインパクト'), false);
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
  assert.equal(recovered.hasTrained, true);
});

test('profile lock & reroll: allows name/color reroll and route change before first training, locks after training', () => {
  // 1. 新馬誕生直後は未調教（ロック解除状態）
  let horse = createDefaultCareerHorse();
  assert.equal(horse.hasTrained, false);
  assert.equal(isHorseProfileLocked(horse), false);

  // 2. 「🎲 命名」で馬名と毛色（例: 0.995 -> 白毛）が同時に抽選・更新されること
  horse = rerollHorseIdentity(horse, 0.995);
  assert.notEqual(horse.name, DEFAULT_HORSE_NAME);
  assert.equal(horse.color, '白毛');

  // 3. 未調教の間は手動馬名変更および路線変更が可能
  horse = changeHorseNameIfUnlocked(horse, 'サイレントヒーロー');
  assert.equal(horse.name, 'サイレントヒーロー');

  horse = changeHorseRouteIfUnlocked(horse, 'sprint');
  assert.equal(horse.routeId, 'sprint');

  // 4. 初回調教を完了すると hasTrained=true となりロックされること
  horse = updateCareerHorseAfterTraining(horse, ['p01'], 480);
  assert.equal(horse.hasTrained, true);
  assert.equal(isHorseProfileLocked(horse), true);

  // 5. ロック後は命名リロール・手動馬名変更・路線変更がいずれも拒否され変化しないこと
  const afterRerollAttempt = rerollHorseIdentity(horse, 0.0);
  assert.equal(afterRerollAttempt.name, 'サイレントヒーロー');
  assert.equal(afterRerollAttempt.color, '白毛');

  const afterNameChangeAttempt = changeHorseNameIfUnlocked(horse, 'アナザーネーム');
  assert.equal(afterNameChangeAttempt.name, 'サイレントヒーロー');

  const afterRouteChangeAttempt = changeHorseRouteIfUnlocked(horse, 'stayer');
  assert.equal(afterRouteChangeAttempt.routeId, 'sprint');

  // 6. 次世代誕生（新規生成）時は再び hasTrained=false でロック解除されること
  const nextGenHorse = createDefaultCareerHorse({ generation: 2 });
  assert.equal(nextGenHorse.generation, 2);
  assert.equal(nextGenHorse.hasTrained, false);
  assert.equal(isHorseProfileLocked(nextGenHorse), false);
});

test('retirement & next generation: evaluates epithets, creates Hall of Fame record, and spawns generation + 1', () => {
  // 1. 4戦全勝（4勝）の場合は「不敗の世界覇者」
  let unbeaten = createDefaultCareerHorse({ name: 'ディープスター', routeId: 'classic-colt' });
  assert.equal(isCareerWeek4Completed(unbeaten), false);
  unbeaten = updateCareerHorseAfterTraining(unbeaten, ['p01', 'p02', 'p03'], 480);
  unbeaten = advanceCareerHorseAfterRace(unbeaten, 5, '1着 🥇 (優勝)', 478).nextHorse;
  unbeaten = advanceCareerHorseAfterRace(unbeaten, 5, '1着 🥇 (優勝)', 476).nextHorse;
  unbeaten = advanceCareerHorseAfterRace(unbeaten, 5, '1着 🥇 (優勝)', 474).nextHorse;
  unbeaten = advanceCareerHorseAfterRace(unbeaten, 5, '1着 🥇 (優勝)', 472).nextHorse;

  assert.equal(isCareerWeek4Completed(unbeaten), true);
  const unbeatenSummary = evaluateRetirementSummary(unbeaten);
  assert.equal(unbeatenSummary.wins, 4);
  assert.equal(unbeatenSummary.totalRaces, 4);
  assert.equal(unbeatenSummary.learnedCount, 3);
  assert.equal(unbeatenSummary.titleName, '不敗の世界覇者');
  assert.deepEqual(unbeatenSummary.titles, [
    'メイクデビュー 制覇',
    '弥生賞 制覇',
    '日本ダービー 制覇',
    '凱旋門賞 制覇',
  ]);

  // 2. Week 3（国内G1）+ Week 4（世界頂上決戦）連覇（3勝以下）の場合は路線別の最高称号
  const sprintDoubleG1 = createDefaultCareerHorse({
    name: 'ウインドジェット',
    routeId: 'sprint',
    currentWeek: 4,
    raceHistory: [
      { week: 1, raceName: '1勝クラス（芝1200m）', score: 3, placementText: '2着 🥈 (惜敗)' },
      { week: 2, raceName: 'シルクロードステークス', score: 5, placementText: '1着 🥇 (優勝)' },
      { week: 3, raceName: '高松宮記念', score: 5, placementText: '1着 🥇 (優勝)' },
      { week: 4, raceName: '香港スプリント', score: 5, placementText: '1着 🥇 (優勝)' },
    ],
  });
  assert.equal(determineHorseEpithet(sprintDoubleG1), '電光石火の世界快速王');

  // 3. Week 3（国内G1）のみ制覇時は国内王者称号
  const domesticWinner = createDefaultCareerHorse({
    name: 'ロイヤルクラウン',
    routeId: 'middle',
    currentWeek: 4,
    raceHistory: [
      { week: 1, raceName: 'オープン特別（芝2000m）', score: 3, placementText: '2着 🥈 (惜敗)' },
      { week: 2, raceName: '毎日王冠', score: 3, placementText: '2着 🥈 (惜敗)' },
      { week: 3, raceName: '天皇賞（秋）', score: 5, placementText: '1着 🥇 (優勝)' },
      { week: 4, raceName: 'ジャパンC', score: 4, placementText: '2着 🥈 (惜敗)' },
    ],
  });
  assert.equal(determineHorseEpithet(domesticWinner), '盾を制した中距離の雄');

  // 4. 未勝利でも入着（スコア3以上）多数なら「堅実無比の名バイプレイヤー」
  const silverCollector = createDefaultCareerHorse({
    name: 'シルバーコレクター',
    routeId: 'stayer',
    currentWeek: 4,
    raceHistory: [
      { week: 1, raceName: '1勝クラス（芝2400m）', score: 4, placementText: '2着 🥈 (惜敗)' },
      { week: 2, raceName: '阪神大賞典', score: 3, placementText: '2着 🥈 (惜敗)' },
      { week: 3, raceName: '天皇賞（春）', score: 4, placementText: '2着 🥈 (惜敗)' },
      { week: 4, raceName: 'アスコットゴールドC', score: 2, placementText: '入着 🏇 (4着)' },
    ],
  });
  assert.equal(determineHorseEpithet(silverCollector), '堅実無比の名バイプレイヤー');

  // 5. 殿堂入りレコード作成と次世代誕生（retireAndSpawnNextGeneration）
  const hofRecord = createHallOfFameRecord(unbeaten, '2026-10-18');
  assert.equal(hofRecord.generation, 1);
  assert.equal(hofRecord.name, 'ディープスター');
  assert.equal(hofRecord.retiredDate, '2026-10-18');
  assert.equal(hofRecord.wins, 4);
  assert.equal(hofRecord.titleName, '不敗の世界覇者');

  const handoff = retireAndSpawnNextGeneration(unbeaten, '2026-10-18', {
    name: 'ネクストジェネシス',
    color: '白毛',
    routeId: 'dirt-classic',
  });
  assert.equal(handoff.retiredRecord.generation, 1);
  assert.equal(handoff.retiredRecord.name, 'ディープスター');
  assert.equal(handoff.nextHorse.generation, 2);
  assert.equal(handoff.nextHorse.name, 'ネクストジェネシス');
  assert.equal(handoff.nextHorse.color, '白毛');
  assert.equal(handoff.nextHorse.routeId, 'dirt-classic');
  assert.equal(handoff.nextHorse.currentWeek, 1);
  assert.equal(handoff.nextHorse.weight, DEFAULT_HORSE_WEIGHT);
  assert.deepEqual(handoff.nextHorse.learnedPhraseIdsInCareer, []);
  assert.deepEqual(handoff.nextHorse.raceHistory, []);
  assert.equal(handoff.nextHorse.hasTrained, false);
});


