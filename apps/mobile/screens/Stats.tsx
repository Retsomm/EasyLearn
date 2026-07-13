import { ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import Icon from '@/components/Icon';
import { chapters, todayStr, type Progress } from '@easylearn/core';

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

const getLast7Dates = (): Date[] => {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return d;
  });
};

// 熱力圖範圍：近 26 週（約半年），週日為每欄第一天，補到今天所在週的週六（未來日期補 null 佔位）
const HEATMAP_WEEKS = 26;

const getHeatmapDays = (): (string | null)[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const totalDays = HEATMAP_WEEKS * 7;
  const start = new Date(today);
  start.setDate(start.getDate() - (totalDays - 1));
  start.setDate(start.getDate() - start.getDay());
  const days: (string | null)[] = [];
  const cursor = new Date(start);
  while (cursor <= today) {
    days.push(cursor.toLocaleDateString('en-CA'));
    cursor.setDate(cursor.getDate() + 1);
  }
  while (days.length % 7 !== 0) days.push(null);
  return days;
};

const chunkIntoWeeks = (days: (string | null)[]): (string | null)[][] => {
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  return weeks;
};

// 依做題量分 5 級（0 = 沒作答，1~4 依量遞增），對照 apps/web Stats.tsx 同名函式
const activityLevel = (total: number): number => {
  if (total <= 0) return 0;
  if (total < 4) return 1;
  if (total < 8) return 2;
  if (total < 15) return 3;
  return 4;
};

const HEAT_COLORS = ['#88889912', '#2e78b730', '#2e78b760', '#2e78b790', '#2e78b7'];

const MONTH_LABELS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

interface StatsProps {
  progress: Progress;
}

// 對照 apps/web 的 Stats.tsx；熱力圖／迷你長條圖沒有 hover title，觸控裝置沒有對應行為，
// 是刻意的簡化（跟 Phase 3 CodeBlock/Icon 的 MVP 簡化同一個原則）
export default function Stats({ progress }: StatsProps) {
  const dailyStats = progress.dailyStats ?? {};
  const chapterStats = progress.chapterStats ?? {};

  const totals = Object.values(dailyStats).reduce(
    (acc, d) => ({ total: acc.total + d.total, correct: acc.correct + d.correct }),
    { total: 0, correct: 0 },
  );
  const avgAccuracy = totals.total ? Math.round((totals.correct / totals.total) * 100) : 0;

  const days = getLast7Dates().map((d) => {
    const key = d.toLocaleDateString('en-CA');
    const stat = dailyStats[key] ?? { total: 0, correct: 0 };
    const accuracy = stat.total ? Math.round((stat.correct / stat.total) * 100) : 0;
    return { key, label: WEEKDAY_LABELS[d.getDay()], total: stat.total, accuracy, isToday: key === todayStr() };
  });
  const maxCount = Math.max(1, ...days.map((d) => d.total));

  const heatmapWeeks = chunkIntoWeeks(getHeatmapDays());
  let lastMonth = -1;
  const heatmapMonthLabels = heatmapWeeks.map((week) => {
    const firstReal = week.find((d): d is string => d !== null);
    const month = firstReal ? new Date(firstReal).getMonth() : lastMonth;
    const show = firstReal !== undefined && month !== lastMonth;
    lastMonth = month;
    return show ? MONTH_LABELS[month] : '';
  });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.tileRow}>
        <View style={styles.tile}>
          <Text style={styles.tileLabel}>總答題數</Text>
          <Text style={styles.tileValue}>{totals.total} 題</Text>
        </View>
        <View style={styles.tile}>
          <Text style={styles.tileLabel}>平均正確率</Text>
          <Text style={styles.tileValue}>{avgAccuracy}%</Text>
        </View>
      </View>
      <View style={styles.tileWide}>
        <Text style={styles.tileLabel}>累計答對題數</Text>
        <View style={styles.tileWideValueRow}>
          <Icon name="check-circle" size={19} />
          <Text style={styles.tileValue}>{totals.correct} 題</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>近半年學習熱力圖</Text>
      <View style={styles.heatmapCard}>
        <View style={styles.heatmapRow}>
          <View style={styles.heatmapWeekdayCol}>
            <View style={styles.heatmapMonthSpacer} />
            {WEEKDAY_LABELS.map((label, i) => (
              <Text style={styles.heatmapWeekday} key={label}>
                {i % 2 === 1 ? label : ''}
              </Text>
            ))}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View>
              <View style={styles.heatmapMonths}>
                {heatmapMonthLabels.map((label, i) => (
                  <Text style={styles.heatmapMonthLabel} key={i}>
                    {label}
                  </Text>
                ))}
              </View>
              <View style={styles.heatmapGrid}>
                {heatmapWeeks.map((week, wi) => (
                  <View style={styles.heatmapCol} key={wi}>
                    {week.map((date, di) =>
                      date ? (
                        <View
                          key={date}
                          style={[
                            styles.heatmapCell,
                            { backgroundColor: HEAT_COLORS[activityLevel(dailyStats[date]?.total ?? 0)] },
                          ]}
                        />
                      ) : (
                        <View style={styles.heatmapCellBlank} key={di} />
                      ),
                    )}
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
        <View style={styles.heatmapLegend}>
          <Text style={styles.heatmapLegendText}>少</Text>
          {HEAT_COLORS.map((color, l) => (
            <View style={[styles.heatmapCell, { backgroundColor: color }]} key={l} />
          ))}
          <Text style={styles.heatmapLegendText}>多</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>近 7 日學習進度</Text>
      <View style={styles.miniChartPair}>
        <View style={styles.miniChart}>
          <View style={styles.miniChartTitleRow}>
            <View style={[styles.legendDot, { backgroundColor: '#2e78b7' }]} />
            <Text style={styles.miniChartTitle}>做題量</Text>
          </View>
          <View style={styles.miniChartBars}>
            {days.map((d) => (
              <View style={styles.miniBarCol} key={d.key}>
                <Text style={styles.miniBarValue}>{d.total > 0 ? d.total : ''}</Text>
                <View
                  style={[
                    styles.miniBar,
                    { backgroundColor: '#2e78b7', height: Math.max(4, (d.total / maxCount) * 72) },
                  ]}
                />
                <Text style={[styles.miniBarLabel, d.isToday && styles.miniBarLabelToday]}>{d.label}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.miniChart}>
          <View style={styles.miniChartTitleRow}>
            <View style={[styles.legendDot, { backgroundColor: '#2f9e44' }]} />
            <Text style={styles.miniChartTitle}>正確率</Text>
          </View>
          <View style={styles.miniChartBars}>
            {days.map((d) => (
              <View style={styles.miniBarCol} key={d.key}>
                <Text style={styles.miniBarValue}>{d.total > 0 ? `${d.accuracy}%` : ''}</Text>
                <View
                  style={[
                    styles.miniBar,
                    {
                      backgroundColor: '#2f9e44',
                      height: d.total > 0 ? Math.max(4, (d.accuracy / 100) * 72) : 2,
                    },
                  ]}
                />
                <Text style={[styles.miniBarLabel, d.isToday && styles.miniBarLabelToday]}>{d.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>分科成效細分</Text>
      <View style={styles.chapterList}>
        {chapters.map((ch) => {
          const stat = chapterStats[ch.id] ?? { total: 0, correct: 0 };
          const pct = stat.total ? Math.round((stat.correct / stat.total) * 100) : 0;
          return (
            <View style={styles.chapterCard} key={ch.id}>
              <View style={styles.chapterCardHead}>
                <Text style={styles.chapterCardTitle}>{ch.title}</Text>
                <Text style={styles.chapterCardPct}>{pct}%</Text>
              </View>
              <View style={styles.chapterBar}>
                <View style={[styles.chapterBarFill, { width: `${pct}%` }]} />
              </View>
              <Text style={styles.chapterCardSub}>
                答對 {stat.correct} / 總答 {stat.total}
              </Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  tileRow: {
    flexDirection: 'row',
    gap: 12,
  },
  tile: {
    flex: 1,
    borderRadius: 14,
    padding: 16,
    backgroundColor: '#88889910',
    gap: 8,
  },
  tileWide: {
    borderRadius: 14,
    padding: 16,
    backgroundColor: '#2e78b714',
    gap: 8,
  },
  tileWideValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tileLabel: {
    fontSize: 11,
    opacity: 0.6,
  },
  tileValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    opacity: 0.6,
    marginTop: 10,
  },
  heatmapCard: {
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#88889910',
  },
  heatmapRow: {
    flexDirection: 'row',
    gap: 6,
  },
  heatmapWeekdayCol: {
    gap: 3,
  },
  heatmapMonthSpacer: {
    height: 14,
  },
  heatmapWeekday: {
    height: 11,
    lineHeight: 11,
    fontSize: 9,
    opacity: 0.55,
  },
  heatmapMonths: {
    flexDirection: 'row',
    gap: 3,
    height: 14,
  },
  heatmapMonthLabel: {
    width: 11,
    fontSize: 9,
    opacity: 0.55,
  },
  heatmapGrid: {
    flexDirection: 'row',
    gap: 3,
  },
  heatmapCol: {
    gap: 3,
  },
  heatmapCell: {
    width: 11,
    height: 11,
    borderRadius: 2,
  },
  heatmapCellBlank: {
    width: 11,
    height: 11,
  },
  heatmapLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 10,
  },
  heatmapLegendText: {
    fontSize: 10,
    opacity: 0.55,
  },
  miniChartPair: {
    flexDirection: 'row',
    gap: 16,
    borderRadius: 14,
    padding: 16,
    backgroundColor: '#88889910',
  },
  miniChart: {
    flex: 1,
  },
  miniChartTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  miniChartTitle: {
    fontSize: 12,
    opacity: 0.7,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  miniChartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 4,
    height: 108,
  },
  miniBarCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  miniBarValue: {
    fontSize: 10,
    opacity: 0.5,
    height: 14,
  },
  miniBar: {
    width: '60%',
    minWidth: 6,
    borderRadius: 2,
  },
  miniBarLabel: {
    fontSize: 10,
    opacity: 0.5,
    marginTop: 6,
  },
  miniBarLabelToday: {
    opacity: 1,
    fontWeight: '700',
  },
  chapterList: {
    gap: 12,
  },
  chapterCard: {
    borderRadius: 14,
    padding: 16,
    backgroundColor: '#88889910',
    gap: 8,
  },
  chapterCardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chapterCardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  chapterCardPct: {
    fontSize: 14,
    fontWeight: '700',
  },
  chapterBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#88889925',
    overflow: 'hidden',
  },
  chapterBarFill: {
    height: '100%',
    backgroundColor: '#2f9e44',
  },
  chapterCardSub: {
    fontSize: 11,
    opacity: 0.55,
  },
});
