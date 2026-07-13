import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import Icon from '@/components/Icon';
import { getWrongQuestions, type Progress } from '@easylearn/core';

interface NotesProps {
  progress: Progress;
  onOpenWrongBook: () => void;
  onOpenSavedBook: () => void;
  onReview: () => void;
  onPracticeSaved: () => void;
}

// 對照 apps/web 的 Notes.tsx：錯題本／收藏題庫兩張入口卡
export default function Notes({ progress, onOpenWrongBook, onOpenSavedBook, onReview, onPracticeSaved }: NotesProps) {
  const wrongCount = getWrongQuestions(progress.wrongIds ?? {}).length;
  const savedCount = Object.keys(progress.savedIds ?? {}).length;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Pressable style={[styles.card, styles.cardWrong]} onPress={onOpenWrongBook}>
        <View style={styles.cardHead}>
          <Icon name="book-open" size={20} />
          <Text style={styles.cardTitle}>錯題本</Text>
        </View>
        <Text style={styles.cardCount}>目前累積 {wrongCount} 題錯題</Text>
        <Pressable
          style={[styles.cardBtn, wrongCount === 0 && styles.cardBtnDisabled]}
          disabled={wrongCount === 0}
          onPress={(e) => {
            e.stopPropagation();
            onReview();
          }}
        >
          <Text style={styles.cardBtnText}>開始複習</Text>
        </Pressable>
      </Pressable>

      <Pressable style={[styles.card, styles.cardSaved]} onPress={onOpenSavedBook}>
        <View style={styles.cardHead}>
          <Icon name="star" size={20} />
          <Text style={styles.cardTitle}>收藏題庫</Text>
        </View>
        <Text style={styles.cardCount}>目前累積 {savedCount} 題收藏</Text>
        <Pressable
          style={[styles.cardBtn, savedCount === 0 && styles.cardBtnDisabled]}
          disabled={savedCount === 0}
          onPress={(e) => {
            e.stopPropagation();
            onPracticeSaved();
          }}
        >
          <Text style={styles.cardBtnText}>{savedCount === 0 ? '無收藏題' : '開始練習'}</Text>
        </Pressable>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    gap: 4,
    borderWidth: 1,
  },
  cardWrong: {
    backgroundColor: '#e5484d14',
    borderColor: '#e5484d40',
  },
  cardSaved: {
    backgroundColor: '#2e78b714',
    borderColor: '#2e78b740',
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardCount: {
    fontSize: 13,
    opacity: 0.7,
    marginTop: 6,
    marginBottom: 14,
  },
  cardBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#88889940',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  cardBtnDisabled: {
    opacity: 0.5,
  },
  cardBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
