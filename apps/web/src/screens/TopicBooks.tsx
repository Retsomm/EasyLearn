import Icon from '@/components/Icons'
import { topics, type Progress } from '@easylearn/core'

interface TopicBooksProps {
  topicId: string
  progress: Progress
  onOpenChapter: (chapterId: string) => void
  onBack: () => void
}

// 一本書底下有好幾章時的中間頁：先列出這本書的每一章，點進去才是單一章的關卡列表（ChapterMap）
const TopicBooks = ({ topicId, progress, onOpenChapter, onBack }: TopicBooksProps) => {
  const topic = topics.find((t) => t.id === topicId)
  if (!topic) return null
  return (
    <div className="screen map-screen">
      <div className="screen-header">
        <button className="back-btn" onClick={onBack} aria-label="回主題清單">
          <Icon name="arrow-left" size={20} />
        </button>
        <h2 className="level-list-title">
          <Icon name={topic.icon} size={22} /> {topic.title}
        </h2>
      </div>

      <div className="chapter-list">
        {topic.chapters.map((ch, i) => {
          const done = ch.levels.filter((l) => progress.completedLevels[l.id]).length
          return (
            <button key={ch.id} className="chapter-card" onClick={() => onOpenChapter(ch.id)}>
              <span className="chapter-emoji">
                <Icon name={ch.icon} size={30} />
              </span>
              <span className="chapter-info">
                <span className="chapter-name">第 {i + 1} 章：{ch.title}</span>
                <span className="chapter-progress">
                  完成 {done} / {ch.levels.length} 關
                </span>
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

export default TopicBooks
