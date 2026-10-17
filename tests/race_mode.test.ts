import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateRacePlacement,
  selectRaceQuestions,
  getRacePhasesForWeek,
  getRaceThemeLabel,
  extractDistanceMeters,
  buildPhaseDistanceLabels,
  RACE_PHASES,
  RACE_QUESTION_COUNT,
} from '../src/lib/raceMode.ts';
import { getCurrentWeekRaceInfo } from '../src/lib/careerCycle.ts';
import { INITIAL_PHRASES } from '../src/data/phrases.ts';

test('raceMode: phases metadata integrity', () => {
  assert.equal(RACE_PHASES.length, 5);
  RACE_PHASES.forEach((phase, idx) => {
    assert.equal(phase.step, idx + 1);
    assert.ok(phase.phaseName.length > 0);
    assert.ok(phase.commentary.length > 0);
    assert.ok(phase.correctReaction.length > 0);
    assert.ok(phase.incorrectReaction.length > 0);
  });
});

test('extractDistanceMeters and buildPhaseDistanceLabels: dynamically compute remaining distances', () => {
  assert.equal(extractDistanceMeters('芝 1600m'), 1600);
  assert.equal(extractDistanceMeters('ダート 2000m'), 2000);
  assert.equal(extractDistanceMeters('芝 3200m'), 3200);
  assert.equal(extractDistanceMeters('距離不明'), 2400);

  const labels1600 = buildPhaseDistanceLabels(1600);
  assert.deepEqual(labels1600, [
    '残り 1600m',
    '残り 1000m',
    '残り 600m',
    '残り 300m',
    '残り 100m',
  ]);

  const labels2400 = buildPhaseDistanceLabels(2400);
  assert.deepEqual(labels2400, [
    '残り 2400m',
    '残り 1600m',
    '残り 800m',
    '残り 400m',
    '残り 100m',
  ]);
});

test('getRacePhasesForWeek: returns distinct 5-step commentary and dynamic distance for Weeks 1 to 4', () => {
  const week1Race = getCurrentWeekRaceInfo('classic', 1); // 2歳新馬戦（芝1800m）
  const week2Race = getCurrentWeekRaceInfo('classic', 2); // 弥生賞ディープ記念（G2・芝2000m）
  const week3Race = getCurrentWeekRaceInfo('classic', 3); // 日本ダービー（G1・芝2400m）
  const week4Race = getCurrentWeekRaceInfo('classic', 4); // 凱旋門賞（仏G1・芝2400m）

  const phasesW1 = getRacePhasesForWeek(1, week1Race);
  const phasesW2 = getRacePhasesForWeek(2, week2Race);
  const phasesW3 = getRacePhasesForWeek(3, week3Race);
  const phasesW4 = getRacePhasesForWeek(4, week4Race);

  assert.equal(phasesW1.length, 5);
  assert.equal(phasesW2.length, 5);
  assert.equal(phasesW3.length, 5);
  assert.equal(phasesW4.length, 5);

  // Week 1 vs Week 4 phase names and commentary differ
  assert.notEqual(phasesW1[0].phaseName, phasesW4[0].phaseName);
  assert.notEqual(phasesW1[4].commentary, phasesW3[4].commentary);
  assert.notEqual(phasesW2[4].commentary, phasesW4[4].commentary);

  // Dynamic distance check (1800m vs 2000m vs 2400m)
  assert.equal(phasesW1[0].distanceRemaining, '残り 1800m');
  assert.equal(phasesW2[0].distanceRemaining, '残り 2000m');
  assert.equal(phasesW3[0].distanceRemaining, '残り 2400m');
});

test('getRaceThemeLabel: returns Japanese label for each phrase category', () => {
  assert.equal(getRaceThemeLabel('feel'), '手応え・感触');
  assert.equal(getRaceThemeLabel('tactics'), '仕掛け・展開');
  assert.equal(getRaceThemeLabel('reaction'), '勝負根性・反応');
  assert.equal(getRaceThemeLabel('comment'), '陣営コメント・総括');
});

test('calculateRacePlacement: accurately determines rank from score across Weeks 1 to 4', () => {
  // Default (Week 4)
  const res5 = calculateRacePlacement(5);
  assert.equal(res5.type, '1st');
  assert.ok(res5.rankText.includes('1着'));
  assert.equal(res5.title, '海外G1制覇！歴史的勝利！');

  // Week 1 Debut Win
  const resW1Win = calculateRacePlacement(5, 1);
  assert.equal(resW1Win.type, '1st');
  assert.equal(resW1Win.title, 'デビュー戦快勝！華々しい初陣！');

  // Week 2 Graded Win
  const resW2Win = calculateRacePlacement(5, 2);
  assert.equal(resW2Win.type, '1st');
  assert.equal(resW2Win.title, '前哨戦制覇！大一番へ主役名乗り！');

  // Week 3 Domestic G1 Win
  const resW3Win = calculateRacePlacement(5, 3);
  assert.equal(resW3Win.type, '1st');
  assert.equal(resW3Win.title, '国内G1制覇！世代の頂点に君臨！');

  // 4/5 -> 2nd place
  const res4 = calculateRacePlacement(4, 2);
  assert.equal(res4.type, '2nd');
  assert.ok(res4.rankText.includes('2着'));

  // 3/5 -> Board (3着)
  const res3 = calculateRacePlacement(3, 3);
  assert.equal(res3.type, 'board');
  assert.ok(res3.rankText.includes('3着'));

  // 2/5 -> Board (4着)
  const res2 = calculateRacePlacement(2, 1);
  assert.equal(res2.type, 'board');
  assert.ok(res2.rankText.includes('4着'));

  // 1/5 -> Unplaced (着外)
  const res1 = calculateRacePlacement(1, 1);
  assert.equal(res1.type, 'unplaced');
  assert.ok(res1.rankText.includes('着外'));

  // 0/5 -> Unplaced (着外)
  const res0 = calculateRacePlacement(0, 4);
  assert.equal(res0.type, 'unplaced');
  assert.ok(res0.rankText.includes('着外'));
});

test('selectRaceQuestions: selects exactly 5 questions with options shuffled', () => {
  const selected = selectRaceQuestions(INITIAL_PHRASES, []);
  assert.equal(selected.length, RACE_QUESTION_COUNT);

  // All 5 must have 4 options and valid correct answer
  selected.forEach((q) => {
    assert.equal(q.options.length, 4);
    assert.equal(q.options.filter((o) => o.isCorrect).length, 1);
  });
});

test('selectRaceQuestions: prioritizes learned phrases pool when no theme is specified', () => {
  const learnedIds = ['phrase-001', 'phrase-002', 'phrase-003', 'phrase-004', 'phrase-005'];
  const selected = selectRaceQuestions(INITIAL_PHRASES, learnedIds);
  assert.equal(selected.length, 5);

  const selectedIds = selected.map((q) => q.id);
  // All 5 should come from the learned pool
  learnedIds.forEach((id) => {
    assert.ok(selectedIds.includes(id));
  });
});

test('selectRaceQuestions: prioritizes themeCategory phrases and prefers learned within theme', () => {
  const tacticsPhrases = INITIAL_PHRASES.filter((p) => p.category === 'tactics');
  assert.ok(tacticsPhrases.length >= 5);

  // Mark 3 tactics phrases and 5 non-tactics phrases as learned
  const learnedTacticsIds = tacticsPhrases.slice(0, 3).map((p) => p.id);
  const learnedOtherIds = INITIAL_PHRASES.filter((p) => p.category !== 'tactics')
    .slice(0, 5)
    .map((p) => p.id);

  const selected = selectRaceQuestions(
    INITIAL_PHRASES,
    [...learnedTacticsIds, ...learnedOtherIds],
    'tactics'
  );

  assert.equal(selected.length, 5);
  // All 5 selected questions must be 'tactics' category
  selected.forEach((q) => {
    assert.equal(q.category, 'tactics');
  });

  // All 3 learned tactics phrases must be included first
  const selectedIds = selected.map((q) => q.id);
  learnedTacticsIds.forEach((id) => {
    assert.ok(selectedIds.includes(id));
  });
});

