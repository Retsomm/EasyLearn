import { useMemo } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import Icon from '@/components/Icon';
import CodeBlock from '@/components/CodeBlock';
import NotchedView from '@/components/NotchedView';
import { PrimaryButton } from '@/components/Button';
import { colors, fonts, notch } from '@/constants/theme';
import { shuffle, TYPE_META, type Question } from '@easylearn/core';

interface QuestionCardProps {
  question: Question;
  selected: string | null;
  onSelect: (optId: string) => void;
  onNext: () => void;
  isLast: boolean;
  saved: boolean;
  onToggleSave: (questionId: string) => void;
}

export default function QuestionCard({
  question,
  selected,
  onSelect,
  onNext,
  isLast,
  saved,
  onToggleSave,
}: QuestionCardProps) {
  const answered = selected !== null;
  const correct = answered && selected === question.answer;
  const typeMeta = TYPE_META[question.type];
  const options = useMemo(() => shuffle(question.options), [question.options]);

  return (
    <NotchedView
      notch={notch}
      corners="tr-bl"
      backgroundColor={colors.card}
      borderColor="rgba(95, 240, 224, 0.2)"
      borderWidth={1}
      contentStyle={styles.card}
    >
      <View style={styles.metaRow}>
        <View style={styles.typeBadge}>
          <Icon name={typeMeta.icon} size={14} color={colors.primary} />
          <Text style={styles.typeBadgeText}>{typeMeta.label}</Text>
        </View>
        <Text style={styles.topicLabel} numberOfLines={1}>
          {question.topic}
        </Text>
        <Pressable onPress={() => onToggleSave(question.id)} hitSlop={8} style={styles.saveBtn}>
          <Icon name="star" size={18} color={saved ? colors.primary : colors.inkFaint} fill={saved ? colors.primary : 'none'} />
        </Pressable>
      </View>

      <Text style={styles.prompt}>{question.prompt}</Text>
      <CodeBlock code={question.code} />

      <View style={styles.options}>
        {options.map((opt) => {
          const isAnswer = opt.id === question.answer;
          const isPicked = opt.id === selected;
          return (
            <Pressable
              key={opt.id}
              disabled={answered}
              onPress={() => onSelect(opt.id)}
              style={[
                styles.optionBtn,
                answered && isAnswer && styles.optionCorrect,
                answered && !isAnswer && isPicked && styles.optionWrong,
                answered && !isAnswer && !isPicked && styles.optionDimmed,
              ]}
            >
              {opt.code && <CodeBlock code={opt.code} scroll={false} />}
              <Text
                style={[
                  styles.optionText,
                  answered && isAnswer && styles.optionTextCorrect,
                  answered && !isAnswer && isPicked && styles.optionTextWrong,
                ]}
              >
                {opt.text}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {answered && (
        <View style={[styles.feedback, correct ? styles.feedbackCorrect : styles.feedbackWrong]}>
          <View style={styles.feedbackTitleRow}>
            <Icon
              name={correct ? 'check-circle' : 'lightbulb'}
              size={20}
              color={correct ? colors.correct : colors.wrong}
            />
            <Text style={[styles.feedbackTitle, { color: correct ? colors.correct : colors.wrong }]}>
              {correct ? '答對了！+10 XP' : '沒關係，弄懂它才是重點 +2 XP'}
            </Text>
          </View>
          <Text style={styles.feedbackExplanation}>{question.explanation}</Text>
          {question.docs && (
            <Pressable onPress={() => Linking.openURL(question.docs).catch(() => {})} style={styles.docsLink}>
              <Icon name="book-open" size={16} color={colors.cyan} />
              <Text style={styles.docsLinkText}>延伸閱讀：官方文件</Text>
            </Pressable>
          )}
          <PrimaryButton onPress={onNext} style={styles.nextBtnWrap} contentStyle={styles.nextBtnContent}>
            <Text style={styles.nextBtnText}>{isLast ? '看結算' : '下一題'}</Text>
            <Icon name={isLast ? 'flag' : 'arrow-right'} size={18} color={colors.primaryInk} />
          </PrimaryButton>
        </View>
      )}
    </NotchedView>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 22,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.badgeBg,
    borderWidth: 1,
    borderColor: 'rgba(255, 180, 84, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  typeBadgeText: {
    fontFamily: fonts.mono.bold,
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  topicLabel: {
    flex: 1,
    fontFamily: fonts.sans.regular,
    fontSize: 12,
    color: colors.inkSoft,
  },
  saveBtn: {
    marginLeft: 'auto',
    padding: 4,
  },
  prompt: {
    fontFamily: fonts.sans.bold,
    fontSize: 16,
    fontWeight: '700',
    color: colors.inkStrong,
    lineHeight: 26,
    marginBottom: 14,
  },
  options: {
    gap: 10,
  },
  optionBtn: {
    backgroundColor: colors.optionBg,
    borderWidth: 1,
    borderColor: colors.optionBorder,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  optionCorrect: {
    backgroundColor: colors.correctFill,
    borderColor: colors.correct,
  },
  optionWrong: {
    backgroundColor: colors.wrongFill,
    borderColor: colors.wrong,
  },
  optionDimmed: {
    opacity: 0.4,
  },
  optionText: {
    fontFamily: fonts.sans.regular,
    fontSize: 14.5,
    lineHeight: 21,
    color: colors.ink,
  },
  optionTextCorrect: {
    color: colors.correct,
    fontWeight: '700',
  },
  optionTextWrong: {
    color: colors.wrong,
    fontWeight: '700',
  },
  feedback: {
    marginTop: 16,
    borderWidth: 1,
    padding: 18,
  },
  feedbackCorrect: {
    backgroundColor: colors.correctSoft,
    borderColor: 'rgba(95, 240, 224, 0.3)',
  },
  feedbackWrong: {
    backgroundColor: colors.wrongSoft,
    borderColor: 'rgba(255, 92, 114, 0.3)',
  },
  feedbackTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  feedbackTitle: {
    fontFamily: fonts.mono.bold,
    fontWeight: '700',
    fontSize: 14,
  },
  feedbackExplanation: {
    fontFamily: fonts.sans.regular,
    fontSize: 13.5,
    lineHeight: 23,
    color: colors.inkSoft,
    marginBottom: 12,
  },
  docsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  docsLinkText: {
    fontFamily: fonts.sans.regular,
    fontSize: 12.5,
    color: colors.cyan,
  },
  nextBtnWrap: {
    width: '100%',
  },
  nextBtnContent: {
    padding: 14,
  },
  nextBtnText: {
    fontFamily: fonts.mono.bold,
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryInk,
  },
});
