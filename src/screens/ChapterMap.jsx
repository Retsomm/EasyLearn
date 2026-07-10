import { useState } from 'react'
import { chapters } from '../data/chapters'
import Icon from '../components/Icons'

function ChapterList({ progress, onOpenChapter, onBack }) {
  return (
    <div className="screen map-screen">
      <div className="screen-header">
        <button className="back-btn" onClick={onBack} aria-label="回首頁">
          <Icon name="arrow-left" size={20} />
        </button>
        <h2>選擇章節</h2>
      </div>

      {chapters.map((ch) => {
        const done = ch.levels.filter((l) => progress.completedLevels[l.id]).length
        return (
          <button
            key={ch.id}
            className="chapter-card"
            disabled={ch.comingSoon}
            onClick={() => onOpenChapter(ch.id)}
          >
            <span className="chapter-emoji">
              <Icon name={ch.icon} size={30} />
            </span>
            <span className="chapter-info">
              <span className="chapter-name">{ch.title}</span>
              <span className="chapter-progress">
                {ch.comingSoon ? '敬請期待' : `完成 ${done} / ${ch.levels.length} 關`}
              </span>
            </span>
            {!ch.comingSoon && (
              <span className="chapter-bar">
                <span
                  className="chapter-bar-fill"
                  style={{ width: `${ch.levels.length ? (done / ch.levels.length) * 100 : 0}%` }}
                />
              </span>
            )}
            <span className="chapter-arrow">
              <Icon name="chevron-right" size={22} />
            </span>
          </button>
        )
      })}
    </div>
  )
}

function LevelList({ chapter, progress, onStartLevel, onBack }) {
  return (
    <div className="screen map-screen">
      <div className="screen-header">
        <button className="back-btn" onClick={onBack} aria-label="回章節清單">
          <Icon name="arrow-left" size={20} />
        </button>
        <h2 className="level-list-title">
          <Icon name={chapter.icon} size={22} /> {chapter.title}
        </h2>
      </div>

      {chapter.levels.map((level, i) => {
        const record = progress.completedLevels[level.id]
        const prevDone = i === 0 || progress.completedLevels[chapter.levels[i - 1].id]
        const locked = !prevDone
        const statusIcon = locked ? 'lock' : record ? 'check-circle' : 'play'
        return (
          <button
            key={level.id}
            className={`level-row ${locked ? 'level-locked' : ''} ${record ? 'level-done' : ''}`}
            disabled={locked}
            onClick={() => onStartLevel(level.id)}
          >
            <span className={`level-icon status-${statusIcon}`}>
              <Icon name={statusIcon} size={20} />
            </span>
            <span className="level-name">
              {i + 1}. {level.title}
            </span>
            <span className="level-record">
              {record ? `最佳 ${record.best}/${record.total}` : locked ? '完成上一關解鎖' : `${level.questions.length} 題`}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export default function ChapterMap({ progress, onStartLevel, onBack }) {
  const [chapterId, setChapterId] = useState(null)
  const chapter = chapters.find((ch) => ch.id === chapterId)

  if (chapter) {
    return (
      <LevelList
        chapter={chapter}
        progress={progress}
        onStartLevel={onStartLevel}
        onBack={() => setChapterId(null)}
      />
    )
  }

  return <ChapterList progress={progress} onOpenChapter={setChapterId} onBack={onBack} />
}
