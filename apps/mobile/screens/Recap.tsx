import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import Icon from '@/components/Icon';
import { fonts } from '@/constants/theme';
import type { ColorPalette, ThemeStyle } from '@/constants/themePalettes';
import { useAppTheme } from '@/context/AppThemeContext';
import { topics, chapterSummaries } from '@easylearn/core';

interface RecapProps {
  onOpenChapter: (chapterId: string) => void;
  onOpenTopic: (topicId: string) => void;
}

// 章節重點清單：跟 Home 頁一樣用「書 > 章」的 topics 結構——一本書底下只有一章時直接點進去，
// 有好幾章的書（例如你不知道的JavaScript）先點進書本身的章節清單（RecapTopicChapters）。
// 只有已經整理過重點的章節可以點進去，其餘顯示「籌備中」（對照 apps/web 的同名畫面）
export default function Recap({ onOpenChapter, onOpenTopic }: RecapProps) {
  const { colors, style: themeStyle } = useAppTheme();
  const styles = makeStyles(colors, themeStyle);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>章節重點</Text>
      <Text style={styles.hint}>複習每一章的核心概念，練習題目之外再重讀一次重點整理</Text>

      <View style={styles.chapterList}>
        {topics.map((topic) => {
          const isGroup = topic.chapters.length > 1;
          const levelCount = topic.chapters.reduce(
            (n, ch) => n + (chapterSummaries[ch.id]?.length ?? 0),
            0,
          );
          const hasSummary = levelCount > 0;
          return (
            <Pressable
              key={topic.id}
              style={[styles.chapterCard, !hasSummary && styles.chapterCardDisabled]}
              disabled={!hasSummary}
              onPress={() => (isGroup ? onOpenTopic(topic.id) : onOpenChapter(topic.chapters[0].id))}
            >
              <Icon name={topic.icon} size={30} color={colors.primary} />
              <View style={styles.chapterInfo}>
                <Text style={styles.chapterName}>{topic.title}</Text>
                <Text style={styles.chapterProgress}>
                  {hasSummary
                    ? isGroup
                      ? `共 ${topic.chapters.length} 章、${levelCount} 關重點整理`
                      : `共 ${levelCount} 章重點整理`
                    : '重點整理籌備中'}
                </Text>
              </View>
              <Icon name="chevron-right" size={22} color={colors.navbarTabInactive} />
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const makeStyles = (colors: ColorPalette, themeStyle: ThemeStyle) =>
  StyleSheet.create({
    container: {
      padding: 16,
      gap: 10,
    },
    title: {
      fontFamily: fonts.sans.bold,
      fontSize: 20,
      fontWeight: '700',
      color: colors.inkStrong,
    },
    hint: {
      fontFamily: fonts.sans.regular,
      fontSize: 13,
      color: colors.inkSoft,
      marginBottom: 6,
    },
    chapterList: {
      gap: 12,
    },
    chapterCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      width: '100%',
      backgroundColor: colors.card,
      borderWidth: themeStyle.borderWidth,
      borderStyle: themeStyle.borderStyle,
      borderRadius: themeStyle.radius,
      borderColor: colors.optionBorder,
      padding: 16,
    },
    chapterCardDisabled: {
      opacity: 0.5,
    },
    chapterInfo: {
      flex: 1,
      gap: 2,
    },
    chapterName: {
      fontFamily: fonts.sans.bold,
      fontSize: 15,
      fontWeight: '700',
      color: colors.ink,
    },
    chapterProgress: {
      fontFamily: themeStyle.mono.regular,
      fontSize: 11,
      color: colors.inkFaint,
    },
  });
