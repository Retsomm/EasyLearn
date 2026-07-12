import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import Icon from '@/components/Icon';
import CodeBlock from '@/components/CodeBlock';
import { TYPE_META, type Question } from '@easylearn/core';

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
        <Pressable onPress={() => onToggleSave(question.id)} hitSlop={8}>
          <Icon name="star" size={18} />
        </Pressable>
      </View>

      <Text style={styles.prompt}>{question.prompt}</Text>
      <CodeBlock code={question.code} />

      <View style={styles.options}>
        {question.options.map((opt) => {
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
              <Text style={styles.optionText}>{opt.text}</Text>
            </Pressable>
          );
        })}
      </View>

      {answered && (
        <View style={[styles.feedback, correct ? styles.feedbackCorrect : styles.feedbackWrong]}>
          <Text style={styles.feedbackTitle}>
            {correct ? '答對了！+10 XP' : '沒關係，弄懂它才是重點 +2 XP'}
          </Text>
          <Text style={styles.feedbackExplanation}>{question.explanation}</Text>
          {question.docs && (
            <Pressable onPress={() => Linking.openURL(question.docs)}>
              <Text style={styles.docsLink}>延伸閱讀：官方文件</Text>
            </Pressable>
          )}
          <Pressable style={styles.nextBtn} onPress={onNext}>
            <Text style={styles.nextBtnText}>{isLast ? '看結算' : '下一題'}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 4,
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
    borderColor: '#8888991a',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#88889908',
  },
  optionCorrect: {
    borderColor: '#2f9e44',
    backgroundColor: '#2f9e4422',
  },
  optionWrong: {
    borderColor: '#e5484d',
    backgroundColor: '#e5484d22',
  },
  optionDimmed: {
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
  },
  feedbackCorrect: {
    backgroundColor: '#2f9e4418',
  },
  feedbackWrong: {
    backgroundColor: '#e5484d18',
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
  nextBtn: {
    marginTop: 4,
    backgroundColor: '#2e78b7',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  nextBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
});
