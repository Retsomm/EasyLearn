import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import Icon from '@/components/Icon';
import { fonts } from '@/constants/theme';
import type { ColorPalette, ThemeStyle } from '@/constants/themePalettes';
import { useAppTheme } from '@/context/AppThemeContext';
import { getSavedKeyPoints } from '@easylearn/core';

interface SavedKeyPointsProps {
  savedKeyPointIds: Record<string, boolean>;
  onToggleSavedKeyPoint: (keyPointId: string) => void;
  onBack: () => void;
}

// 收藏重點清單：從各章重點複習分頁點星號收藏的條目集中在這裡（對照 apps/web 的同名畫面）
export default function SavedKeyPoints({
  savedKeyPointIds,
  onToggleSavedKeyPoint,
  onBack,
}: SavedKeyPointsProps) {
  const { colors, style: themeStyle } = useAppTheme();
  const styles = makeStyles(colors, themeStyle);
  const entries = getSavedKeyPoints(savedKeyPointIds);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={8} style={styles.backBtn}>
          <Icon name="arrow-left" size={20} color={colors.cyan} />
        </Pressable>
        <Text style={styles.title}>收藏重點</Text>
      </View>

      {entries.length === 0 ? (
        <Text style={styles.empty}>還沒有收藏的重點，在「章節重點」分頁點星號收藏吧！</Text>
      ) : (
        <View style={styles.list}>
          {entries.map((entry) => (
            <View key={entry.id} style={styles.item}>
              <Text style={styles.itemLabel}>
                {entry.chapterTitle} · {entry.levelTitle}
              </Text>
              <View style={styles.keyPointRow}>
                <Text style={styles.keyPointText}>{entry.text}</Text>
                <Pressable
                  onPress={() => onToggleSavedKeyPoint(entry.id)}
                  hitSlop={8}
                  style={styles.saveBtn}
                >
                  <Icon name="star" size={17} color={colors.primary} fill={colors.primary} />
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}
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
    empty: {
      fontFamily: fonts.sans.regular,
      fontSize: 13,
      color: colors.inkSoft,
      marginTop: 8,
    },
    list: {
      gap: 12,
    },
    item: {
      backgroundColor: colors.card,
      borderWidth: themeStyle.borderWidth,
      borderStyle: themeStyle.borderStyle,
      borderRadius: themeStyle.radius,
      borderColor: colors.optionBorder,
      padding: 16,
      gap: 8,
    },
    itemLabel: {
      fontFamily: themeStyle.mono.regular,
      fontSize: 11,
      color: colors.inkFaint,
    },
    keyPointRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
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
