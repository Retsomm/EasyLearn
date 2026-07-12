import type { DailyStat, Progress, Streak, WrongEntryMeta } from './types'

// Leitner 盒制：答對升級、答錯重置回 1，box 超過畢業盒才移出錯題本
export const GRADUATE_BOX = 3

const toDateStr = (d: Date): string => d.toLocaleDateString('en-CA') // 本地時區的 YYYY-MM-DD

export const todayStr = (): string => toDateStr(new Date())

export const yesterdayStr = (): string => {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return toDateStr(d)
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
  // today／yesterday 從同一個 Date 實例算出，避免跨午夜時兩次各自 new Date() 算出不一致的日期
  const now = new Date()
  const today = toDateStr(now)
  if (streak.last === today) return streak
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  return {
    count: streak.last === toDateStr(yesterday) ? streak.count + 1 : 1,
    last: today,
  }
}

// 答題後更新 Leitner 錯題本＋每日／分科作答統計，web／mobile 的 useProgress 共用同一份規則：
// 答錯→記入或重置回第 1 盒；答對→有錯題紀錄才升一盒，超過畢業盒就移出錯題本
export const applyAnswer = (
  progress: Progress,
  questionId: string,
  correct: boolean,
  chapterId?: string,
): Progress => {
  const wrongIds = { ...progress.wrongIds }
  const entry = wrongIds[questionId]
  if (correct) {
    if (entry) {
      const box = entry.box + 1
      if (box > GRADUATE_BOX) delete wrongIds[questionId]
      else wrongIds[questionId] = { ...entry, box }
    }
  } else {
    const nextEntry: WrongEntryMeta = { count: (entry?.count ?? 0) + 1, lastWrong: todayStr(), box: 1 }
    wrongIds[questionId] = nextEntry
  }
  const dailyStats = bumpCounter(progress.dailyStats, todayStr(), correct)
  const chapterStats = chapterId ? bumpCounter(progress.chapterStats, chapterId, correct) : progress.chapterStats
  return { ...progress, wrongIds, dailyStats, chapterStats }
}
