import type { DailyStat, Streak } from './types'

// Leitner 盒制：答對升級、答錯重置回 1，box 超過畢業盒才移出錯題本
export const GRADUATE_BOX = 3

export const todayStr = (): string => new Date().toLocaleDateString('en-CA') // 本地時區的 YYYY-MM-DD

export const yesterdayStr = (): string => {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toLocaleDateString('en-CA')
}

export const bumpXpLog = (xpLog: Record<string, number>, amount: number): Record<string, number> => {
  const today = todayStr()
  return { ...xpLog, [today]: (xpLog[today] ?? 0) + amount }
}

export const bumpCounter = (
  map: Record<string, DailyStat>,
  key: string,
  correct: boolean,
): Record<string, DailyStat> => {
  const entry = map[key] ?? { total: 0, correct: 0 }
  return {
    ...map,
    [key]: { total: entry.total + 1, correct: entry.correct + (correct ? 1 : 0) },
  }
}

export const bumpStreak = (streak: Streak): Streak => {
  const today = todayStr()
  if (streak.last === today) return streak
  return {
    count: streak.last === yesterdayStr() ? streak.count + 1 : 1,
    last: today,
  }
}
