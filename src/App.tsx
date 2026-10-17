import { useState } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomeScreen } from './components/HomeScreen';
import { QuizScreen } from './components/QuizScreen';
import { ResultScreen } from './components/ResultScreen';
import { RaceScreen } from './components/RaceScreen';
import { RaceResultScreen } from './components/RaceResultScreen';
import { useTrainingProgress } from './hooks/useTrainingProgress';
import { INITIAL_PHRASES, type PhraseItem } from './data/phrases';
import {
  selectDailyPhrases,
  selectExtraTrainingPhrases,
  getPhrasesByIds,
} from './lib/dailyRotation';
import { selectRaceQuestions } from './lib/raceMode';
import { soundManager } from './lib/sound';

type Screen = 'home' | 'quiz' | 'result' | 'race' | 'race-result';

export function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const {
    progress,
    recordTodayPhrases,
    markTrainingCompleted,
    resetProgressForDemo,
    todayString,
    appMode,
    effectiveDayOfWeek,
    actualDayOfWeek,
    daysUntilWeekend,
    debugDayOfWeek,
    setDebugDayOfWeek,
    debugWeekdayDays,
    setDebugWeekdayDays,
    effectiveWeekdayDays,
    debugCarrotCount,
    setDebugCarrotCount,
    conditionTier,
    markRaceCompleted,
  } = useTrainingProgress();

  const [raceRemainingReserves, setRaceRemainingReserves] = useState<number>(0);
  const [raceCarrotReward, setRaceCarrotReward] = useState<number>(0);

  // 今日の調教セッション用（日付シードと履修履歴から日替わり選出 & 選択肢シャッフル）
  const [sessionQuestions, setSessionQuestions] = useState<PhraseItem[]>(() => {
    if (progress.todayPhraseIds.length > 0) {
      const existing = getPhrasesByIds(INITIAL_PHRASES, progress.todayPhraseIds);
      if (existing.length > 0) return existing;
    }
    return selectDailyPhrases(INITIAL_PHRASES, progress.learnedPhraseIds, todayString).questions;
  });
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answeredHistory, setAnsweredHistory] = useState<{
    phrase: PhraseItem;
    selectedOptionId: string;
    isCorrect: boolean;
  }[]>([]);

  const handleStartTraining = () => {
    let questions: PhraseItem[] = [];

    // 本日の調教が完了している場合（復習モード）、または既に本日の出題フレーズが決定している場合
    if (progress.todayPhraseIds.length > 0) {
      questions = getPhrasesByIds(INITIAL_PHRASES, progress.todayPhraseIds);
    }

    // まだ本日の出題セットがない場合は選出して記録
    if (questions.length === 0) {
      const selected = selectDailyPhrases(
        INITIAL_PHRASES,
        progress.learnedPhraseIds,
        todayString
      );
      questions = selected.questions;
      recordTodayPhrases(questions.map((q) => q.id));
    }

    setSessionQuestions(questions);
    setCurrentQuestionIndex(0);
    setScore(0);
    setAnsweredHistory([]);
    setCurrentScreen('quiz');
  };

  const handleStartExtraTraining = () => {
    const selected = selectExtraTrainingPhrases(
      INITIAL_PHRASES,
      progress.learnedPhraseIds
    );
    setSessionQuestions(selected.questions);
    setCurrentQuestionIndex(0);
    setScore(0);
    setAnsweredHistory([]);
    setCurrentScreen('quiz');
  };

  const handleAnswerQuestion = (optionId: string, isCorrect: boolean) => {
    const currentItem = sessionQuestions[currentQuestionIndex];
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }
    setAnsweredHistory((prev) => [
      ...prev,
      { phrase: currentItem, selectedOptionId: optionId, isCorrect },
    ]);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex + 1 < sessionQuestions.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      // 3問終了 -> 調教完了処理（正答したフレーズIDのみを習得済みとして記録）
      const correctPhraseIds = answeredHistory
        .filter((item) => item.isCorrect)
        .map((item) => item.phrase.id);
      const sessionPhraseIds = sessionQuestions.map((q) => q.id);
      markTrainingCompleted(score, correctPhraseIds, sessionPhraseIds);
      setCurrentScreen('result');
    }
  };

  // 週末レースセッション用
  const [raceQuestions, setRaceQuestions] = useState<PhraseItem[]>([]);
  const [raceCurrentIndex, setRaceCurrentIndex] = useState(0);
  const [raceScore, setRaceScore] = useState(0);
  const [raceAnsweredHistory, setRaceAnsweredHistory] = useState<{
    phrase: PhraseItem;
    selectedOptionId: string;
    isCorrect: boolean;
  }[]>([]);

  const handleStartRace = () => {
    soundManager.playGateOpen();
    const questions = selectRaceQuestions(INITIAL_PHRASES, progress.learnedPhraseIds);
    setRaceQuestions(questions);
    setRaceCurrentIndex(0);
    setRaceScore(0);
    setRaceAnsweredHistory([]);
    setRaceRemainingReserves(conditionTier.hintCount);
    setRaceCarrotReward(0);
    setCurrentScreen('race');
  };

  const handleAnswerRaceQuestion = (optionId: string, isCorrect: boolean) => {
    const currentItem = raceQuestions[raceCurrentIndex];
    if (isCorrect) {
      setRaceScore((prev) => prev + 1);
    }
    setRaceAnsweredHistory((prev) => [
      ...prev,
      { phrase: currentItem, selectedOptionId: optionId, isCorrect },
    ]);
  };

  const handleNextRaceQuestion = () => {
    if (raceCurrentIndex + 1 < raceQuestions.length) {
      setRaceCurrentIndex((prev) => prev + 1);
    } else {
      // 5問終了 -> レース完了ステータス更新 & 余力温存にんじん獲得 & レース結果画面へ
      const result = markRaceCompleted(raceScore, raceRemainingReserves);
      setRaceCarrotReward(result.carrotBonus.addedCarrots);
      setCurrentScreen('race-result');
    }
  };

  const handleCancelQuiz = () => {
    setCurrentScreen('home');
  };

  const handleGoHome = () => {
    setCurrentScreen('home');
  };

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col justify-start items-center text-zinc-900 selection:bg-emerald-200">
      <div className="w-full max-w-md bg-zinc-50 min-h-screen flex flex-col border-x border-zinc-200/60 shadow-lg">
        <Header streakDays={progress.streakDays} />

        <main className="flex-1 flex flex-col">
          {currentScreen === 'home' && (
            <HomeScreen
              progress={progress}
              onStartTraining={handleStartTraining}
              onStartExtraTraining={handleStartExtraTraining}
              onStartRace={handleStartRace}
              onResetForDemo={resetProgressForDemo}
              appMode={appMode}
              effectiveDayOfWeek={effectiveDayOfWeek}
              actualDayOfWeek={actualDayOfWeek}
              daysUntilWeekend={daysUntilWeekend}
              debugDayOfWeek={debugDayOfWeek}
              onSetDebugDayOfWeek={setDebugDayOfWeek}
              debugWeekdayDays={debugWeekdayDays}
              onSetDebugWeekdayDays={setDebugWeekdayDays}
              effectiveWeekdayDays={effectiveWeekdayDays}
              debugCarrotCount={debugCarrotCount}
              onSetDebugCarrotCount={setDebugCarrotCount}
            />
          )}

          {currentScreen === 'quiz' && (
            <QuizScreen
              questions={sessionQuestions}
              currentIndex={currentQuestionIndex}
              onAnswer={handleAnswerQuestion}
              onNext={handleNextQuestion}
              onCancel={handleCancelQuiz}
            />
          )}

          {currentScreen === 'result' && (
            <ResultScreen
              score={score}
              totalQuestions={sessionQuestions.length}
              progress={progress}
              answeredHistory={answeredHistory}
              onGoHome={handleGoHome}
            />
          )}

          {currentScreen === 'race' && (
            <RaceScreen
              questions={raceQuestions}
              currentIndex={raceCurrentIndex}
              initialHints={conditionTier.hintCount}
              onAnswer={handleAnswerRaceQuestion}
              onNext={handleNextRaceQuestion}
              onCancel={handleCancelQuiz}
              onHintsRemainingChange={setRaceRemainingReserves}
            />
          )}

          {currentScreen === 'race-result' && (
            <RaceResultScreen
              score={raceScore}
              totalQuestions={raceQuestions.length}
              progress={progress}
              answeredHistory={raceAnsweredHistory}
              addedCarrots={raceCarrotReward}
              onGoHome={handleGoHome}
              onRetryRace={handleStartRace}
            />
          )}
        </main>

        <Footer />
      </div>
    </div>
  );
}

export default App;
