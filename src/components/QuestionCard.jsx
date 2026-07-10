import CodeBlock from './CodeBlock'

const TYPE_LABELS = {
  'predict-output': '🔮 預測輸出',
  'find-bug': '🐛 抓蟲',
  'same-or-not': '🔍 改壞了嗎',
  'fill-in': '✍️ 動手填空',
}

export default function QuestionCard({ question, selected, onSelect, onNext, isLast }) {
  const answered = selected !== null
  const correct = answered && selected === question.answer

  return (
    <div className="question-card">
      <div className="question-meta">
        <span className="type-badge">{TYPE_LABELS[question.type]}</span>
        <span className="topic-label">{question.topic}</span>
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
            {correct ? '🎉 答對了！+10 XP' : '💡 沒關係，弄懂它才是重點 +2 XP'}
          </div>
          <p className="feedback-explanation">{question.explanation}</p>
          <a className="docs-link" href={question.docs} target="_blank" rel="noreferrer">
            📖 延伸閱讀：官方文件
          </a>
          <button className="primary-btn next-btn" onClick={onNext}>
            {isLast ? '看結算 🏁' : '下一題 →'}
          </button>
        </div>
      )}
    </div>
  )
}
