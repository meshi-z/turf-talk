import { useState } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomeScreen } from './components/HomeScreen';
import { QuizScreen } from './components/QuizScreen';
import { ResultScreen } from './components/ResultScreen';
import { useTrainingProgress } from './hooks/useTrainingProgress';
import { INITIAL_PHRASES, type PhraseItem } from './data/phrases';
import { selectDailyPhrases, getPhrasesByIds } from './lib/dailyRotation';

type Screen = 'home' | 'quiz' | 'result';

export function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const { progress, recordTodayPhrases, markTrainingCompleted, resetProgressForDemo, todayString } = useTrainingProgress();

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
              onResetForDemo={resetProgressForDemo}
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
        </main>

        <Footer />
      </div>
    </div>
  );
}

export default App;
