import Icon from '../components/Icons'
import { chapters } from '../data/chapters'
import { todayStr } from '../hooks/useProgress'

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六']

function getLast7Dates() {
  const today = new Date()
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (6 - i))
    return d
  })
}

export default function Stats({ progress }) {
  const dailyStats = progress.dailyStats ?? {}
  const chapterStats = progress.chapterStats ?? {}

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

  return (
    <div className="screen stats-screen">
      <h2 className="page-title">學習數據分析</h2>

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
