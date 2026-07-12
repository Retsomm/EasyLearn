import { getNextStage, getStage } from '@/lib/stages'

interface MascotProps {
  xp: number
  mood?: 'idle' | 'happy'
  size?: 'lg' | 'sm'
}

const Mascot = ({ xp, mood = 'idle', size = 'lg' }: MascotProps) => {
  const stage = getStage(xp)
  const next = getNextStage(xp)
  const progressToNext = next
    ? Math.min(100, Math.round(((xp - stage.min) / (next.min - stage.min)) * 100))
    : 100

  return (
    <div className={`mascot mascot-${size} mood-${mood}`}>
      <div className="mascot-emoji" role="img" aria-label={stage.name}>
        {stage.emoji}
      </div>
      {size === 'lg' && (
        <>
          <div className="mascot-name">{stage.name}</div>
          <div className="xp-bar">
            <div className="xp-bar-fill" style={{ width: `${progressToNext}%` }} />
          </div>
          <div className="mascot-hint">
            {next
              ? `${xp} XP・再 ${next.min - xp} XP 進化成 ${next.emoji}`
              : `${xp} XP・已達最終型態！`}
          </div>
        </>
      )}
    </div>
  )
}

export default Mascot
