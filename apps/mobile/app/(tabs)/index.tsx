import { ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenRoot } from '@/components/Themed';
import { useAppTheme } from '@/context/AppThemeContext';
import { useProgress } from '@/context/ProgressContext';
import { DEFAULT_QUIZ_SESSION, useHomeView, type ViewState } from '@/context/HomeViewContext';
import Home from '@/screens/Home';
import ChapterMap from '@/screens/ChapterMap';
import TopicBooks from '@/screens/TopicBooks';
import Quiz from '@/screens/Quiz';
import { chapters, getTopicForChapter, getLevel, LEVEL_SIZE, MIXED_SIZE, sampleFixedQuestions } from '@easylearn/core';

// 跟 apps/web 的 App.tsx 一樣用一個 view 狀態機切畫面，差別是這裡範圍只到 Home tab
// （levellist/quiz/mixed 都是從這個 tab 進去的子畫面），notes/stats tab 各自獨立，不需要共用
// 同一個狀態機。進度資料（訪客 AsyncStorage／登入後打 API）統一由 ProgressProvider 提供，
// 跟 Profile tab 共用同一份 state。view／quizSession 改用 HomeViewContext（掛在 Stack 之上）
// 而不是這裡的 local state：SSO 登入導回時 (tabs) navigator 會被重新建立一次，local state
// 會被清空，掛在 Stack 之上的 Context 才不受影響，詳見 HomeViewContext.tsx 的說明。
export default function HomeScreen() {
  const { colors } = useAppTheme();
  const { progress, hydrated, answerQuestion, toggleSaved, finishLevel, finishReview } = useProgress();
  const { view, setView, quizSession, setQuizSession } = useHomeView();
  const insets = useSafeAreaInsets();

  if (!hydrated) {
    return (
      <ScreenRoot style={[styles.loading, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.primary} />
      </ScreenRoot>
    );
  }

  const startLevel = (levelId: string) => {
    const level = getLevel(levelId);
    if (!level) return;
    setView({ name: 'quiz', levelId, questions: sampleFixedQuestions(level.questions, LEVEL_SIZE) });
    setQuizSession(DEFAULT_QUIZ_SESSION);
  };

  const startMixedPractice = () => {
    const pool = chapters.flatMap((ch) => ch.levels.flatMap((l) => l.questions));
    const picked = sampleFixedQuestions(pool, MIXED_SIZE);
    setView({ name: 'mixed', questions: picked });
    setQuizSession(DEFAULT_QUIZ_SESSION);
  };

  let content;
  if (view.name === 'quiz') {
    const level = getLevel(view.levelId);
    if (!level) return null;
    const chapterId = chapters.find((ch) => ch.levels.some((l) => l.id === view.levelId))?.id ?? '';
    content = (
      <Quiz
        key={view.levelId}
        level={{ ...level, questions: view.questions }}
        progress={progress}
        session={quizSession}
        setSession={setQuizSession}
        answerQuestion={answerQuestion}
        toggleSaved={toggleSaved}
        finishLevel={finishLevel}
        finishReview={finishReview}
        onExit={() => setView({ name: 'levellist', chapterId })}
      />
    );
  } else if (view.name === 'mixed') {
    content = (
      <Quiz
        key="mixed"
        level={{ id: '__mixed__', title: '隨機綜合練習', questions: view.questions }}
        mode="mixed"
        progress={progress}
        session={quizSession}
        setSession={setQuizSession}
        answerQuestion={answerQuestion}
        toggleSaved={toggleSaved}
        finishLevel={finishLevel}
        finishReview={finishReview}
        onExit={() => setView({ name: 'home' })}
        exitLabel="回首頁"
      />
    );
  } else if (view.name === 'topicbooks') {
    content = (
      <TopicBooks
        topicId={view.topicId}
        progress={progress}
        onOpenChapter={(chapterId) => setView({ name: 'levellist', chapterId })}
        onBack={() => setView({ name: 'home' })}
      />
    );
  } else if (view.name === 'levellist') {
    // 如果這一章屬於「一本書底下有好幾章」的分組，返回鍵要回到章節列表，不是直接回首頁
    const topic = getTopicForChapter(view.chapterId);
    const backView: ViewState =
      topic && topic.chapters.length > 1 ? { name: 'topicbooks', topicId: topic.id } : { name: 'home' };
    content = (
      <ChapterMap
        chapterId={view.chapterId}
        progress={progress}
        onStartLevel={startLevel}
        onBack={() => setView(backView)}
      />
    );
  } else {
    content = (
      <Home
        progress={progress}
        onOpenChapter={(chapterId) => setView({ name: 'levellist', chapterId })}
        onOpenTopic={(topicId) => setView({ name: 'topicbooks', topicId })}
        onMixedPractice={startMixedPractice}
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
