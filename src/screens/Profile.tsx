import { useRef, useState, type ChangeEvent } from 'react'
import { SignInButton, useClerk, useUser } from '@clerk/react'
import AccountHeader from '../components/AccountHeader'
import GrowthHistory from '../components/GrowthHistory'
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
  const [showGrowth, setShowGrowth] = useState(false)
  const { user, isSignedIn, isLoaded } = useUser()
  const { signOut } = useClerk()

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

  if (!isLoaded) return null

  if (!isSignedIn) {
    return (
      <div className="screen login-screen">
        <div className="login-box">
          <Icon name="sprout" size={36} />
          <h2 className="page-title">登入 EasyLearn</h2>
          <p className="login-desc">登入後可在多裝置同步學習進度（開發中）；未登入也能繼續刷題，進度先存在這台裝置。</p>
          <SignInButton mode="modal">
            <button className="primary-btn">
              <Icon name="user" size={18} />
              使用 Google 登入
            </button>
          </SignInButton>
        </div>
      </div>
    )
  }

  return (
    <div className="screen profile-screen">
      <div className="profile-card">
        <h3 className="section-title">使用者資料</h3>
        <AccountHeader user={user} />
      </div>

      <div className="profile-card">
        <h3 className="section-title">經驗值</h3>
        <Mascot xp={progress.xp} />
        <button className="text-btn growth-toggle" onClick={() => setShowGrowth((v) => !v)}>
          <Icon name="chevron-right" size={14} className={showGrowth ? 'is-open' : ''} />
          {showGrowth ? '收起成長史' : '查看成長史'}
        </button>
        {showGrowth && <GrowthHistory xp={progress.xp} />}
      </div>

      <h3 className="section-title">學習統計</h3>
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

      <div className="profile-card">
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

      <button className="secondary-btn logout-btn" onClick={() => signOut()}>
        <Icon name="logout" size={16} />
        登出
      </button>
    </div>
  )
}

export default Profile
