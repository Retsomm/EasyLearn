import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import Icon from '@/components/Icon';
import { fonts } from '@/constants/theme';
import type { ColorPalette, ThemeStyle } from '@/constants/themePalettes';
import { useAppTheme } from '@/context/AppThemeContext';
import { topics, chapterSummaries } from '@easylearn/core';

interface RecapTopicChaptersProps {
  topicId: string;
  onOpenChapter: (chapterId: string) => void;
  onBack: () => void;
}

// 一本書底下有好幾章時的中間頁（對照 apps/mobile 的 TopicBooks.tsx／apps/web 的同名畫面）：
// 先列出這本書每一章的重點整理進度，點進去才是單一章的重點列表（RecapChapter）
export default function RecapTopicChapters({ topicId, onOpenChapter, onBack }: RecapTopicChaptersProps) {
  const { colors, style: themeStyle } = useAppTheme();
  const styles = makeStyles(colors, themeStyle);
  const topic = topics.find((t) => t.id === topicId);
  if (!topic) return null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={8} style={styles.backBtn}>
          <Icon name="arrow-left" size={20} color={colors.cyan} />
        </Pressable>
        <Icon name={topic.icon} size={22} color={colors.cyan} />
        <Text style={styles.title}>{topic.title}</Text>
      </View>

      <View style={styles.chapterList}>
        {topic.chapters.map((ch, i) => {
          const levelCount = chapterSummaries[ch.id]?.length ?? 0;
          const hasSummary = levelCount > 0;
          return (
            <Pressable
              key={ch.id}
              style={[styles.chapterCard, !hasSummary && styles.chapterCardDisabled]}
              disabled={!hasSummary}
              onPress={() => onOpenChapter(ch.id)}
            >
              <Icon name={ch.icon} size={30} color={colors.primary} />
              <View style={styles.chapterInfo}>
                <Text style={styles.chapterName}>
                  第 {i + 1} 章：{ch.title}
                </Text>
                <Text style={styles.chapterProgress}>
                  {hasSummary ? `共 ${levelCount} 關重點整理` : '重點整理籌備中'}
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
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      marginBottom: 4,
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
      color: colors.inkStrong,
    },
    chapterList: {
      marginTop: 6,
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
