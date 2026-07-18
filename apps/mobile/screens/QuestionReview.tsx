import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import Icon from '@/components/Icon';
import CodeBlock from '@/components/CodeBlock';
import NotchedView from '@/components/NotchedView';
import { colors, fonts, notch } from '@/constants/theme';
import { TYPE_META, type Question, type WrongEntryMeta } from '@easylearn/core';

interface QuestionReviewProps {
  question: Question;
  saved: boolean;
  onToggleSave: (questionId: string) => void;
  meta: WrongEntryMeta | null;
}

// 唯讀題目卡：錯題本／收藏瀏覽頁用，直接看答案與解釋，不用重考（對照 apps/web 同名元件）
export default function QuestionReview({ question, saved, onToggleSave, meta }: QuestionReviewProps) {
  const typeMeta = TYPE_META[question.type];

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

      {meta && (
        <View style={styles.reviewMetaRow}>
          <Text style={styles.reviewMetaText}>答錯 {meta.count} 次</Text>
          {meta.lastWrong && <Text style={styles.reviewMetaText}>最近答錯：{meta.lastWrong}</Text>}
        </View>
      )}

      <Text style={styles.prompt}>{question.prompt}</Text>
      <CodeBlock code={question.code} />

      <View style={styles.options}>
        {question.options.map((opt) => {
          const isAnswer = opt.id === question.answer;
          return (
            <View key={opt.id} style={[styles.optionBtn, isAnswer ? styles.optionCorrect : styles.optionDimmed]}>
              {opt.code && <CodeBlock code={opt.code} scroll={false} />}
              <Text style={[styles.optionText, isAnswer && styles.optionTextCorrect]}>{opt.text}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.feedback}>
        <View style={styles.feedbackTitleRow}>
          <Icon name="lightbulb" size={20} color={colors.correct} />
          <Text style={styles.feedbackTitle}>解釋</Text>
        </View>
        <Text style={styles.feedbackExplanation}>{question.explanation}</Text>
        {question.docs && (
          <Pressable onPress={() => Linking.openURL(question.docs).catch(() => {})} style={styles.docsLink}>
            <Icon name="book-open" size={16} color={colors.cyan} />
            <Text style={styles.docsLinkText}>延伸閱讀：官方文件</Text>
          </Pressable>
        )}
      </View>
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
  reviewMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
    marginTop: -4,
  },
  reviewMetaText: {
    fontFamily: fonts.mono.regular,
    fontSize: 11,
    color: colors.inkFaint,
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
  feedback: {
    marginTop: 16,
    borderWidth: 1,
    padding: 18,
    backgroundColor: colors.correctSoft,
    borderColor: 'rgba(95, 240, 224, 0.3)',
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
    color: colors.correct,
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
  },
  docsLinkText: {
    fontFamily: fonts.sans.regular,
    fontSize: 12.5,
    color: colors.cyan,
  },
});
