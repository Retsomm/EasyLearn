import CodeBlock from './CodeBlock'
import Icon from './Icons'
import { TYPE_META } from '../data/typeMeta'
import { GRADUATE_BOX } from '../hooks/useProgress'
import type { Question, WrongEntryMeta } from '@easylearn/core'

interface QuestionReviewProps {
  question: Question
  saved: boolean
  onToggleSave: (questionId: string) => void
  meta: WrongEntryMeta | null
}

// 唯讀題目卡：錯題本／收藏瀏覽頁用，直接看答案與解釋，不用重考
const QuestionReview = ({ question, saved, onToggleSave, meta }: QuestionReviewProps) => {
  const typeMeta = TYPE_META[question.type]

  return (
    <div className="question-card review-card">
      <div className="question-meta">
        <span className="type-badge">
          <Icon name={typeMeta.icon} size={14} />
          {typeMeta.label}
        </span>
        <span className="topic-label">{question.topic}</span>
        <button
          className={`save-btn ${saved ? 'is-saved' : ''}`}
          onClick={() => onToggleSave(question.id)}
          aria-label={saved ? '取消收藏這題' : '收藏這題'}
        >
          <Icon name="star" size={18} className={saved ? 'icon-filled' : ''} />
        </button>
      </div>

      {meta && (
        <div className="review-meta-info">
          <span>答錯 {meta.count} 次</span>
          <span>
            熟練度 {meta.box}/{GRADUATE_BOX}
          </span>
          {meta.lastWrong && <span>最近答錯：{meta.lastWrong}</span>}
        </div>
      )}

      <p className="question-prompt">{question.prompt}</p>
      <CodeBlock code={question.code} />

      <div className="options">
        {question.options.map((opt) => (
          <div
            key={opt.id}
            className={`option-btn is-static ${opt.id === question.answer ? 'is-correct' : 'is-dimmed'}`}
          >
            {opt.text}
          </div>
        ))}
      </div>

      <div className="feedback feedback-correct">
        <div className="feedback-title">
          <Icon name="lightbulb" size={20} />
          解釋
        </div>
        <p className="feedback-explanation">{question.explanation}</p>
        <a className="docs-link" href={question.docs} target="_blank" rel="noreferrer">
          <Icon name="book-open" size={16} />
          延伸閱讀：官方文件
        </a>
      </div>
    </div>
  )
}

export default QuestionReview
