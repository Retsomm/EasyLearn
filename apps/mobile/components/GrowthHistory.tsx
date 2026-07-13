import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { STAGES, getStage } from '@easylearn/core';

interface GrowthHistoryProps {
  xp: number;
}

// 對照 apps/web 的 GrowthHistory.tsx：吉祥物成長史清單
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
            style={[styles.item, !reached && styles.itemLocked, isCurrent && styles.itemCurrent]}
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
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#88889910',
  },
  itemLocked: {
    opacity: 0.4,
  },
  itemCurrent: {
    backgroundColor: '#2e78b722',
    borderWidth: 1,
    borderColor: '#2e78b755',
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
    fontSize: 13,
    fontWeight: '600',
  },
  xp: {
    fontSize: 11,
    opacity: 0.55,
  },
});
