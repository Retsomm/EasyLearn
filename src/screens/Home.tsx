import Icon from '../components/Icons'
import { chapters } from '../data/chapters'
import { todayStr, yesterdayStr } from '../hooks/useProgress'

const DAILY_GOAL = 20
const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日']

function getWeekDates() {
  const now = new Date()
  const day = now.getDay() // 0=週日..6=週六
  const mondayOffset = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + mondayOffset)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d.toLocaleDateString('en-CA')
  })
}

export default function Home({ progress, onOpenChapter, onMixedPractice }) {
  const today = todayStr()
  const yesterday = yesterdayStr()
  const todayStats = progress.dailyStats[today] ?? { total: 0, correct: 0 }
  const yesterdayStats = progress.dailyStats[yesterday]
  const todayAccuracy = todayStats.total ? Math.round((todayStats.correct / todayStats.total) * 100) : 0
  const yesterdayAccuracy = yesterdayStats?.total
    ? Math.round((yesterdayStats.correct / yesterdayStats.total) * 100)
    : null
  const streak = progress.streak?.count ?? 0
  const weekDates = getWeekDates()

  return (
    <div className="screen home-screen">
      <div className="streak-card">
        <div className="streak-card-top">
          <span>連續學習天數</span>
          <span>今日任務完成 {todayStats.total} 題</span>
        </div>
        <div className="streak-card-count">
          <Icon name="flame" size={28} />
          {streak} 天
        </div>
        <div className="streak-week">
          {weekDates.map((date, i) => (
            <span
              key={date}
              className={`streak-day ${date === today ? 'is-today' : ''} ${progress.dailyStats[date] ? 'is-done' : ''}`}
            >
              {WEEKDAY_LABELS[i]}
            </span>
          ))}
        </div>
      </div>

      <div className="stat-card-row">
        <div className="stat-card">
          <div className="stat-card-head">
            <span>今日正確率</span>
            <Icon name="check-circle" size={17} />
          </div>
          <div className="stat-card-value">{todayAccuracy}%</div>
          <div className="stat-card-hint">{yesterdayAccuracy !== null ? `昨日 ${yesterdayAccuracy}%` : '尚無昨日紀錄'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-head">
            <span>今日已做</span>
            <Icon name="pencil" size={17} />
          </div>
          <div className="stat-card-value">{todayStats.total} 題</div>
          <div className="stat-card-hint">目標：{DAILY_GOAL} 題</div>
        </div>
      </div>

      <button className="primary-btn mixed-btn" onClick={onMixedPractice}>
        <Icon name="shuffle" size={19} />
        隨機綜合練習（10 題）
      </button>

      <h2 className="section-title">分科高效刷題</h2>
      <div className="chapter-list">
        {chapters.map((ch) => {
          const done = ch.levels.filter((l) => progress.completedLevels[l.id]).length
          return (
            <button key={ch.id} className="chapter-card" onClick={() => onOpenChapter(ch.id)}>
              <span className="chapter-emoji">
                <Icon name={ch.icon} size={30} />
              </span>
              <span className="chapter-info">
                <span className="chapter-name">{ch.title}</span>
                <span className="chapter-progress">完成 {done} / {ch.levels.length} 關</span>
              </span>
              <span className="chapter-bar">
                <span
                  className="chapter-bar-fill"
                  style={{ width: `${ch.levels.length ? (done / ch.levels.length) * 100 : 0}%` }}
                />
              </span>
              <span className="chapter-arrow">
                <Icon name="chevron-right" size={22} />
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
