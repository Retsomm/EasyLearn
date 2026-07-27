import Icon from '@/components/Icons'
import { chapters, chapterSummaries } from '@easylearn/core'

interface RecapProps {
  onOpenChapter: (chapterId: string) => void
}

// 章節重點清單：只有已經整理過重點的章節可以點進去，其餘顯示「籌備中」
const Recap = ({ onOpenChapter }: RecapProps) => (
  <div className="screen recap-screen">
    <h2 className="page-title">章節重點</h2>
    <p className="section-hint">複習每一章的核心概念，練習題目之外再重讀一次重點整理</p>
    <div className="chapter-list">
      {chapters.map((ch) => {
        const levelCount = chapterSummaries[ch.id]?.length ?? 0
        const hasSummary = levelCount > 0
        return (
          <button
            key={ch.id}
            className="chapter-card"
            disabled={!hasSummary}
            onClick={() => hasSummary && onOpenChapter(ch.id)}
          >
            <span className="chapter-emoji">
              <Icon name={ch.icon} size={30} />
            </span>
            <span className="chapter-info">
              <span className="chapter-name">{ch.title}</span>
              <span className="chapter-progress">
                {hasSummary ? `共 ${levelCount} 章重點整理` : '重點整理籌備中'}
              </span>
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

export default Recap
