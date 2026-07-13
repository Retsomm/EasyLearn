import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import Icon from '@/components/Icon';
import Mascot from '@/components/Mascot';
import QuestionCard from '@/components/QuestionCard';
import { PrimaryButton, buttonTextStyles } from '@/components/Button';
import { colors, fonts } from '@/constants/theme';
import { getChapterIdForQuestion, getStage, type Level, type Progress } from '@easylearn/core';

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
        <Mascot xp={progress.xp} size="lg" />
        <View style={styles.resultTitleRow}>
          {perfect && <Icon name="trophy" size={24} color={colors.primary} />}
          <Text style={styles.resultTitle}>
            {isReview ? '重練完成！' : isMixed ? '練習完成！' : perfect ? '全對！太神了' : '關卡完成！'}
          </Text>
        </View>
        <View style={styles.resultStats}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>答對題數</Text>
            <Text style={styles.statValue}>
              {correctCount} / {questions.length}
            </Text>
          </View>
          <View style={[styles.statRow, styles.statRowDivider]}>
            <Text style={styles.statLabel}>獲得 XP</Text>
            <Text style={styles.statValue}>
              +{finalXp}
              {firstClear ? '（含首次通關 +20）' : ''}
            </Text>
          </View>
          {isReview && (
            <View style={[styles.statRow, styles.statRowDivider]}>
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
        <PrimaryButton onPress={onExit}>
          <Text style={buttonTextStyles.primary}>{exitLabel}</Text>
        </PrimaryButton>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.quizHeader}>
        <Pressable onPress={onExit} hitSlop={8} style={styles.backBtn}>
          <Icon name="x" size={20} color={colors.cyan} />
        </Pressable>
        <View style={styles.dots}>
          {questions.map((q, i) => (
            <View key={q.id} style={[styles.dot, i < index && styles.dotDone, i === index && styles.dotCurrent]} />
          ))}
        </View>
        <Text style={styles.quizPet}>{getStage(progress.xp).emoji}</Text>
        <Text style={styles.counter}>
          {index + 1}/{questions.length}
        </Text>
      </View>
      {isReview && (
        <View style={styles.banner}>
          <Icon name="rotate-ccw" size={15} color={colors.primary} />
          <Text style={styles.bannerText}>錯題重練模式：答對一次就從錯題本移除，答錯會留到下次</Text>
        </View>
      )}
      {isMixed && (
        <View style={styles.banner}>
          <Icon name="shuffle" size={15} color={colors.primary} />
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
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  quizHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  backBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: 'rgba(95, 240, 224, 0.25)',
    width: 38,
    height: 38,
  },
  dots: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(95, 240, 224, 0.3)',
  },
  dotDone: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dotCurrent: {
    width: 11,
    height: 11,
    borderRadius: 5.5,
    marginTop: -1,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  quizPet: {
    fontSize: 26,
    lineHeight: 30,
  },
  counter: {
    fontFamily: fonts.mono.bold,
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(95, 240, 224, 0.6)',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: 'rgba(95, 240, 224, 0.15)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  bannerText: {
    flex: 1,
    fontFamily: fonts.sans.regular,
    fontSize: 13,
    color: colors.inkSoft,
  },
  resultContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    alignItems: 'center',
    gap: 12,
  },
  resultTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  resultTitle: {
    fontFamily: fonts.mono.bold,
    fontSize: 20,
    fontWeight: '700',
    color: colors.inkStrong,
  },
  resultStats: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.optionBorder,
    width: '100%',
    maxWidth: 320,
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginBottom: 4,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  statRowDivider: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(95, 240, 224, 0.12)',
  },
  statLabel: {
    fontFamily: fonts.sans.regular,
    fontSize: 14,
    color: colors.inkSoft,
  },
  statValue: {
    fontFamily: fonts.mono.regular,
    fontSize: 15,
    color: colors.cyan,
  },
  resultHint: {
    fontFamily: fonts.sans.regular,
    fontSize: 14,
    color: colors.inkSoft,
    textAlign: 'center',
    marginBottom: 12,
  },
});
