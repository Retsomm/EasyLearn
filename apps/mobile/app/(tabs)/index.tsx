import { useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';

import { View } from '@/components/Themed';
import { useProgress } from '@/hooks/useProgress';
import Home from '@/screens/Home';
import ChapterMap from '@/screens/ChapterMap';
import Quiz from '@/screens/Quiz';
import { chapters, getLevel, MIXED_SIZE, sampleQuestions, shuffle, type Question } from '@easylearn/core';

type ViewState =
  | { name: 'home' }
  | { name: 'levellist'; chapterId: string }
  | { name: 'quiz'; levelId: string; questions: Question[] }
  | { name: 'mixed'; questions: Question[] };

// Phase 3：訪客模式離線答題流程。跟 apps/web 的 App.tsx 一樣用一個 view 狀態機切畫面，
// 差別是這裡範圍只到 Home tab（levellist/quiz/mixed 都是從這個 tab 進去的子畫面），
// notes/stats tab 各自獨立，不需要共用同一個狀態機。
export default function HomeScreen() {
  const { progress, hydrated, answerQuestion, toggleSaved, finishLevel, finishReview } = useProgress();
  const [view, setView] = useState<ViewState>({ name: 'home' });

  if (!hydrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
      </View>
    );
  }

  const startLevel = (levelId: string) => {
    const level = getLevel(levelId);
    if (!level) return;
    setView({ name: 'quiz', levelId, questions: sampleQuestions(level.questions) });
  };

  const startMixedPractice = () => {
    const pool = chapters.flatMap((ch) => ch.levels.flatMap((l) => l.questions));
    const picked = shuffle(pool).slice(0, MIXED_SIZE).sort((a, b) => a.difficulty - b.difficulty);
    setView({ name: 'mixed', questions: picked });
  };

  if (view.name === 'quiz') {
    const level = getLevel(view.levelId);
    if (!level) return null;
    const chapterId = chapters.find((ch) => ch.levels.some((l) => l.id === view.levelId))?.id ?? '';
    return (
      <Quiz
        key={view.levelId}
        level={{ ...level, questions: view.questions }}
        progress={progress}
        answerQuestion={answerQuestion}
        toggleSaved={toggleSaved}
        finishLevel={finishLevel}
        finishReview={finishReview}
        onExit={() => setView({ name: 'levellist', chapterId })}
      />
    );
  }

  if (view.name === 'mixed') {
    return (
      <Quiz
        key="mixed"
        level={{ id: '__mixed__', title: '隨機綜合練習', questions: view.questions }}
        mode="mixed"
        progress={progress}
        answerQuestion={answerQuestion}
        toggleSaved={toggleSaved}
        finishLevel={finishLevel}
        finishReview={finishReview}
        onExit={() => setView({ name: 'home' })}
        exitLabel="回首頁"
      />
    );
  }

  if (view.name === 'levellist') {
    return (
      <ChapterMap
        chapterId={view.chapterId}
        progress={progress}
        onStartLevel={startLevel}
        onBack={() => setView({ name: 'home' })}
      />
    );
  }

  return (
    <Home
      progress={progress}
      onOpenChapter={(chapterId) => setView({ name: 'levellist', chapterId })}
      onMixedPractice={startMixedPractice}
    />
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
