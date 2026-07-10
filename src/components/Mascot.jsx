// 吉祥物「皮皮」：XP 累積推動 4 階段進化
export const STAGES = [
  { min: 0, emoji: '🥚', name: '神秘的蛋', hint: '答題可以幫牠孵化' },
  { min: 100, emoji: '🐣', name: '破殼的皮皮', hint: '牠睜開眼睛了！' },
  { min: 300, emoji: '🐤', name: '好奇的皮皮', hint: '牠開始到處啄程式碼' },
  { min: 700, emoji: '🦉', name: '智慧貓頭鷹皮皮', hint: '牠已經能看懂 PR 了' },
]

export function getStage(xp) {
  let stage = STAGES[0]
  for (const s of STAGES) if (xp >= s.min) stage = s
  return stage
}

export function getNextStage(xp) {
  return STAGES.find((s) => s.min > xp) ?? null
}

export default function Mascot({ xp, mood = 'idle', size = 'lg' }) {
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
