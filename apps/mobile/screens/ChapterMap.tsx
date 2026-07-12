import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import Icon from '@/components/Icon';
import { chapters, type IconName, type Progress } from '@easylearn/core';

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
          <Icon name="arrow-left" size={18} />
        </Pressable>
        <Icon name={chapter.icon} size={20} />
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
            style={[styles.levelRow, locked && styles.levelLocked, record && styles.levelDone]}
          >
            <Icon name={statusIcon} size={18} />
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
    gap: 10,
    marginBottom: 6,
  },
  backBtn: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#88889910',
  },
  levelLocked: {
    opacity: 0.45,
  },
  levelDone: {
    backgroundColor: '#2f9e4418',
  },
  levelName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  levelRecord: {
    fontSize: 12,
    opacity: 0.65,
  },
});
