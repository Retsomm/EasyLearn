import { useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { View } from '@/components/Themed';
import { useProgress } from '@/context/ProgressContext';
import Notes from '@/screens/Notes';
import QuestionBook from '@/screens/QuestionBook';
import Quiz from '@/screens/Quiz';
import {
  getSavedQuestions,
  getWrongEntries,
  getWrongQuestions,
  REVIEW_SIZE,
  sampleQuestions,
  shuffle,
  type Question,
} from '@easylearn/core';

type ViewState =
  | { name: 'notes' }
  | { name: 'wrongbook' }
  | { name: 'savedbook' }
  | { name: 'review'; questions: Question[] }
  | { name: 'savedpractice'; questions: Question[] };

// 對照 apps/web App.tsx 裡 notes/wrongbook/savedbook/review/savedpractice 這幾支 view，
// 差別是這裡範圍只到 Notes tab，跟 Home tab 各自獨立一個狀態機（理由同 index.tsx 的註解）
export default function NotesScreen() {
  const { progress, hydrated, toggleSaved, answerQuestion, finishLevel, finishReview } = useProgress();
  const [view, setView] = useState<ViewState>({ name: 'notes' });
  const insets = useSafeAreaInsets();

  if (!hydrated) {
    return (
      <View style={[styles.loading, { paddingTop: insets.top }]}>
        <ActivityIndicator />
      </View>
    );
  }

  const startReview = () => {
    const picked = shuffle(getWrongQuestions(progress.wrongIds)).slice(0, REVIEW_SIZE);
    if (picked.length === 0) return;
    setView({ name: 'review', questions: picked });
  };

  const startSavedPractice = () => {
    const picked = sampleQuestions(getSavedQuestions(progress.savedIds));
    if (picked.length === 0) return;
    setView({ name: 'savedpractice', questions: picked });
  };

  let content;
  if (view.name === 'review') {
    content = (
      <Quiz
        key="review"
        level={{ id: '__review__', title: '錯題重練', questions: view.questions }}
        mode="review"
        progress={progress}
        answerQuestion={answerQuestion}
        toggleSaved={toggleSaved}
        finishLevel={finishLevel}
        finishReview={finishReview}
        onExit={() => setView({ name: 'notes' })}
        exitLabel="回精選筆記"
      />
    );
  } else if (view.name === 'savedpractice') {
    content = (
      <Quiz
        key="savedpractice"
        level={{ id: '__saved__', title: '收藏題庫練習', questions: view.questions }}
        mode="mixed"
        progress={progress}
        answerQuestion={answerQuestion}
        toggleSaved={toggleSaved}
        finishLevel={finishLevel}
        finishReview={finishReview}
        onExit={() => setView({ name: 'notes' })}
        exitLabel="回精選筆記"
      />
    );
  } else if (view.name === 'wrongbook') {
    content = (
      <QuestionBook
        kind="wrong"
        entries={getWrongEntries(progress.wrongIds)}
        savedIds={progress.savedIds}
        onToggleSave={toggleSaved}
        onBack={() => setView({ name: 'notes' })}
        onReview={startReview}
      />
    );
  } else if (view.name === 'savedbook') {
    content = (
      <QuestionBook
        kind="saved"
        entries={getSavedQuestions(progress.savedIds)}
        savedIds={progress.savedIds}
        onToggleSave={toggleSaved}
        onBack={() => setView({ name: 'notes' })}
      />
    );
  } else {
    content = (
      <Notes
        progress={progress}
        onOpenWrongBook={() => setView({ name: 'wrongbook' })}
        onOpenSavedBook={() => setView({ name: 'savedbook' })}
        onReview={startReview}
        onPracticeSaved={startSavedPractice}
      />
    );
  }

  return <View style={[styles.flexFill, { paddingTop: insets.top }]}>{content}</View>;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flexFill: {
    flex: 1,
  },
});
