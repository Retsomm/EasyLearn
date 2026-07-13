import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import XpBar from '@/components/XpBar';
import { colors, fonts } from '@/constants/theme';
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
    <View style={[styles.container, size === 'sm' && styles.containerSm]}>
      <Text style={[styles.emoji, size === 'sm' && styles.emojiSm]}>{stage.emoji}</Text>
      {size === 'lg' && (
        <>
          <Text style={styles.name}>{stage.name}</Text>
          <XpBar progress={progressToNext} width={220} height={12} />
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
    marginBottom: 8,
  },
  containerSm: {
    marginBottom: 0,
  },
  emoji: {
    fontSize: 96,
    lineHeight: 115,
  },
  emojiSm: {
    fontSize: 32,
    lineHeight: 38,
  },
  name: {
    fontFamily: fonts.mono.bold,
    fontWeight: '700',
    fontSize: 18,
    color: colors.inkStrong,
    marginTop: 8,
  },
  hint: {
    fontFamily: fonts.sans.regular,
    fontSize: 13,
    color: colors.inkSoft,
    marginTop: 8,
    textAlign: 'center',
  },
});
