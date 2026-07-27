import { useState } from 'react'
import Icon from '@/components/Icons'
import { chapters, chapterSummaries, keyPointId } from '@easylearn/core'

interface RecapChapterProps {
  chapterId: string
  savedKeyPointIds: Record<string, boolean>
  onToggleSavedKeyPoint: (keyPointId: string) => void
  onBack: () => void
}

// 單一章節的重點列表：每個關卡是一個手風琴，展開才顯示重點條列，每條重點都能收藏
const RecapChapter = ({ chapterId, savedKeyPointIds, onToggleSavedKeyPoint, onBack }: RecapChapterProps) => {
  const chapter = chapters.find((ch) => ch.id === chapterId)
  const summaries = chapterSummaries[chapterId] ?? []
  const [openLevelId, setOpenLevelId] = useState<string | null>(summaries[0]?.levelId ?? null)

  if (!chapter) return null

  return (
    <div className="screen recap-chapter-screen">
      <div className="screen-header">
        <button className="back-btn" onClick={onBack} aria-label="回章節重點清單">
          <Icon name="arrow-left" size={20} />
        </button>
        <h2 className="level-list-title">
          <Icon name={chapter.icon} size={22} /> {chapter.title}
        </h2>
      </div>

      {summaries.map((summary) => {
        const level = chapter.levels.find((l) => l.id === summary.levelId)
        if (!level) return null
        const isOpen = openLevelId === summary.levelId
        return (
          <div key={summary.levelId} className={`recap-level ${isOpen ? 'is-open' : ''}`}>
            <button
              className="recap-level-head"
              onClick={() => setOpenLevelId(isOpen ? null : summary.levelId)}
              aria-expanded={isOpen}
            >
              <span className="recap-level-title">{level.title}</span>
              <Icon name="chevron-right" size={18} className="recap-level-chevron" />
            </button>
            {isOpen && (
              <ul className="recap-key-points">
                {summary.keyPoints.map((point, index) => {
                  const id = keyPointId(summary.levelId, index)
                  const saved = !!savedKeyPointIds[id]
                  return (
                    <li key={id} className="recap-key-point">
                      <span className="recap-key-point-text">{point}</span>
                      <button
                        className={`save-btn ${saved ? 'is-saved' : ''}`}
                        onClick={() => onToggleSavedKeyPoint(id)}
                        aria-label={saved ? '取消收藏這條重點' : '收藏這條重點'}
                        aria-pressed={saved}
                      >
                        <Icon name="star" size={17} className={saved ? 'icon-filled' : ''} />
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default RecapChapter
