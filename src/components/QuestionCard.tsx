import CodeBlock from './CodeBlock'
import Icon from './Icons'
import { TYPE_META } from '../data/typeMeta'

export default function QuestionCard({
  question,
  selected,
  onSelect,
  onNext,
  isLast,
  saved,
  onToggleSave,
}) {
  const answered = selected !== null
  const correct = answered && selected === question.answer
  const typeMeta = TYPE_META[question.type]

  return (
    <div className="question-card">
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

      <p className="question-prompt">{question.prompt}</p>
      <CodeBlock code={question.code} />

      <div className="options">
        {question.options.map((opt) => {
          let cls = 'option-btn'
          if (answered) {
            if (opt.id === question.answer) cls += ' is-correct'
            else if (opt.id === selected) cls += ' is-wrong'
            else cls += ' is-dimmed'
          }
          return (
            <button
              key={opt.id}
              className={cls}
              disabled={answered}
              onClick={() => onSelect(opt.id)}
            >
              {opt.text}
            </button>
          )
        })}
      </div>

      {answered && (
        <div className={`feedback ${correct ? 'feedback-correct' : 'feedback-wrong'}`}>
          <div className="feedback-title">
            <Icon name={correct ? 'check-circle' : 'lightbulb'} size={20} />
            {correct ? '答對了！+10 XP' : '沒關係，弄懂它才是重點 +2 XP'}
          </div>
          <p className="feedback-explanation">{question.explanation}</p>
          <a className="docs-link" href={question.docs} target="_blank" rel="noreferrer">
            <Icon name="book-open" size={16} />
            延伸閱讀：官方文件
          </a>
          <button className="primary-btn next-btn" onClick={onNext}>
            {isLast ? '看結算' : '下一題'}
            <Icon name={isLast ? 'flag' : 'arrow-right'} size={18} />
          </button>
        </div>
      )}
    </div>
  )
}
