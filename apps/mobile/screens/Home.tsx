import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import Icon from '@/components/Icon';
import { chapters, todayStr, yesterdayStr, type Progress } from '@easylearn/core';

const DAILY_GOAL = 20;
const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'];

const getWeekDates = (): string[] => {
  const now = new Date();
  const day = now.getDay(); // 0=週日..6=週六
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toLocaleDateString('en-CA');
  });
};

interface HomeProps {
  progress: Progress;
  onOpenChapter: (chapterId: string) => void;
  onMixedPractice: () => void;
}

export default function Home({ progress, onOpenChapter, onMixedPractice }: HomeProps) {
  const today = todayStr();
  const yesterday = yesterdayStr();
  const todayStats = progress.dailyStats[today] ?? { total: 0, correct: 0 };
  const yesterdayStats = progress.dailyStats[yesterday];
  const todayAccuracy = todayStats.total ? Math.round((todayStats.correct / todayStats.total) * 100) : 0;
  const yesterdayAccuracy = yesterdayStats?.total
    ? Math.round((yesterdayStats.correct / yesterdayStats.total) * 100)
    : null;
  const streak = progress.streak?.count ?? 0;
  const weekDates = getWeekDates();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.streakCard}>
        <View style={styles.streakTop}>
          <Text style={styles.streakTopText}>連續學習天數</Text>
          <Text style={styles.streakTopText}>今日任務完成 {todayStats.total} 題</Text>
        </View>
        <View style={styles.streakCount}>
          <Icon name="flame" size={24} />
          <Text style={styles.streakCountText}>{streak} 天</Text>
        </View>
        <View style={styles.streakWeek}>
          {weekDates.map((date, i) => (
            <View
              key={date}
              style={[
                styles.streakDay,
                date === today && styles.streakDayToday,
                progress.dailyStats[date] && styles.streakDayDone,
              ]}
            >
              <Text style={styles.streakDayText}>{WEEKDAY_LABELS[i]}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.statRow}>
        <View style={styles.statCard}>
          <View style={styles.statCardHead}>
            <Text style={styles.statCardHeadText}>今日正確率</Text>
            <Icon name="check-circle" size={15} />
          </View>
          <Text style={styles.statCardValue}>{todayAccuracy}%</Text>
          <Text style={styles.statCardHint}>
            {yesterdayAccuracy !== null ? `昨日 ${yesterdayAccuracy}%` : '尚無昨日紀錄'}
          </Text>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statCardHead}>
            <Text style={styles.statCardHeadText}>今日已做</Text>
            <Icon name="pencil" size={15} />
          </View>
          <Text style={styles.statCardValue}>{todayStats.total} 題</Text>
          <Text style={styles.statCardHint}>目標：{DAILY_GOAL} 題</Text>
        </View>
      </View>

      <Pressable style={styles.mixedBtn} onPress={onMixedPractice}>
        <Icon name="shuffle" size={17} />
        <Text style={styles.mixedBtnText}>隨機綜合練習（10 題）</Text>
      </Pressable>

      <Text style={styles.sectionTitle}>分科高效刷題</Text>
      <View style={styles.chapterList}>
        {chapters.map((ch) => {
          const done = ch.levels.filter((l) => progress.completedLevels[l.id]).length;
          const pct = ch.levels.length ? (done / ch.levels.length) * 100 : 0;
          return (
            <Pressable key={ch.id} style={styles.chapterCard} onPress={() => onOpenChapter(ch.id)}>
              <Icon name={ch.icon} size={28} />
              <View style={styles.chapterInfo}>
                <Text style={styles.chapterName}>{ch.title}</Text>
                <Text style={styles.chapterProgress}>
                  完成 {done} / {ch.levels.length} 關
                </Text>
                <View style={styles.chapterBar}>
                  <View style={[styles.chapterBarFill, { width: `${pct}%` }]} />
                </View>
              </View>
              <Icon name="chevron-right" size={20} />
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  streakCard: {
    backgroundColor: '#2e78b722',
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  streakTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  streakTopText: {
    fontSize: 12,
    opacity: 0.7,
  },
  streakCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streakCountText: {
    fontSize: 24,
    fontWeight: '800',
  },
  streakWeek: {
    flexDirection: 'row',
    gap: 6,
  },
  streakDay: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#88889915',
  },
  streakDayToday: {
    borderWidth: 1,
    borderColor: '#2e78b7',
  },
  streakDayDone: {
    backgroundColor: '#2f9e4433',
  },
  streakDayText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#88889910',
    gap: 6,
  },
  statCardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statCardHeadText: {
    fontSize: 12,
    opacity: 0.7,
  },
  statCardValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  statCardHint: {
    fontSize: 11,
    opacity: 0.6,
  },
  mixedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2e78b7',
    borderRadius: 12,
    paddingVertical: 14,
  },
  mixedBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  chapterList: {
    gap: 10,
  },
  chapterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#88889910',
  },
  chapterInfo: {
    flex: 1,
    gap: 4,
  },
  chapterName: {
    fontSize: 15,
    fontWeight: '700',
  },
  chapterProgress: {
    fontSize: 12,
    opacity: 0.65,
  },
  chapterBar: {
    height: 5,
    borderRadius: 3,
    backgroundColor: '#88889925',
    overflow: 'hidden',
  },
  chapterBarFill: {
    height: '100%',
    backgroundColor: '#2f9e44',
  },
});
