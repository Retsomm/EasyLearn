import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import Icon from '@/components/Icon';
import NotchedView from '@/components/NotchedView';
import { fonts, notch } from '@/constants/theme';
import type { ColorPalette, ThemeStyle } from '@/constants/themePalettes';
import { useAppTheme } from '@/context/AppThemeContext';
import { getSavedKeyPoints, getWrongQuestions, type Progress } from '@easylearn/core';

interface NotesProps {
  progress: Progress;
  onOpenWrongBook: () => void;
  onOpenSavedBook: () => void;
  onOpenSavedKeyPoints: () => void;
  onReview: () => void;
  onPracticeSaved: () => void;
}

// 對照 apps/web 的 Notes.tsx：錯題本／收藏題庫／收藏重點三張入口卡
export default function Notes({
  progress,
  onOpenWrongBook,
  onOpenSavedBook,
  onOpenSavedKeyPoints,
  onReview,
  onPracticeSaved,
}: NotesProps) {
  const { colors, style: themeStyle } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors, themeStyle), [colors, themeStyle]);
  const wrongCount = getWrongQuestions(progress.wrongIds ?? {}).length;
  const savedCount = Object.keys(progress.savedIds ?? {}).length;
  const savedKeyPointCount = getSavedKeyPoints(progress.savedKeyPointIds ?? {}).length;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Pressable onPress={onOpenWrongBook}>
        <NotchedView
          notch={notch}
          corners="tr-bl"
          backgroundColor={colors.noteWrongBg}
          borderColor={colors.noteWrongBorder}
          borderWidth={1}
          contentStyle={styles.card}
        >
          <View style={styles.cardHead}>
            <Icon name="book-open" size={20} color={colors.wrong} />
            <Text style={[styles.cardTitle, { color: colors.wrong }]}>錯題本</Text>
          </View>
          <Text style={styles.cardCount}>目前累積 {wrongCount} 題錯題</Text>
          <Pressable
            style={[styles.cardBtn, { borderColor: 'rgba(255, 92, 114, 0.2)' }, wrongCount === 0 && styles.cardBtnDisabled]}
            disabled={wrongCount === 0}
            onPress={(e) => {
              e.stopPropagation();
              onReview();
            }}
          >
            <Text style={styles.cardBtnText}>開始複習</Text>
          </Pressable>
        </NotchedView>
      </Pressable>

      <Pressable onPress={onOpenSavedBook}>
        <NotchedView
          notch={notch}
          corners="tr-bl"
          backgroundColor={colors.noteSavedBg}
          borderColor={colors.noteSavedBorder}
          borderWidth={1}
          contentStyle={styles.card}
        >
          <View style={styles.cardHead}>
            <Icon name="star" size={20} color={colors.primary} fill={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.primary }]}>收藏題庫</Text>
          </View>
          <Text style={styles.cardCount}>目前累積 {savedCount} 題收藏</Text>
          <Pressable
            style={[styles.cardBtn, { borderColor: 'rgba(255, 180, 84, 0.2)' }, savedCount === 0 && styles.cardBtnDisabled]}
            disabled={savedCount === 0}
            onPress={(e) => {
              e.stopPropagation();
              onPracticeSaved();
            }}
          >
            <Text style={styles.cardBtnText}>{savedCount === 0 ? '無收藏題' : '開始練習'}</Text>
          </Pressable>
        </NotchedView>
      </Pressable>

      <Pressable onPress={onOpenSavedKeyPoints}>
        <NotchedView
          notch={notch}
          corners="tr-bl"
          backgroundColor={colors.noteSavedBg}
          borderColor={colors.noteSavedBorder}
          borderWidth={1}
          contentStyle={styles.card}
        >
          <View style={styles.cardHead}>
            <Icon name="star" size={20} color={colors.primary} fill={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.primary }]}>收藏重點</Text>
          </View>
          <Text style={styles.cardCountLast}>目前累積 {savedKeyPointCount} 條收藏重點</Text>
        </NotchedView>
      </Pressable>
    </ScrollView>
  );
}

const makeStyles = (colors: ColorPalette, themeStyle: ThemeStyle) => StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 16,
  },
  card: {
    padding: 22,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardTitle: {
    fontFamily: themeStyle.mono.bold,
    fontSize: 16,
    fontWeight: '700',
  },
  cardCount: {
    fontFamily: fonts.sans.regular,
    fontSize: 13,
    color: colors.inkSoft,
    marginTop: 8,
    marginBottom: 16,
  },
  cardCountLast: {
    fontFamily: fonts.sans.regular,
    fontSize: 13,
    color: colors.inkSoft,
    marginTop: 8,
  },
  cardBtn: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: themeStyle.borderWidth,
    borderStyle: themeStyle.borderStyle,
    borderRadius: themeStyle.radius,
    paddingVertical: 11,
    paddingHorizontal: 22,
  },
  cardBtnDisabled: {
    opacity: 0.7,
  },
  cardBtnText: {
    fontFamily: themeStyle.mono.bold,
    fontSize: 13,
    fontWeight: '700',
    color: colors.inkFaint,
  },
});
