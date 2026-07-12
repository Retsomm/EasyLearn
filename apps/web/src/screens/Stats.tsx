import { useEffect, useRef } from 'react'
import Icon from '../components/Icons'
import { chapters } from '../data/chapters'
import { todayStr } from '../hooks/useProgress'
import type { Progress } from '@easylearn/core'

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六']

const getLast7Dates = (): Date[] => {
  const today = new Date()
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (6 - i))
    return d
  })
}

// 熱力圖範圍：近 26 週（約半年），週日為每欄第一天，補到今天所在週的週六（未來日期補 null 佔位）
const HEATMAP_WEEKS = 26

const getHeatmapDays = (): (string | null)[] => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const totalDays = HEATMAP_WEEKS * 7
  const start = new Date(today)
  start.setDate(start.getDate() - (totalDays - 1))
  start.setDate(start.getDate() - start.getDay())
  const days: (string | null)[] = []
  const cursor = new Date(start)
  while (cursor <= today) {
    days.push(cursor.toLocaleDateString('en-CA'))
    cursor.setDate(cursor.getDate() + 1)
  }
  while (days.length % 7 !== 0) days.push(null)
  return days
}

const chunkIntoWeeks = (days: (string | null)[]): (string | null)[][] => {
  const weeks: (string | null)[][] = []
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))
  return weeks
}

// 依做題量分 5 級（0 = 沒作答，1~4 依量遞增），對應熱力圖驗證過的 sequential 色階
const activityLevel = (total: number): number => {
  if (total <= 0) return 0
  if (total < 4) return 1
  if (total < 8) return 2
  if (total < 15) return 3
  return 4
}

const MONTH_LABELS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

interface StatsProps {
  progress: Progress
}

const Stats = ({ progress }: StatsProps) => {
  const dailyStats = progress.dailyStats ?? {}
  const chapterStats = progress.chapterStats ?? {}
  const heatmapScrollRef = useRef<HTMLDivElement>(null)

  const totals = Object.values(dailyStats).reduce(
    (acc, d) => ({ total: acc.total + d.total, correct: acc.correct + d.correct }),
    { total: 0, correct: 0 },
  )
  const avgAccuracy = totals.total ? Math.round((totals.correct / totals.total) * 100) : 0

  const days = getLast7Dates().map((d) => {
    const key = d.toLocaleDateString('en-CA')
    const stat = dailyStats[key] ?? { total: 0, correct: 0 }
    const accuracy = stat.total ? Math.round((stat.correct / stat.total) * 100) : 0
    return { key, label: WEEKDAY_LABELS[d.getDay()], total: stat.total, accuracy, isToday: key === todayStr() }
  })
  const maxCount = Math.max(1, ...days.map((d) => d.total))

  const heatmapWeeks = chunkIntoWeeks(getHeatmapDays())
  let lastMonth = -1
  const heatmapMonthLabels = heatmapWeeks.map((week) => {
    const firstReal = week.find((d): d is string => d !== null)
    const month = firstReal ? new Date(firstReal).getMonth() : lastMonth
    const show = firstReal !== undefined && month !== lastMonth
    lastMonth = month
    return show ? MONTH_LABELS[month] : ''
  })

  // 一開始就捲到最右邊（今天），歷史紀錄往左滑才看得到
  useEffect(() => {
    const el = heatmapScrollRef.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [])

  return (
    <div className="screen stats-screen">
      <div className="stat-tile-row">
        <div className="stat-tile">
          <span className="stat-tile-label">總答題數</span>
          <span className="stat-tile-value">{totals.total} 題</span>
        </div>
        <div className="stat-tile">
          <span className="stat-tile-label">平均正確率</span>
          <span className="stat-tile-value">{avgAccuracy}%</span>
        </div>
      </div>
      <div className="stat-tile stat-tile-wide">
        <span className="stat-tile-label">累計答對題數</span>
        <span className="stat-tile-value">
          <Icon name="check-circle" size={19} />
          {totals.correct} 題
        </span>
      </div>

      <h3 className="section-title">近半年學習熱力圖</h3>
      <div className="heatmap-card">
        <div className="heatmap-row">
          <div className="heatmap-weekday-col">
            <span className="heatmap-month-spacer" />
            {WEEKDAY_LABELS.map((label, i) => (
              <span className="heatmap-weekday" key={label}>
                {i % 2 === 1 ? label : ''}
              </span>
            ))}
          </div>
          <div className="heatmap-scroll" ref={heatmapScrollRef}>
            <div className="heatmap-inner">
              <div className="heatmap-months">
                {heatmapMonthLabels.map((label, i) => (
                  <span className="heatmap-month-label" key={i}>
                    {label}
                  </span>
                ))}
              </div>
              <div className="heatmap-grid">
                {heatmapWeeks.map((week, wi) => (
                  <div className="heatmap-col" key={wi}>
                    {week.map((date, di) =>
                      date ? (
                        <span
                          key={date}
                          className={`heatmap-cell heatmap-level-${activityLevel(dailyStats[date]?.total ?? 0)}`}
                          title={`${date}：${dailyStats[date]?.total ?? 0} 題`}
                        />
                      ) : (
                        <span className="heatmap-cell heatmap-cell-blank" key={di} />
                      ),
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="heatmap-legend">
          <span>少</span>
          {[0, 1, 2, 3, 4].map((l) => (
            <span className={`heatmap-cell heatmap-level-${l}`} key={l} />
          ))}
          <span>多</span>
        </div>
      </div>

      <h3 className="section-title">近 7 日學習進度</h3>
      <div className="mini-chart-pair">
        <div className="mini-chart">
          <div className="mini-chart-title">
            <span className="legend-dot legend-dot-count" />
            做題量
          </div>
          <div className="mini-chart-bars">
            {days.map((d) => (
              <div className="mini-bar-col" key={d.key} title={`${d.label}：${d.total} 題`}>
                <span className="mini-bar-value">{d.total > 0 ? d.total : ''}</span>
                <span
                  className="mini-bar mini-bar-count"
                  style={{ height: `${Math.max(4, (d.total / maxCount) * 72)}px` }}
                />
                <span className={`mini-bar-label ${d.isToday ? 'is-today' : ''}`}>{d.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mini-chart">
          <div className="mini-chart-title">
            <span className="legend-dot legend-dot-accuracy" />
            正確率
          </div>
          <div className="mini-chart-bars">
            {days.map((d) => (
              <div className="mini-bar-col" key={d.key} title={`${d.label}：${d.accuracy}%`}>
                <span className="mini-bar-value">{d.total > 0 ? `${d.accuracy}%` : ''}</span>
                <span
                  className="mini-bar mini-bar-accuracy"
                  style={{ height: `${d.total > 0 ? Math.max(4, (d.accuracy / 100) * 72) : 2}px` }}
                />
                <span className={`mini-bar-label ${d.isToday ? 'is-today' : ''}`}>{d.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <h3 className="section-title">分科成效細分</h3>
      <div className="chapter-stat-list">
        {chapters.map((ch) => {
          const stat = chapterStats[ch.id] ?? { total: 0, correct: 0 }
          const pct = stat.total ? Math.round((stat.correct / stat.total) * 100) : 0
          return (
            <div className="chapter-stat-card" key={ch.id}>
              <div className="chapter-stat-head">
                <span>{ch.title}</span>
                <strong>{pct}%</strong>
              </div>
              <div className="chapter-bar">
                <span className="chapter-bar-fill" style={{ width: `${pct}%` }} />
              </div>
              <div className="chapter-stat-sub">
                答對 {stat.correct} / 總答 {stat.total}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Stats
