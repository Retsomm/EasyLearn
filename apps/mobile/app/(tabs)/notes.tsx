import { ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenRoot } from '@/components/Themed';
import { useAppTheme } from '@/context/AppThemeContext';
import { useProgress } from '@/context/ProgressContext';
import { DEFAULT_QUIZ_SESSION, useHomeView } from '@/context/HomeViewContext';
import Notes from '@/screens/Notes';
import QuestionBook from '@/screens/QuestionBook';
import Quiz from '@/screens/Quiz';
import SavedKeyPoints from '@/screens/SavedKeyPoints';
import {
  getSavedQuestions,
  getWrongEntries,
  getWrongQuestions,
  REVIEW_SIZE,
  sampleFixedQuestions,
  sampleQuestions,
} from '@easylearn/core';

// 對照 apps/web App.tsx 裡 notes/wrongbook/savedbook/savedkeypoints/review/savedpractice
// 這幾支 view，差別是這裡範圍只到 Notes tab，跟 Home tab 各自獨立一個狀態機（理由同 index.tsx 的註解）。
// view／Quiz 答題進度（session）都改用 HomeViewContext 的 notesView／notesQuizSession，理由同
// index.tsx：SSO 登入回跳時 (tabs) navigator 可能被重新建立，local state 撐不住，見
// HomeViewContext.tsx。兩者要一起放在 context，只搬 session 不搬 view 的話，重建後畫面會退回
// 精選筆記首頁，session 裡的答題進度就變成畫面對不到的孤兒資料。
export default function NotesScreen() {
  const { progress, hydrated, toggleSaved, toggleSavedKeyPoint, answerQuestion, finishLevel, finishReview } =
    useProgress();
  const { colors } = useAppTheme();
  const { notesView: view, setNotesView: setView, notesQuizSession, setNotesQuizSession } = useHomeView();
  const insets = useSafeAreaInsets();

  if (!hydrated) {
    return (
      <ScreenRoot style={[styles.loading, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.primary} />
      </ScreenRoot>
    );
  }

  const startReview = () => {
    const picked = sampleFixedQuestions(getWrongQuestions(progress.wrongIds), REVIEW_SIZE);
    if (picked.length === 0) return;
    setView({ name: 'review', questions: picked });
    setNotesQuizSession(DEFAULT_QUIZ_SESSION);
  };

  const startSavedPractice = () => {
    const picked = sampleQuestions(getSavedQuestions(progress.savedIds));
    if (picked.length === 0) return;
    setView({ name: 'savedpractice', questions: picked });
    setNotesQuizSession(DEFAULT_QUIZ_SESSION);
  };

  let content;
  if (view.name === 'review') {
    content = (
      <Quiz
        key="review"
        level={{ id: '__review__', title: '錯題重練', questions: view.questions }}
        mode="review"
        progress={progress}
        session={notesQuizSession}
        setSession={setNotesQuizSession}
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
        session={notesQuizSession}
        setSession={setNotesQuizSession}
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
  } else if (view.name === 'savedkeypoints') {
    content = (
      <SavedKeyPoints
        savedKeyPointIds={progress.savedKeyPointIds}
        onToggleSavedKeyPoint={toggleSavedKeyPoint}
        onBack={() => setView({ name: 'notes' })}
      />
    );
  } else {
    content = (
      <Notes
        progress={progress}
        onOpenWrongBook={() => setView({ name: 'wrongbook' })}
        onOpenSavedBook={() => setView({ name: 'savedbook' })}
        onOpenSavedKeyPoints={() => setView({ name: 'savedkeypoints' })}
        onReview={startReview}
        onPracticeSaved={startSavedPractice}
      />
    );
  }

  return <ScreenRoot style={[styles.flexFill, { paddingTop: insets.top }]}>{content}</ScreenRoot>;
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
