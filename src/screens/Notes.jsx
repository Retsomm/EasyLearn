import Icon from '../components/Icons'
import { getWrongQuestions } from '../data/chapters'

function handleActivateKey(handler) {
  return (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handler()
    }
  }
}

export default function Notes({ progress, onOpenWrongBook, onOpenSavedBook, onReview, onPracticeSaved }) {
  const wrongCount = getWrongQuestions(progress.wrongIds ?? {}).length
  const savedCount = Object.keys(progress.savedIds ?? {}).length

  return (
    <div className="screen notes-screen">
      <h2 className="page-title">精選筆記</h2>

      <div
        className="note-card note-card-wrong"
        onClick={onOpenWrongBook}
        onKeyDown={handleActivateKey(onOpenWrongBook)}
        role="button"
        tabIndex={0}
      >
        <div className="note-card-head">
          <span className="note-card-title">
            <Icon name="book-open" size={20} />
            錯題本
          </span>
        </div>
        <p className="note-card-count">目前累積 {wrongCount} 題錯題</p>
        <button
          className="note-card-btn"
          disabled={wrongCount === 0}
          onClick={(e) => {
            e.stopPropagation()
            onReview()
          }}
        >
          開始複習
        </button>
      </div>

      <div
        className="note-card note-card-saved"
        onClick={onOpenSavedBook}
        onKeyDown={handleActivateKey(onOpenSavedBook)}
        role="button"
        tabIndex={0}
      >
        <div className="note-card-head">
          <span className="note-card-title">
            <Icon name="star" size={20} className="icon-filled" />
            收藏題庫
          </span>
        </div>
        <p className="note-card-count">目前累積 {savedCount} 題收藏</p>
        <button
          className="note-card-btn"
          disabled={savedCount === 0}
          onClick={(e) => {
            e.stopPropagation()
            onPracticeSaved()
          }}
        >
          {savedCount === 0 ? '無收藏題' : '開始練習'}
        </button>
      </div>
    </div>
  )
}
