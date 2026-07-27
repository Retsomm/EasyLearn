import Icon from '@/components/Icons'
import { getSavedKeyPoints } from '@easylearn/core'

interface SavedKeyPointsProps {
  savedKeyPointIds: Record<string, boolean>
  onToggleSavedKeyPoint: (keyPointId: string) => void
  onBack: () => void
}

// 收藏重點清單：從各章重點複習分頁點星號收藏的條目集中在這裡
const SavedKeyPoints = ({ savedKeyPointIds, onToggleSavedKeyPoint, onBack }: SavedKeyPointsProps) => {
  const entries = getSavedKeyPoints(savedKeyPointIds)

  return (
    <div className="screen map-screen book-screen">
      <div className="screen-header">
        <button className="back-btn" onClick={onBack} aria-label="回精選筆記">
          <Icon name="arrow-left" size={20} />
        </button>
        <h2>收藏重點</h2>
      </div>

      {entries.length === 0 ? (
        <p className="book-empty">還沒有收藏的重點，在「章節重點」分頁點星號收藏吧！</p>
      ) : (
        <div className="book-list">
          {entries.map((entry) => (
            <div key={entry.id} className="keypoint-book-item">
              <span className="keypoint-book-label">
                {entry.chapterTitle} · {entry.levelTitle}
              </span>
              <div className="recap-key-point">
                <span className="recap-key-point-text">{entry.text}</span>
                <button
                  className="save-btn is-saved"
                  onClick={() => onToggleSavedKeyPoint(entry.id)}
                  aria-label="取消收藏這條重點"
                  aria-pressed="true"
                >
                  <Icon name="star" size={17} className="icon-filled" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SavedKeyPoints
