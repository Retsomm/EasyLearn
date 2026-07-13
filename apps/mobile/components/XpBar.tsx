import { StyleSheet, View, type DimensionValue } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors } from '@/constants/theme';

interface XpBarProps {
  progress: number; // 0-100
  height?: number;
  width?: DimensionValue;
}

// 對照 index.css 的 .xp-bar／.xp-bar-fill：cyan→primary 的漸層進度條，Mascot 與 Profile
// 的「經驗值」卡片共用同一份，避免兩處各刻一次漸層邏輯。
export default function XpBar({ progress, height = 12, width = 220 }: XpBarProps) {
  return (
    <View style={[styles.track, { height, width }]}>
      <LinearGradient
        colors={[colors.cyan, colors.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.fill, { width: `${Math.max(0, Math.min(100, progress))}%` }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: colors.track,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
