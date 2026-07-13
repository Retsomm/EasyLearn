import { STAGES, getStage } from '@easylearn/core'

interface GrowthHistoryProps {
  xp: number
}

const GrowthHistory = ({ xp }: GrowthHistoryProps) => {
  const current = getStage(xp)

  return (
    <ul className="growth-history">
      {STAGES.map((stage) => {
        const reached = xp >= stage.min
        const isCurrent = stage.name === current.name
        return (
          <li
            key={stage.name}
            className={`growth-history-item ${reached ? 'is-reached' : 'is-locked'} ${isCurrent ? 'is-current' : ''}`}
          >
            <span className="growth-history-emoji">{stage.emoji}</span>
            <div className="growth-history-info">
              <span className="growth-history-name">{stage.name}</span>
              <span className="growth-history-xp">
                {stage.min} XP{isCurrent ? '・目前' : ''}
              </span>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export default GrowthHistory
