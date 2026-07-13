import { useCallback, useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import Icon from '@/components/Icon';
import { colors, fonts } from '@/constants/theme';
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

// 對照 index.css 的 --heat-0..4（sequential 色階，經 dataviz skill 驗證過）
const HEAT_COLORS = [colors.heat0, colors.heat1, colors.heat2, colors.heat3, colors.heat4];

interface StatsProps {
  progress: Progress;
}

// 對照 apps/web 的 Stats.tsx；熱力圖／迷你長條圖沒有 hover title，觸控裝置沒有對應行為，
// 是刻意的簡化（跟 Phase 3 CodeBlock/Icon 的 MVP 簡化同一個原則）
export default function Stats({ progress }: StatsProps) {
  const dailyStats = progress.dailyStats ?? {};
  const chapterStats = progress.chapterStats ?? {};
  const heatmapScrollRef = useRef<ScrollView>(null);
  // 熱力圖要預設捲到最右邊（今天）。只用 onContentSizeChange 在某些情況下會搶在這個
  // 水平 ScrollView 自己的寬度（viewport）量到之前就先觸發，算出來的捲動位置不準——
  // 額外掛 onLayout 一起觸發同一個函式，兩邊哪個晚到就以哪個為準，同時包一層
  // requestAnimationFrame 讓 scrollToEnd 儘量等到這一輪版面真的 commit 完再執行。
  const scrollHeatmapToLatest = useCallback(() => {
    requestAnimationFrame(() => heatmapScrollRef.current?.scrollToEnd({ animated: false }));
  }, []);

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
    return show ? String(month + 1) : '';
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
        <Text style={styles.tileWideLabel}>累計答對題數</Text>
        <View style={styles.tileWideValueRow}>
          <Icon name="check-circle" size={19} color={colors.cyan} />
          <Text style={styles.tileWideValue}>{totals.correct} 題</Text>
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
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            ref={heatmapScrollRef}
            onContentSizeChange={scrollHeatmapToLatest}
            onLayout={scrollHeatmapToLatest}
          >
            <View>
              <View style={styles.heatmapMonths}>
                {heatmapMonthLabels.map((label, i) => (
                  <Text style={styles.heatmapMonthLabel} numberOfLines={1} key={i}>
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
            <View style={[styles.legendDot, { backgroundColor: colors.chartCount }]} />
            <Text style={styles.miniChartTitle}>做題量</Text>
          </View>
          <View style={styles.miniChartBars}>
            {days.map((d) => (
              <View style={styles.miniBarCol} key={d.key}>
                <Text style={styles.miniBarValue}>{d.total > 0 ? d.total : ''}</Text>
                <View
                  style={[
                    styles.miniBar,
                    { backgroundColor: colors.chartCount, height: Math.max(4, (d.total / maxCount) * 72) },
                  ]}
                />
                <Text style={[styles.miniBarLabel, d.isToday && styles.miniBarLabelToday]}>{d.label}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.miniChart}>
          <View style={styles.miniChartTitleRow}>
            <View style={[styles.legendDot, { backgroundColor: colors.chartAccuracy }]} />
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
                      backgroundColor: colors.chartAccuracy,
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
      <Text style={styles.sectionHint}>
        這裡是該章節所有作答的答對率（含隨機綜合練習），跟「每日刷題」頁的完成關卡數是不同的統計方式。
      </Text>
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
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 12,
  },
  tileRow: {
    flexDirection: 'row',
    gap: 12,
  },
  tile: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.optionBorder,
    padding: 16,
    gap: 8,
  },
  tileWide: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: 'rgba(255, 180, 84, 0.25)',
    padding: 16,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tileWideValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tileLabel: {
    fontFamily: fonts.mono.regular,
    fontSize: 11,
    // 一次性淡化標籤用的透明度，跟 colors 裡既有的 cyan/primary 系列 token 沒有對應值
    color: 'rgba(95, 240, 224, 0.55)',
  },
  tileWideLabel: {
    fontFamily: fonts.mono.regular,
    fontSize: 11,
    color: 'rgba(255, 180, 84, 0.6)',
  },
  tileValue: {
    fontFamily: fonts.mono.extraBold,
    fontSize: 24,
    fontWeight: '800',
    color: colors.cyan,
  },
  tileWideValue: {
    fontFamily: fonts.mono.extraBold,
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
  },
  sectionTitle: {
    fontFamily: fonts.mono.bold,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.5,
    // 一次性淡化標籤用的透明度，跟 colors 裡既有的 cyan 系列 token 沒有對應值
    color: 'rgba(95, 240, 224, 0.65)',
    marginTop: 12,
  },
  sectionHint: {
    fontFamily: fonts.sans.regular,
    fontSize: 12,
    lineHeight: 19,
    color: colors.inkFaint,
    marginTop: -4,
  },
  heatmapCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.optionBorder,
    padding: 16,
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
    fontFamily: fonts.mono.regular,
    fontSize: 9,
    color: colors.inkFaint,
  },
  heatmapMonths: {
    flexDirection: 'row',
    gap: 3,
    height: 14,
  },
  heatmapMonthLabel: {
    // 只顯示月份數字（不含「月」字），16px 寬夠放到 2 位數（"12"）也不會被 Text 自己的
    // 換行邏輯裁掉——先前用「讓文字視覺溢出方框」的寫法在這裡的水平 ScrollView 裡不可靠
    // （超出 ScrollView 量到的內容寬度那段一樣會被裁掉，尤其是捲到最右邊、沒有下一欄可以
    // 借用空間的最後一個月份），所以改成單純夠寬的固定寬度，不依賴溢出。
    width: 16,
    fontFamily: fonts.mono.regular,
    fontSize: 9,
    color: colors.inkFaint,
  },
  heatmapGrid: {
    flexDirection: 'row',
    gap: 3,
  },
  heatmapCol: {
    width: 16,
    alignItems: 'center',
    gap: 3,
  },
  heatmapCell: {
    width: 11,
    height: 11,
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
    fontFamily: fonts.mono.regular,
    fontSize: 10,
    color: colors.inkFaint,
  },
  miniChartPair: {
    flexDirection: 'row',
    gap: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.optionBorder,
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 8,
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
    fontFamily: fonts.sans.regular,
    fontSize: 13,
    color: colors.inkSoft,
  },
  legendDot: {
    width: 8,
    height: 8,
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
    fontFamily: fonts.mono.regular,
    fontSize: 10,
    color: colors.inkFaint,
    height: 14,
  },
  miniBar: {
    width: '60%',
    minWidth: 6,
  },
  miniBarLabel: {
    fontFamily: fonts.mono.regular,
    fontSize: 10,
    color: colors.inkFaint,
    marginTop: 6,
  },
  miniBarLabelToday: {
    color: colors.primary,
    fontFamily: fonts.mono.bold,
    fontWeight: '700',
  },
  chapterList: {
    gap: 12,
  },
  chapterCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.optionBorder,
    padding: 16,
    gap: 8,
  },
  chapterCardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chapterCardTitle: {
    fontFamily: fonts.sans.regular,
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
  },
  chapterCardPct: {
    fontFamily: fonts.mono.bold,
    fontSize: 14,
    fontWeight: '700',
    color: colors.cyan,
  },
  chapterBar: {
    height: 6,
    backgroundColor: colors.track,
    overflow: 'hidden',
  },
  chapterBarFill: {
    height: '100%',
    backgroundColor: colors.cyan,
  },
  chapterCardSub: {
    fontFamily: fonts.mono.regular,
    fontSize: 10,
    color: colors.inkFaint,
  },
});
