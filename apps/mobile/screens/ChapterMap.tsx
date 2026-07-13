import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import Icon from '@/components/Icon';
import { colors, fonts } from '@/constants/theme';
import { chapters, type IconName, type Progress } from '@easylearn/core';

const STATUS_COLOR: Record<IconName, string> = {
  lock: colors.locked,
  'check-circle': colors.cyan,
  play: colors.primary,
} as Record<IconName, string>;

interface ChapterMapProps {
  chapterId: string | null;
  progress: Progress;
  onStartLevel: (levelId: string) => void;
  onBack: () => void;
}

// 章節清單顯示在 Home 頁；這裡只負責單一章節的關卡清單（對照 apps/web 的同名畫面）
export default function ChapterMap({ chapterId, progress, onStartLevel, onBack }: ChapterMapProps) {
  const chapter = chapters.find((ch) => ch.id === chapterId);
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

      {chapter.levels.map((level, i) => {
        const record = progress.completedLevels[level.id];
        const prevDone = i === 0 || progress.completedLevels[chapter.levels[i - 1].id];
        const locked = !prevDone;
        const statusIcon: IconName = locked ? 'lock' : record ? 'check-circle' : 'play';
        return (
          <Pressable
            key={level.id}
            disabled={locked}
            onPress={() => onStartLevel(level.id)}
            style={[styles.levelRow, locked && styles.levelLocked]}
          >
            <View style={styles.levelIcon}>
              <Icon name={statusIcon} size={20} color={STATUS_COLOR[statusIcon]} />
            </View>
            <Text style={styles.levelName}>
              {i + 1}. {level.title}
            </Text>
            <Text style={styles.levelRecord}>
              {record
                ? `最佳 ${record.best}/${record.total}`
                : locked
                  ? '完成上一關解鎖'
                  : `共 ${level.questions.length} 題`}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
    borderWidth: 1,
    borderColor: 'rgba(95, 240, 224, 0.25)',
    width: 38,
    height: 38,
  },
  title: {
    fontFamily: fonts.sans.bold,
    fontSize: 17,
    fontWeight: '700',
    color: colors.inkStrong,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    width: '100%',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.optionBorder,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  levelLocked: {
    opacity: 0.55,
  },
  levelIcon: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelName: {
    flex: 1,
    fontFamily: fonts.sans.bold,
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
  },
  levelRecord: {
    fontFamily: fonts.mono.regular,
    fontSize: 11,
    color: colors.inkFaint,
  },
});
