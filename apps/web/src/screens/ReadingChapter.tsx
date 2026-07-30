import { useState } from 'react'
import Icon from '@/components/Icons'
import { renderInlineCode } from '@/utils/richText'
import { readingChapters } from '@easylearn/core'

interface ReadingChapterProps {
  chapterId: string
  onBack: () => void
}

// 純閱讀教材的單章頁面：每個小節是一個手風琴，展開後顯示完整段落內容（不是條列重點）
const ReadingChapter = ({ chapterId, onBack }: ReadingChapterProps) => {
  const chapter = readingChapters.find((ch) => ch.id === chapterId)
  const [openSectionId, setOpenSectionId] = useState<string | null>(chapter?.sections[0]?.id ?? null)

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

      {chapter.sections.map((section) => {
        const isOpen = openSectionId === section.id
        return (
          <div key={section.id} className={`recap-level ${isOpen ? 'is-open' : ''}`}>
            <button
              className="recap-level-head"
              onClick={() => setOpenSectionId(isOpen ? null : section.id)}
              aria-expanded={isOpen}
            >
              <span className="recap-level-title">{section.title}</span>
              <Icon name="chevron-right" size={18} className="recap-level-chevron" />
            </button>
            {isOpen && (
              <div className="recap-section-body">
                {section.paragraphs.map((paragraph, index) => (
                  <p key={index} className="recap-section-paragraph">
                    {renderInlineCode(paragraph)}
                  </p>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default ReadingChapter
