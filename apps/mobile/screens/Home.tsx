import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import Icon from '@/components/Icon';
import { PrimaryButton, buttonTextStyles } from '@/components/Button';
import { colors, fonts } from '@/constants/theme';
import { chapters, todayStr, yesterdayStr, type Progress } from '@easylearn/core';

const DAILY_GOAL = 20;
const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'];

// 對照 index.css 的 chapter-list nth-child(1..3) 規則：三個章節依序 cyan／primary／wrong
const CHAPTER_ACCENTS = [colors.cyan, colors.primary, colors.wrong];

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
          <Icon name="flame" size={28} color={colors.primary} />
          <Text style={styles.streakCountText}>{streak} 天</Text>
        </View>
        <View style={styles.streakWeek}>
          {weekDates.map((date, i) => {
            const isDone = !!progress.dailyStats[date];
            const isToday = date === today;
            return (
              <View
                key={date}
                style={[styles.streakDay, isDone && styles.streakDayDone, isToday && styles.streakDayToday]}
              >
                <Text
                  style={[
                    styles.streakDayText,
                    isDone && styles.streakDayTextDone,
                    isToday && styles.streakDayTextToday,
                  ]}
                >
                  {WEEKDAY_LABELS[i]}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.statRow}>
        <View style={styles.statCard}>
          <View style={styles.statCardHead}>
            <Text style={styles.statCardHeadText}>今日正確率</Text>
            <Icon name="check-circle" size={17} color={colors.cyan} />
          </View>
          <Text style={styles.statCardValue}>{todayAccuracy}%</Text>
          <Text style={styles.statCardHint}>
            {yesterdayAccuracy !== null ? `昨日 ${yesterdayAccuracy}%` : '尚無昨日紀錄'}
          </Text>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statCardHead}>
            <Text style={styles.statCardHeadText}>今日已做</Text>
            <Icon name="pencil" size={17} color={colors.cyan} />
          </View>
          <Text style={styles.statCardValue}>{todayStats.total} 題</Text>
          <Text style={styles.statCardHint}>目標：{DAILY_GOAL} 題</Text>
        </View>
      </View>

      <PrimaryButton onPress={onMixedPractice} style={styles.mixedBtn}>
        <Icon name="shuffle" size={19} color={colors.primaryInk} />
        <Text style={buttonTextStyles.primary}>隨機綜合練習（10 題）</Text>
      </PrimaryButton>

      <Text style={styles.sectionTitle}>分科高效刷題</Text>
      <View style={styles.chapterList}>
        {chapters.map((ch, i) => {
          const done = ch.levels.filter((l) => progress.completedLevels[l.id]).length;
          const pct = ch.levels.length ? (done / ch.levels.length) * 100 : 0;
          const accent = CHAPTER_ACCENTS[i] ?? colors.ink;
          return (
            <Pressable key={ch.id} style={styles.chapterCard} onPress={() => onOpenChapter(ch.id)}>
              <Icon name={ch.icon} size={30} color={accent} />
              <View style={styles.chapterInfo}>
                <Text style={styles.chapterName}>{ch.title}</Text>
                <Text style={styles.chapterProgress}>
                  完成 {done} / {ch.levels.length} 關
                </Text>
                <View style={styles.chapterBar}>
                  <View style={[styles.chapterBarFill, { width: `${pct}%`, backgroundColor: accent }]} />
                </View>
              </View>
              <Icon name="chevron-right" size={22} color="rgba(95, 240, 224, 0.4)" />
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
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: 'rgba(255, 180, 84, 0.35)',
    padding: 20,
    gap: 10,
  },
  streakTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  streakTopText: {
    fontFamily: fonts.mono.regular,
    fontSize: 12,
    color: 'rgba(95, 240, 224, 0.6)',
    letterSpacing: 0.5,
  },
  streakCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streakCountText: {
    fontFamily: fonts.mono.extraBold,
    fontSize: 30,
    fontWeight: '800',
    color: colors.primary,
  },
  streakWeek: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginTop: 6,
  },
  streakDay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 30,
    backgroundColor: colors.track,
    borderWidth: 1,
    borderColor: colors.optionBorder,
  },
  streakDayDone: {
    backgroundColor: 'rgba(95, 240, 224, 0.25)',
    borderColor: 'transparent',
  },
  streakDayToday: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  streakDayText: {
    fontFamily: fonts.mono.regular,
    fontSize: 12,
    color: 'rgba(95, 240, 224, 0.55)',
  },
  streakDayTextDone: {
    color: colors.cyan,
    fontFamily: fonts.mono.bold,
    fontWeight: '700',
  },
  streakDayTextToday: {
    color: '#241300',
    fontFamily: fonts.mono.bold,
    fontWeight: '700',
  },
  statRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.optionBorder,
    padding: 16,
  },
  statCardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statCardHeadText: {
    fontFamily: fonts.mono.regular,
    fontSize: 11,
    letterSpacing: 0.5,
    color: 'rgba(95, 240, 224, 0.55)',
  },
  statCardValue: {
    fontFamily: fonts.mono.extraBold,
    fontSize: 26,
    fontWeight: '800',
    color: colors.cyan,
    marginTop: 8,
  },
  statCardHint: {
    fontFamily: fonts.sans.regular,
    fontSize: 12,
    color: colors.inkFaint,
    marginTop: 4,
  },
  mixedBtn: {
    width: '100%',
    marginTop: 4,
  },
  sectionTitle: {
    fontFamily: fonts.mono.bold,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: 'rgba(95, 240, 224, 0.65)',
    marginTop: 8,
  },
  chapterList: {
    marginTop: -6,
    gap: 12,
  },
  chapterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    width: '100%',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.optionBorder,
    padding: 16,
  },
  chapterInfo: {
    flex: 1,
    gap: 2,
  },
  chapterName: {
    fontFamily: fonts.sans.bold,
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
  },
  chapterProgress: {
    fontFamily: fonts.mono.regular,
    fontSize: 11,
    color: 'rgba(95, 240, 224, 0.4)',
  },
  chapterBar: {
    height: 6,
    backgroundColor: colors.track,
    overflow: 'hidden',
    marginTop: 4,
  },
  chapterBarFill: {
    height: '100%',
  },
});
