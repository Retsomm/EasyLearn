import Icon from '@/components/Icons'
import { chapters, chapterSummaries, readingChapters } from '@easylearn/core'

interface RecapProps {
  onOpenChapter: (chapterId: string) => void
  onOpenReadingChapter: (chapterId: string) => void
}

// 章節重點清單：只有已經整理過重點的章節可以點進去，其餘顯示「籌備中」。
// 下方另外列出「教材」——沒有測驗關卡、純閱讀的官方文件翻譯內容，跟上面的重點條列是兩回事。
const Recap = ({ onOpenChapter, onOpenReadingChapter }: RecapProps) => (
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

    {readingChapters.length > 0 && (
      <>
        <h2 className="page-title">教材</h2>
        <p className="section-hint">沒有測驗，純閱讀官方文件翻譯內容，從零開始搞懂一個主題</p>
        <div className="chapter-list">
          {readingChapters.map((ch) => (
            <button
              key={ch.id}
              className="chapter-card"
              onClick={() => onOpenReadingChapter(ch.id)}
            >
              <span className="chapter-emoji">
                <Icon name={ch.icon} size={30} />
              </span>
              <span className="chapter-info">
                <span className="chapter-name">{ch.title}</span>
                <span className="chapter-progress">{`共 ${ch.sections.length} 節`}</span>
              </span>
              <span className="chapter-arrow">
                <Icon name="chevron-right" size={22} />
              </span>
            </button>
          ))}
        </div>
      </>
    )}
  </div>
)

export default Recap
