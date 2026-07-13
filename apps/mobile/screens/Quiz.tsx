import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import Icon from '@/components/Icon';
import QuestionCard from '@/components/QuestionCard';
import { getChapterIdForQuestion, type Level, type Progress } from '@easylearn/core';

const XP_CORRECT = 10;
const XP_WRONG = 2;
const XP_FIRST_CLEAR_BONUS = 20;

interface QuizProps {
  level: Level;
  mode?: 'normal' | 'review' | 'mixed';
  progress: Progress;
  answerQuestion: (questionId: string, correct: boolean, chapterId?: string) => void;
  toggleSaved: (questionId: string) => void;
  finishLevel: (levelId: string, correct: number, total: number, xpEarned: number) => void;
  finishReview: (xpEarned: number) => void;
  onExit: () => void;
  exitLabel?: string;
}

// 對照 apps/web 的 Quiz.tsx；exitLabel 取代 web 版用 `exitTo` 字串反推按鈕文字的作法，
// 因為 mobile 這裡只需要顯示文字、不需要 web 那邊「同一個字串也決定要導去哪一頁」的雙重用途
export default function Quiz({
  level,
  mode = 'normal',
  progress,
  answerQuestion,
  toggleSaved,
  finishLevel,
  finishReview,
  onExit,
  exitLabel = '返回關卡地圖',
}: QuizProps) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [done, setDone] = useState(false);
  const [finalXp, setFinalXp] = useState(0);

  const isReview = mode === 'review';
  const isMixed = mode === 'mixed';
  const skipsLevelProgress = isReview || isMixed;
  const questions = level.questions;
  const question = questions[index];
  const firstClear = !skipsLevelProgress && !progress.completedLevels[level.id];

  const handleSelect = (optId: string) => {
    setSelected(optId);
    const isCorrect = optId === question.answer;
    answerQuestion(question.id, isCorrect, getChapterIdForQuestion(question.id));
    if (isCorrect) setCorrectCount((c) => c + 1);
    setXpEarned((x) => x + (isCorrect ? XP_CORRECT : XP_WRONG));
  };

  const handleNext = () => {
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setSelected(null);
    } else {
      const bonus = firstClear ? XP_FIRST_CLEAR_BONUS : 0;
      const total = xpEarned + bonus;
      if (skipsLevelProgress) {
        finishReview(total);
      } else {
        finishLevel(level.id, correctCount, questions.length, total);
      }
      setFinalXp(total);
      setDone(true);
    }
  };

  if (done) {
    const perfect = correctCount === questions.length;
    return (
      <ScrollView contentContainerStyle={styles.resultContainer}>
        <Text style={styles.resultTitle}>
          {perfect && '🏆 '}
          {isReview ? '重練完成！' : isMixed ? '練習完成！' : perfect ? '全對！太神了' : '關卡完成！'}
        </Text>
        <View style={styles.resultStats}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>答對題數</Text>
            <Text style={styles.statValue}>
              {correctCount} / {questions.length}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>獲得 XP</Text>
            <Text style={styles.statValue}>
              +{finalXp}
              {firstClear ? '（含首次通關 +20）' : ''}
            </Text>
          </View>
          {isReview && (
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>畢業的錯題</Text>
              <Text style={styles.statValue}>{questions.filter((q) => !progress.wrongIds[q.id]).length} 題</Text>
            </View>
          )}
        </View>
        <Text style={styles.resultHint}>
          {isReview && questions.some((q) => progress.wrongIds[q.id])
            ? '答對一次就會從錯題本移除，還沒答對的之後可以再挑戰！'
            : '你的星球又長大了一點，明天也要回來澆灌它喔！'}
        </Text>
        <Pressable style={styles.primaryBtn} onPress={onExit}>
          <Text style={styles.primaryBtnText}>{exitLabel}</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.quizHeader}>
        <Pressable onPress={onExit} hitSlop={8}>
          <Icon name="x" size={18} />
        </Pressable>
        <View style={styles.dots}>
          {questions.map((q, i) => (
            <View
              key={q.id}
              style={[styles.dot, i < index && styles.dotDone, i === index && styles.dotCurrent]}
            />
          ))}
        </View>
        <Text style={styles.counter}>
          {index + 1}/{questions.length}
        </Text>
      </View>
      {isReview && (
        <View style={styles.banner}>
          <Icon name="rotate-ccw" size={13} />
          <Text style={styles.bannerText}>錯題重練模式：答對一次就從錯題本移除，答錯會留到下次</Text>
        </View>
      )}
      {isMixed && (
        <View style={styles.banner}>
          <Icon name="shuffle" size={13} />
          <Text style={styles.bannerText}>隨機綜合練習：跨章節抽題，不影響關卡進度</Text>
        </View>
      )}
      <QuestionCard
        question={question}
        selected={selected}
        onSelect={handleSelect}
        onNext={handleNext}
        isLast={index + 1 === questions.length}
        saved={!!progress.savedIds[question.id]}
        onToggleSave={toggleSaved}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 4,
  },
  quizHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  dots: {
    flex: 1,
    flexDirection: 'row',
    gap: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#88889930',
  },
  dotDone: {
    backgroundColor: '#2f9e44',
  },
  dotCurrent: {
    backgroundColor: '#2e78b7',
  },
  counter: {
    fontSize: 12,
    opacity: 0.65,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2e78b722',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  bannerText: {
    flex: 1,
    fontSize: 12,
  },
  resultContainer: {
    flexGrow: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  resultStats: {
    width: '100%',
    gap: 10,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  resultHint: {
    fontSize: 13,
    textAlign: 'center',
    opacity: 0.7,
  },
  primaryBtn: {
    backgroundColor: '#2e78b7',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
