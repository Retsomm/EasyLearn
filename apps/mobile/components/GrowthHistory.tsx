import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { colors, fonts } from '@/constants/theme';
import { STAGES, getStage } from '@easylearn/core';

interface GrowthHistoryProps {
  xp: number;
}

// 對照 apps/web 的 GrowthHistory.tsx：吉祥物成長史清單。mobile 這裡改用 Modal 彈窗顯示
// （見 app/(tabs)/profile.tsx），本體清單樣式仍照抄 index.css 的 .growth-history 系列。
export default function GrowthHistory({ xp }: GrowthHistoryProps) {
  const current = getStage(xp);

  return (
    <View style={styles.list}>
      {STAGES.map((stage) => {
        const reached = xp >= stage.min;
        const isCurrent = stage.name === current.name;
        return (
          <View
            key={stage.name}
            style={[styles.item, reached && styles.itemReached, isCurrent && styles.itemCurrent]}
          >
            <Text style={styles.emoji}>{stage.emoji}</Text>
            <View style={styles.info}>
              <Text style={styles.name}>{stage.name}</Text>
              <Text style={styles.xp}>
                {stage.min} XP{isCurrent ? '・目前' : ''}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 6,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 8,
    paddingHorizontal: 10,
    backgroundColor: colors.optionBg,
    borderWidth: 1,
    borderColor: 'transparent',
    opacity: 0.5,
  },
  itemReached: {
    opacity: 1,
  },
  itemCurrent: {
    backgroundColor: colors.badgeBg,
    borderColor: colors.primary,
  },
  emoji: {
    fontSize: 22,
    width: 28,
    textAlign: 'center',
  },
  info: {
    gap: 2,
  },
  name: {
    fontFamily: fonts.sans.medium,
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink,
  },
  xp: {
    fontFamily: fonts.mono.regular,
    fontSize: 11,
    color: colors.inkFaint,
  },
});
