import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { getNextStage, getStage, getStageProgress } from '@easylearn/core';

interface MascotProps {
  xp: number;
  size?: 'lg' | 'sm';
}

// 對照 apps/web 的 Mascot.tsx；沒有搬 mood="happy" 的彈跳動畫，Phase 3 CodeBlock/Icon
// 已經確立「先求功能完整」的簡化原則，這裡先只做靜態顯示
export default function Mascot({ xp, size = 'lg' }: MascotProps) {
  const stage = getStage(xp);
  const next = getNextStage(xp);
  const progressToNext = getStageProgress(xp);

  return (
    <View style={styles.container}>
      <Text style={[styles.emoji, size === 'sm' && styles.emojiSm]}>{stage.emoji}</Text>
      {size === 'lg' && (
        <>
          <Text style={styles.name}>{stage.name}</Text>
          <View style={styles.xpBar}>
            <View style={[styles.xpBarFill, { width: `${progressToNext}%` }]} />
          </View>
          <Text style={styles.hint}>
            {next ? `${xp} XP・再 ${next.min - xp} XP 進化成 ${next.emoji}` : `${xp} XP・已達最終型態！`}
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  emoji: {
    fontSize: 72,
    lineHeight: 84,
  },
  emojiSm: {
    fontSize: 32,
    lineHeight: 38,
  },
  name: {
    fontWeight: '700',
    fontSize: 15,
    marginTop: 4,
  },
  xpBar: {
    width: 200,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#88889920',
    overflow: 'hidden',
    marginTop: 8,
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: '#2e78b7',
  },
  hint: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 6,
    textAlign: 'center',
  },
});
