import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import Icon from '@/components/Icon';
import { fonts } from '@/constants/theme';
import type { ColorPalette, ThemeStyle } from '@/constants/themePalettes';
import { useAppTheme } from '@/context/AppThemeContext';
import { chapters, chapterSummaries, keyPointId } from '@easylearn/core';

interface RecapChapterProps {
  chapterId: string;
  savedKeyPointIds: Record<string, boolean>;
  onToggleSavedKeyPoint: (keyPointId: string) => void;
  onBack: () => void;
}

// 單一章節的重點列表：每個關卡是一個手風琴，展開才顯示重點條列，每條重點都能收藏
// （對照 apps/web 的同名畫面）
export default function RecapChapter({
  chapterId,
  savedKeyPointIds,
  onToggleSavedKeyPoint,
  onBack,
}: RecapChapterProps) {
  const { colors, style: themeStyle } = useAppTheme();
  const styles = makeStyles(colors, themeStyle);
  const chapter = chapters.find((ch) => ch.id === chapterId);
  const summaries = chapterSummaries[chapterId] ?? [];
  const [openLevelId, setOpenLevelId] = useState<string | null>(summaries[0]?.levelId ?? null);

  if (!chapter) return null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={8} style={styles.backBtn}>
          <Icon name="arrow-left" size={20} color={colors.cyan} />
        </Pressable>
        <Icon name={chapter.icon} size={22} color={colors.cyan} />
        <Text style={styles.title}>{chapter.title}</Text>
      </View>

      {summaries.map((summary) => {
        const level = chapter.levels.find((l) => l.id === summary.levelId);
        if (!level) return null;
        const isOpen = openLevelId === summary.levelId;
        return (
          <View key={summary.levelId} style={styles.levelBlock}>
            <Pressable
              style={styles.levelHead}
              onPress={() => setOpenLevelId(isOpen ? null : summary.levelId)}
            >
              <Text style={styles.levelTitle}>{level.title}</Text>
              <View style={isOpen ? styles.chevronOpen : undefined}>
                <Icon name="chevron-right" size={18} color={colors.inkFaint} />
              </View>
            </Pressable>
            {isOpen && (
              <View style={styles.keyPointList}>
                {summary.keyPoints.map((point, index) => {
                  const id = keyPointId(summary.levelId, index);
                  const saved = !!savedKeyPointIds[id];
                  return (
                    <View key={id} style={styles.keyPointRow}>
                      <Text style={styles.keyPointText}>{point}</Text>
                      <Pressable
                        onPress={() => onToggleSavedKeyPoint(id)}
                        hitSlop={8}
                        style={styles.saveBtn}
                      >
                        <Icon
                          name="star"
                          size={17}
                          color={saved ? colors.primary : colors.inkFaint}
                          fill={saved ? colors.primary : 'none'}
                        />
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        );
      })}
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
      borderColor: colors.optionBorder,
      width: 38,
      height: 38,
    },
    title: {
      fontFamily: fonts.sans.bold,
      fontSize: 17,
      fontWeight: '700',
      color: colors.inkStrong,
    },
    levelBlock: {
      backgroundColor: colors.card,
      borderWidth: themeStyle.borderWidth,
      borderStyle: themeStyle.borderStyle,
      borderRadius: themeStyle.radius,
      borderColor: colors.optionBorder,
    },
    levelHead: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 16,
      paddingHorizontal: 18,
    },
    levelTitle: {
      flex: 1,
      fontFamily: fonts.sans.bold,
      fontSize: 15,
      fontWeight: '700',
      color: colors.ink,
    },
    chevronOpen: {
      transform: [{ rotate: '90deg' }],
    },
    keyPointList: {
      borderTopWidth: 1,
      borderTopColor: colors.optionBorder,
      paddingVertical: 4,
    },
    keyPointRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      paddingVertical: 12,
      paddingHorizontal: 18,
    },
    keyPointText: {
      flex: 1,
      fontFamily: fonts.sans.regular,
      fontSize: 13,
      lineHeight: 20,
      color: colors.inkSoft,
    },
    saveBtn: {
      marginTop: 1,
    },
  });
