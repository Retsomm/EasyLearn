import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import Icon from '@/components/Icon';
import { SecondaryButton, makeButtonTextStyles } from '@/components/Button';
import QuestionReview from '@/screens/QuestionReview';
import { fonts } from '@/constants/theme';
import type { ColorPalette, ThemeStyle } from '@/constants/themePalettes';
import { useAppTheme } from '@/context/AppThemeContext';
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
  const { colors, style: themeStyle } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors, themeStyle), [colors, themeStyle]);
  const buttonTextStyles = useMemo(() => makeButtonTextStyles(colors, themeStyle), [colors, themeStyle]);
  const isWrong = kind === 'wrong';
  const title = isWrong ? '錯題本' : '收藏題目';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={8} style={styles.backBtn}>
          <Icon name="arrow-left" size={20} color={colors.cyan} />
        </Pressable>
        <Text style={styles.title}>{title}</Text>
      </View>

      {isWrong && entries.length > 0 && (
        <SecondaryButton onPress={onReview} style={styles.reviewBtn}>
          <Icon name="rotate-ccw" size={17} color={colors.wrong} />
          <Text style={buttonTextStyles.secondary}>開始重練（{entries.length} 題）</Text>
        </SecondaryButton>
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

const makeStyles = (colors: ColorPalette, themeStyle: ThemeStyle) => StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 8,
  },
  backBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: themeStyle.borderWidth,
    borderStyle: themeStyle.borderStyle,
    borderRadius: themeStyle.radius,
    borderColor: colors.navbarBorder,
    width: 38,
    height: 38,
  },
  title: {
    fontFamily: fonts.sans.bold,
    fontSize: 17,
    fontWeight: '700',
    color: colors.ink,
  },
  reviewBtn: {
    width: '100%',
    marginBottom: 4,
  },
  empty: {
    textAlign: 'center',
    fontFamily: fonts.sans.regular,
    color: colors.inkSoft,
    fontSize: 14,
    marginTop: 40,
  },
  list: {
    gap: 16,
  },
});
