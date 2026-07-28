import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import Icon from '@/components/Icon';
import { fonts } from '@/constants/theme';
import type { ColorPalette, ThemeStyle } from '@/constants/themePalettes';
import { useAppTheme } from '@/context/AppThemeContext';
import { topics, type Progress } from '@easylearn/core';

interface TopicBooksProps {
  topicId: string;
  progress: Progress;
  onOpenChapter: (chapterId: string) => void;
  onBack: () => void;
}

// 一本書底下有好幾章時的中間頁（對照 apps/web 的同名畫面）：先列出這本書的每一章，
// 點進去才是單一章的關卡列表（ChapterMap）
export default function TopicBooks({ topicId, progress, onOpenChapter, onBack }: TopicBooksProps) {
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
          const done = ch.levels.filter((l) => progress.completedLevels[l.id]).length;
          const pct = ch.levels.length ? (done / ch.levels.length) * 100 : 0;
          return (
            <Pressable key={ch.id} style={styles.chapterCard} onPress={() => onOpenChapter(ch.id)}>
              <Icon name={ch.icon} size={30} color={colors.primary} />
              <View style={styles.chapterInfo}>
                <Text style={styles.chapterName}>第 {i + 1} 章：{ch.title}</Text>
                <Text style={styles.chapterProgress}>
                  完成 {done} / {ch.levels.length} 關
                </Text>
                <View style={styles.chapterBar}>
                  <View style={[styles.chapterBarFill, { width: `${pct}%`, backgroundColor: colors.primary }]} />
                </View>
              </View>
              <Icon name="chevron-right" size={22} color={colors.secondaryBorder} />
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const makeStyles = (colors: ColorPalette, themeStyle: ThemeStyle) => StyleSheet.create({
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
    color: colors.secondaryBorder,
  },
  chapterBar: {
    height: 6,
    backgroundColor: colors.track,
    overflow: 'hidden',
    marginTop: 4,
  },
  chapterBarFill: {
    height: '100%',
  },
});
