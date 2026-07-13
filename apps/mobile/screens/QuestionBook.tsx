import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import Icon from '@/components/Icon';
import QuestionReview from '@/screens/QuestionReview';
import type { Question, WrongEntry } from '@easylearn/core';

interface QuestionBookProps {
  kind: 'wrong' | 'saved';
  entries: WrongEntry[] | Question[];
  savedIds: Record<string, boolean>;
  onToggleSave: (questionId: string) => void;
  onBack: () => void;
  onReview?: () => void;
}

// 錯題本／收藏題目共用的清單畫面（對照 apps/web 同名畫面）
export default function QuestionBook({ kind, entries, savedIds, onToggleSave, onBack, onReview }: QuestionBookProps) {
  const isWrong = kind === 'wrong';
  const title = isWrong ? '錯題本' : '收藏題目';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={8} style={styles.backBtn}>
          <Icon name="arrow-left" size={18} />
        </Pressable>
        <Text style={styles.title}>{title}</Text>
      </View>

      {isWrong && entries.length > 0 && (
        <Pressable style={styles.reviewBtn} onPress={onReview}>
          <Icon name="rotate-ccw" size={17} />
          <Text style={styles.reviewBtnText}>開始重練（{entries.length} 題）</Text>
        </Pressable>
      )}

      {entries.length === 0 ? (
        <Text style={styles.empty}>{isWrong ? '目前沒有錯題，太厲害了！' : '還沒有收藏的題目，答題時點星號收藏吧！'}</Text>
      ) : (
        <View style={styles.list}>
          {entries.map((item) => {
            const question = isWrong ? (item as WrongEntry).question : (item as Question);
            return (
              <QuestionReview
                key={question.id}
                question={question}
                saved={!!savedIds[question.id]}
                onToggleSave={onToggleSave}
                meta={isWrong ? (item as WrongEntry) : null}
              />
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  backBtn: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#2e78b755',
    borderRadius: 12,
    paddingVertical: 13,
    marginBottom: 4,
  },
  reviewBtnText: {
    fontWeight: '700',
    fontSize: 14,
  },
  empty: {
    textAlign: 'center',
    opacity: 0.6,
    fontSize: 14,
    marginTop: 40,
  },
  list: {
    gap: 16,
  },
});
