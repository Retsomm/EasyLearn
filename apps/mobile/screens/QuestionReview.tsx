import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import Icon from '@/components/Icon';
import CodeBlock from '@/components/CodeBlock';
import { GRADUATE_BOX, TYPE_META, type Question, type WrongEntryMeta } from '@easylearn/core';

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
    <View style={styles.card}>
      <View style={styles.metaRow}>
        <View style={styles.typeBadge}>
          <Icon name={typeMeta.icon} size={13} />
          <Text style={styles.typeBadgeText}>{typeMeta.label}</Text>
        </View>
        <Text style={styles.topicLabel} numberOfLines={1}>
          {question.topic}
        </Text>
        <Pressable onPress={() => onToggleSave(question.id)} hitSlop={8} style={{ opacity: saved ? 1 : 0.35 }}>
          <Icon name="star" size={18} />
        </Pressable>
      </View>

      {meta && (
        <View style={styles.reviewMetaRow}>
          <Text style={styles.reviewMetaText}>答錯 {meta.count} 次</Text>
          <Text style={styles.reviewMetaText}>
            熟練度 {meta.box}/{GRADUATE_BOX}
          </Text>
          {meta.lastWrong && <Text style={styles.reviewMetaText}>最近答錯：{meta.lastWrong}</Text>}
        </View>
      )}

      <Text style={styles.prompt}>{question.prompt}</Text>
      <CodeBlock code={question.code} />

      <View style={styles.options}>
        {question.options.map((opt) => (
          <View
            key={opt.id}
            style={[styles.optionBtn, opt.id === question.answer ? styles.optionCorrect : styles.optionDimmed]}
          >
            <Text style={styles.optionText}>{opt.text}</Text>
          </View>
        ))}
      </View>

      <View style={styles.feedback}>
        <View style={styles.feedbackTitleRow}>
          <Icon name="lightbulb" size={20} />
          <Text style={styles.feedbackTitle}>解釋</Text>
        </View>
        <Text style={styles.feedbackExplanation}>{question.explanation}</Text>
        {question.docs && (
          <Pressable onPress={() => Linking.openURL(question.docs).catch(() => {})}>
            <Text style={styles.docsLink}>延伸閱讀：官方文件</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 4,
    borderRadius: 14,
    padding: 16,
    backgroundColor: '#88889910',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2e78b722',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  topicLabel: {
    flex: 1,
    fontSize: 12,
    opacity: 0.6,
  },
  reviewMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 6,
  },
  reviewMetaText: {
    fontSize: 11,
    opacity: 0.55,
  },
  prompt: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  options: {
    gap: 8,
    marginTop: 6,
  },
  optionBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  optionCorrect: {
    borderColor: '#2f9e44',
    backgroundColor: '#2f9e4422',
  },
  optionDimmed: {
    borderColor: '#8888991a',
    backgroundColor: '#88889908',
    opacity: 0.5,
  },
  optionText: {
    fontSize: 14,
  },
  feedback: {
    marginTop: 12,
    borderRadius: 10,
    padding: 14,
    gap: 8,
    backgroundColor: '#2f9e4418',
  },
  feedbackTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  feedbackTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  feedbackExplanation: {
    fontSize: 14,
    lineHeight: 20,
  },
  docsLink: {
    fontSize: 13,
    color: '#2e78b7',
    textDecorationLine: 'underline',
  },
});
