import { useRef, useState } from 'react'
import Mascot from '../components/Mascot'
import Icon from '../components/Icons'
import { chapters } from '../data/chapters'

export default function Home({ progress, onStart, exportProgress, importProgress }) {
  const fileRef = useRef(null)
  const [importMsg, setImportMsg] = useState('')

  const totalLevels = chapters.reduce((n, ch) => n + ch.levels.length, 0)
  const doneLevels = Object.keys(progress.completedLevels).length

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

      <Mascot xp={progress.xp} />

      <button className="primary-btn start-btn" onClick={onStart}>
        {doneLevels === 0 ? '開始學習' : '繼續學習'}
        <Icon name="rocket" size={20} />
      </button>

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
