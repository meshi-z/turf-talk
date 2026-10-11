import { useState } from 'react';
import { Header } from './components/Header';
import { HomeScreen } from './components/HomeScreen';
import { QuizScreen } from './components/QuizScreen';
import { ResultScreen } from './components/ResultScreen';
import { useTrainingProgress } from './hooks/useTrainingProgress';
import { INITIAL_PHRASES, type PhraseItem } from './data/phrases';

type Screen = 'home' | 'quiz' | 'result';

export function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const { progress, markTrainingCompleted, resetProgressForDemo } = useTrainingProgress();

  // 今日の調教セッション用（初期サンプルから3問抽出）
  const [sessionQuestions, setSessionQuestions] = useState<PhraseItem[]>(() => INITIAL_PHRASES.slice(0, 3));
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answeredHistory, setAnsweredHistory] = useState<{
    phrase: PhraseItem;
    selectedOptionId: string;
    isCorrect: boolean;
  }[]>([]);

  const handleStartTraining = () => {
    // 毎回解き直せるようにリセット（本日の3問）
    setSessionQuestions(INITIAL_PHRASES.slice(0, 3));
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
      // 3問終了 -> 調教完了処理
      const finalScore = score + (answeredHistory[answeredHistory.length - 1]?.isCorrect ? 0 : 0);
      markTrainingCompleted(finalScore);
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
      </div>
    </div>
  );
}

export default App;
