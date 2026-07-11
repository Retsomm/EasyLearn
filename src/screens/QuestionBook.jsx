import Icon from '../components/Icons'
import QuestionReview from '../components/QuestionReview'

export default function QuestionBook({ kind, entries, savedIds, onToggleSave, onBack, onReview }) {
  const isWrong = kind === 'wrong'
  const title = isWrong ? '錯題本' : '收藏題目'

  return (
    <div className="screen map-screen book-screen">
      <div className="screen-header">
        <button className="back-btn" onClick={onBack} aria-label="回首頁">
          <Icon name="arrow-left" size={20} />
        </button>
        <h2>{title}</h2>
      </div>

      {isWrong && entries.length > 0 && (
        <button className="secondary-btn review-btn" onClick={onReview}>
          <Icon name="rotate-ccw" size={17} />
          開始重練（{entries.length} 題）
        </button>
      )}

      {entries.length === 0 ? (
        <p className="book-empty">
          {isWrong ? '目前沒有錯題，太厲害了！' : '還沒有收藏的題目，答題時點星號收藏吧！'}
        </p>
      ) : (
        <div className="book-list">
          {entries.map((item) => {
            const question = isWrong ? item.question : item
            return (
              <QuestionReview
                key={question.id}
                question={question}
                saved={!!savedIds[question.id]}
                onToggleSave={onToggleSave}
                meta={isWrong ? item : null}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
