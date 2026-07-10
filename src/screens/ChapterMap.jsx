import { chapters } from '../data/chapters'

export default function ChapterMap({ progress, onStartLevel, onBack }) {
  return (
    <div className="screen map-screen">
      <div className="screen-header">
        <button className="back-btn" onClick={onBack} aria-label="回首頁">
          ←
        </button>
        <h2>關卡地圖</h2>
      </div>

      {chapters.map((ch) => (
        <section key={ch.id} className="chapter-section">
          <h3 className="chapter-title">
            {ch.emoji} {ch.title}
            {ch.comingSoon && <span className="coming-soon">敬請期待</span>}
          </h3>
          {ch.levels.map((level, i) => {
            const record = progress.completedLevels[level.id]
            const prevDone = i === 0 || progress.completedLevels[ch.levels[i - 1].id]
            const locked = !prevDone
            return (
              <button
                key={level.id}
                className={`level-row ${locked ? 'level-locked' : ''} ${record ? 'level-done' : ''}`}
                disabled={locked}
                onClick={() => onStartLevel(level.id)}
              >
                <span className="level-icon">{locked ? '🔒' : record ? '✅' : '▶️'}</span>
                <span className="level-name">
                  {i + 1}. {level.title}
                </span>
                <span className="level-record">
                  {record ? `最佳 ${record.best}/${record.total}` : locked ? '完成上一關解鎖' : `${level.questions.length} 題`}
                </span>
              </button>
            )
          })}
        </section>
      ))}
    </div>
  )
}
