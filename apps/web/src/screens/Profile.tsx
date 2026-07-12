import { useState } from 'react'
import { SignInButton, useClerk, useUser } from '@clerk/nextjs'
import AccountHeader from '@/components/AccountHeader'
import GrowthHistory from '@/components/GrowthHistory'
import Mascot from '@/components/Mascot'
import Icon from '@/components/Icons'
import { getStage, getNextStage } from '@/lib/stages'
import { chapters, type Progress } from '@easylearn/core'

interface ProfileProps {
  progress: Progress
}

const Profile = ({ progress }: ProfileProps) => {
  const [showGrowth, setShowGrowth] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { user, isSignedIn, isLoaded } = useUser()
  const { signOut } = useClerk()

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm('確定要刪除帳號嗎？此操作無法復原，雲端學習進度會一併刪除。')
    if (!confirmed) return
    setDeleting(true)
    try {
      const res = await fetch('/api/account', { method: 'DELETE' })
      if (!res.ok) throw new Error('delete account failed')
      await signOut()
    } catch (err) {
      console.error('delete account failed', err)
      alert('刪除帳號失敗，請稍後再試')
      setDeleting(false)
    }
  }

  const totalLevels = chapters.reduce((n, ch) => n + ch.levels.length, 0)
  const doneLevels = Object.keys(progress.completedLevels).length
  const streak = progress.streak?.count ?? 0
  const totalAnswered = Object.values(progress.dailyStats ?? {}).reduce((n, d) => n + d.total, 0)

  const stage = getStage(progress.xp)
  const nextStage = getNextStage(progress.xp)
  const xpProgress = nextStage
    ? Math.min(100, Math.round(((progress.xp - stage.min) / (nextStage.min - stage.min)) * 100))
    : 100

  if (!isLoaded) return null

  if (!isSignedIn) {
    return (
      <div className="screen login-screen">
        <div className="login-box">
          <Icon name="sprout" size={36} />
          <h2 className="page-title">登入 EasyLearn</h2>
          <p className="login-desc">登入後可在多裝置同步學習進度；未登入也能繼續刷題，進度先存在這台裝置。</p>
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
      <div className="profile-hero">
        <AccountHeader user={user} />

        <div className="hero-xp-row">
          <div className="hero-xp-icon">
            <Mascot xp={progress.xp} size="sm" />
          </div>
          <div className="hero-xp-info">
            <div className="hero-xp-top">
              <span className="hero-xp-name">{stage.name}</span>
              <span className="hero-xp-count">
                {nextStage ? `${progress.xp} / ${nextStage.min} XP` : `${progress.xp} XP・已達最終型態`}
              </span>
            </div>
            <div className="xp-bar hero-xp-bar">
              <div className="xp-bar-fill" style={{ width: `${xpProgress}%` }} />
            </div>
          </div>
          <button className="text-btn hero-xp-link" onClick={() => setShowGrowth((v) => !v)}>
            {showGrowth ? '收起 ‹' : '成長史 ›'}
          </button>
        </div>
      </div>
      {showGrowth && (
        <div className="growth-panel">
          <GrowthHistory xp={progress.xp} />
        </div>
      )}

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

      <h3 className="section-title">帳號設定</h3>
      <div className="account-list">
        <button className="account-list-item" onClick={() => signOut()}>
          <span>
            <Icon name="logout" size={15} />
            登出
          </span>
          <Icon className="account-list-chevron" name="chevron-right" size={16} />
        </button>
        <button
          className="account-list-item is-danger"
          onClick={handleDeleteAccount}
          disabled={deleting}
        >
          <span>
            <Icon name="trash" size={15} />
            {deleting ? '刪除中…' : '刪除帳號'}
          </span>
          <Icon className="account-list-chevron" name="chevron-right" size={16} />
        </button>
      </div>
    </div>
  )
}

export default Profile
