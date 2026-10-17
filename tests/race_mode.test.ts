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
  RACE_VOCABULARY_COUNT,
  RACE_PHRASE_COUNT,
} from '../src/lib/raceMode.ts';
import { getCurrentWeekRaceInfo } from '../src/lib/careerCycle.ts';
import { eliminateOneWrongOption } from '../src/lib/conditionBonus.ts';
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

test('selectRaceQuestions: hybrid question structure (Q1-Q2 vocabulary, Q3-Q5 phrase)', () => {
  const selected = selectRaceQuestions(INITIAL_PHRASES, []);
  assert.equal(selected.length, RACE_QUESTION_COUNT);
  assert.equal(RACE_VOCABULARY_COUNT, 2);
  assert.equal(RACE_PHRASE_COUNT, 3);

  // Q1 and Q2 must be vocabulary (ウッドチップ調教の基礎単語)
  assert.equal(selected[0].type, 'vocabulary', 'Question 1 must be vocabulary');
  assert.equal(selected[1].type, 'vocabulary', 'Question 2 must be vocabulary');
  assert.ok(selected[0].id.startsWith('vocab-'), 'Question 1 ID should start with vocab-');
  assert.ok(selected[1].id.startsWith('vocab-'), 'Question 2 ID should start with vocab-');

  // Q3, Q4, Q5 must be phrases (坂路調教の実戦フレーズ)
  assert.notEqual(selected[2].type, 'vocabulary', 'Question 3 must be phrase');
  assert.notEqual(selected[3].type, 'vocabulary', 'Question 4 must be phrase');
  assert.notEqual(selected[4].type, 'vocabulary', 'Question 5 must be phrase');
  assert.ok(selected[2].id.startsWith('phrase-'), 'Question 3 ID should start with phrase-');
  assert.ok(selected[3].id.startsWith('phrase-'), 'Question 4 ID should start with phrase-');
  assert.ok(selected[4].id.startsWith('phrase-'), 'Question 5 ID should start with phrase-');

  // All 5 must have 4 options and valid correct answer
  selected.forEach((q) => {
    assert.equal(q.options.length, 4);
    assert.equal(q.options.filter((o) => o.isCorrect).length, 1);
  });
});

test('selectRaceQuestions: prioritizes learned pool across vocabulary and phrases', () => {
  const learnedVocabIds = ['vocab-001', 'vocab-002'];
  const learnedPhraseIds = ['phrase-001', 'phrase-002', 'phrase-003'];
  const learnedIds = [...learnedVocabIds, ...learnedPhraseIds];

  const selected = selectRaceQuestions(INITIAL_PHRASES, learnedIds);
  assert.equal(selected.length, 5);

  const selectedIds = selected.map((q) => q.id);
  // All 5 should come from the learned pool
  learnedIds.forEach((id) => {
    assert.ok(selectedIds.includes(id), `Selected questions should include learned item ${id}`);
  });
});

test('selectRaceQuestions: prioritizes themeCategory across vocabulary and phrases', () => {
  const tacticsVocab = INITIAL_PHRASES.filter((p) => p.type === 'vocabulary' && p.category === 'tactics');
  const tacticsPhrase = INITIAL_PHRASES.filter((p) => p.type !== 'vocabulary' && p.category === 'tactics');

  assert.ok(tacticsVocab.length >= 2, 'Should have at least 2 tactics vocabularies');
  assert.ok(tacticsPhrase.length >= 3, 'Should have at least 3 tactics phrases');

  // Mark 1 tactics vocab and 2 tactics phrases as learned
  const learnedVocabId = tacticsVocab[0].id;
  const learnedPhraseIds = [tacticsPhrase[0].id, tacticsPhrase[1].id];

  const otherLearnedIds = INITIAL_PHRASES.filter((p) => p.category !== 'tactics')
    .slice(0, 5)
    .map((p) => p.id);

  const selected = selectRaceQuestions(
    INITIAL_PHRASES,
    [learnedVocabId, ...learnedPhraseIds, ...otherLearnedIds],
    'tactics'
  );

  assert.equal(selected.length, 5);

  // All 5 selected questions must be 'tactics' category
  selected.forEach((q) => {
    assert.equal(q.category, 'tactics', `Question ${q.id} must belong to theme category tactics`);
  });

  // Learned items within theme must be included
  const selectedIds = selected.map((q) => q.id);
  assert.ok(selectedIds.includes(learnedVocabId), 'Learned tactics vocab should be prioritized');
  learnedPhraseIds.forEach((id) => {
    assert.ok(selectedIds.includes(id), `Learned tactics phrase ${id} should be prioritized`);
  });
});

test('raceMode: eliminateOneWrongOption works seamlessly for both vocabulary and phrase questions', () => {
  const selected = selectRaceQuestions(INITIAL_PHRASES, []);
  assert.equal(selected.length, 5);

  // Q1 is vocabulary
  const vocabQuestion = selected[0];
  assert.equal(vocabQuestion.type, 'vocabulary');
  const eliminatedVocab = eliminateOneWrongOption(vocabQuestion.options, []);
  assert.ok(eliminatedVocab, 'Should eliminate one wrong option for vocabulary question');
  const vocabCorrectOpt = vocabQuestion.options.find((o) => o.isCorrect);
  assert.notEqual(eliminatedVocab, vocabCorrectOpt?.id, 'Correct option must not be eliminated for vocabulary');

  // Q3 is phrase
  const phraseQuestion = selected[2];
  assert.notEqual(phraseQuestion.type, 'vocabulary');
  const eliminatedPhrase = eliminateOneWrongOption(phraseQuestion.options, []);
  assert.ok(eliminatedPhrase, 'Should eliminate one wrong option for phrase question');
  const phraseCorrectOpt = phraseQuestion.options.find((o) => o.isCorrect);
  assert.notEqual(eliminatedPhrase, phraseCorrectOpt?.id, 'Correct option must not be eliminated for phrase');
});

