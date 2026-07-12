import { chapters } from '../data/chapters'
import Icon from '../components/Icons'
import type { IconName, Progress } from '@easylearn/core'

interface ChapterMapProps {
  chapterId: string | null
  progress: Progress
  onStartLevel: (levelId: string) => void
  onBack: () => void
}

// 章節清單顯示在 Home 頁；這裡只負責單一章節的關卡清單
const ChapterMap = ({ chapterId, progress, onStartLevel, onBack }: ChapterMapProps) => {
  const chapter = chapters.find((ch) => ch.id === chapterId)
  if (!chapter) return null
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
        const statusIcon: IconName = locked ? 'lock' : record ? 'check-circle' : 'play'
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
              {record
                ? `最佳 ${record.best}/${record.total}`
                : locked
                  ? '完成上一關解鎖'
                  : `共 ${level.questions.length} 題`}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export default ChapterMap
