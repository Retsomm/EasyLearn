import { useRef, useState, type ChangeEvent } from 'react'
import Mascot from '../components/Mascot'
import Icon from '../components/Icons'
import { chapters } from '../data/chapters'
import type { Progress } from '../types'

interface ProfileProps {
  progress: Progress
  exportProgress: () => void
  importProgress: (file: File, onDone: (ok: boolean) => void) => void
}

const Profile = ({ progress, exportProgress, importProgress }: ProfileProps) => {
  const fileRef = useRef<HTMLInputElement>(null)
  const [importMsg, setImportMsg] = useState('')

  const totalLevels = chapters.reduce((n, ch) => n + ch.levels.length, 0)
  const doneLevels = Object.keys(progress.completedLevels).length
  const streak = progress.streak?.count ?? 0
  const totalAnswered = Object.values(progress.dailyStats ?? {}).reduce((n, d) => n + d.total, 0)

  const handleImportFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    importProgress(file, (ok) => {
      setImportMsg(ok ? '進度匯入成功！' : '檔案格式不對，匯入失敗')
      setTimeout(() => setImportMsg(''), 3000)
    })
    e.target.value = ''
  }

  return (
    <div className="screen profile-screen">
      <h2 className="page-title">個人資料</h2>

      <Mascot xp={progress.xp} />

      <div className="profile-stat-grid">
        <div className="profile-stat">
          <span className="profile-stat-value">{progress.xp}</span>
          <span className="profile-stat-label">總 XP</span>
        </div>
        <div className="profile-stat">
          <span className="profile-stat-value">{streak} 天</span>
          <span className="profile-stat-label">連續學習</span>
        </div>
        <div className="profile-stat">
          <span className="profile-stat-value">
            {doneLevels} / {totalLevels}
          </span>
          <span className="profile-stat-label">完成關卡</span>
        </div>
        <div className="profile-stat">
          <span className="profile-stat-value">{totalAnswered}</span>
          <span className="profile-stat-label">累計答題</span>
        </div>
      </div>

      <h3 className="section-title">進度備份</h3>
      <div className="progress-io">
        <button className="text-btn" onClick={exportProgress}>
          <Icon name="download" size={15} />
          匯出進度
        </button>
        <span className="io-divider">・</span>
        <button className="text-btn" onClick={() => fileRef.current?.click()}>
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

export default Profile
