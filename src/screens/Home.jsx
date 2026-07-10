import { useRef, useState } from 'react'
import Mascot from '../components/Mascot'
import Icon from '../components/Icons'
import { chapters, getWrongQuestions } from '../data/chapters'

export default function Home({ progress, onStart, onReview, exportProgress, importProgress }) {
  const fileRef = useRef(null)
  const [importMsg, setImportMsg] = useState('')

  const totalLevels = chapters.reduce((n, ch) => n + ch.levels.length, 0)
  const doneLevels = Object.keys(progress.completedLevels).length
  const wrongCount = getWrongQuestions(progress.wrongIds).length
  const streak = progress.streak?.count ?? 0

  function handleImportFile(e) {
    const file = e.target.files[0]
    if (!file) return
    importProgress(file, (ok) => {
      setImportMsg(ok ? '進度匯入成功！' : '檔案格式不對，匯入失敗')
      setTimeout(() => setImportMsg(''), 3000)
    })
    e.target.value = ''
  }

  return (
    <div className="screen home-screen">
      <h1 className="app-title">EasyLearn</h1>
      <p className="app-subtitle">看懂 code・抓得到 bug・改得動程式</p>

      {streak > 0 && (
        <div className="streak-badge">
          <Icon name="flame" size={16} />
          連續學習 {streak} 天
        </div>
      )}

      <Mascot xp={progress.xp} />

      <button className="primary-btn start-btn" onClick={onStart}>
        {doneLevels === 0 ? '開始學習' : '繼續學習'}
        <Icon name="rocket" size={20} />
      </button>

      {wrongCount > 0 && (
        <button className="secondary-btn review-btn" onClick={onReview}>
          <Icon name="rotate-ccw" size={17} />
          錯題重練（{wrongCount} 題）
        </button>
      )}

      <div className="home-stats">
        已完成 {doneLevels} / {totalLevels} 關
      </div>

      <div className="progress-io">
        <button className="text-btn" onClick={exportProgress}>
          <Icon name="download" size={15} />
          匯出進度
        </button>
        <span className="io-divider">・</span>
        <button className="text-btn" onClick={() => fileRef.current.click()}>
          <Icon name="upload" size={15} />
          匯入進度
        </button>
        <input ref={fileRef} type="file" accept=".json" hidden onChange={handleImportFile} />
      </div>
      {importMsg && <div className="import-msg">{importMsg}</div>}

      <p className="storage-note">進度存在這台裝置的瀏覽器裡；換裝置前請先匯出。</p>
    </div>
  )
}
