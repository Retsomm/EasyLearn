import type {
  ChapterStat as ChapterStatRow,
  CompletedLevel as CompletedLevelRow,
  DailyStat as DailyStatRow,
  SavedQuestion as SavedQuestionRow,
  User,
  WrongEntry as WrongEntryRow,
  XpLog as XpLogRow,
} from '@prisma/client'
import type { Progress, Streak } from '../types'

// Leitner 盒制：答對升級、答錯重置回 1，box 超過畢業盒才移出錯題本（跟 useProgress.ts 的規則一致）
export const GRADUATE_BOX = 3

// 純字串日期運算（不經過 Date 的時區轉換），'today'／'date' 一律由前端用使用者本地時區算好傳進來，
// 伺服器只用來跟前一天比較，不會自己重新推算「今天」——避免主機時區跟使用者裝置不一致造成 streak 誤判
export const addDaysToDateStr = (dateStr: string, delta: number): string => {
  const [y, m, d] = dateStr.split('-').map(Number)
  const utc = new Date(Date.UTC(y, m - 1, d))
  utc.setUTCDate(utc.getUTCDate() + delta)
  return utc.toISOString().slice(0, 10)
}

export const bumpStreakServer = (streak: Streak, today: string): Streak => {
  if (streak.last === today) return streak
  const yesterday = addDaysToDateStr(today, -1)
  return {
    count: streak.last === yesterday ? streak.count + 1 : 1,
    last: today,
  }
}

export const toProgress = (
  user: User,
  completedLevels: CompletedLevelRow[],
  wrongEntries: WrongEntryRow[],
  savedQuestions: SavedQuestionRow[],
  xpLogs: XpLogRow[],
  dailyStats: DailyStatRow[],
  chapterStats: ChapterStatRow[],
): Progress => ({
  xp: user.xp,
  completedLevels: Object.fromEntries(
    completedLevels.map((l) => [l.levelId, { best: l.best, total: l.total }]),
  ),
  wrongIds: Object.fromEntries(
    wrongEntries.map((w) => [w.questionId, { count: w.count, lastWrong: w.lastWrong, box: w.box }]),
  ),
  savedIds: Object.fromEntries(savedQuestions.map((s) => [s.questionId, true])),
  streak: { count: user.streakCount, last: user.streakLast },
  xpLog: Object.fromEntries(xpLogs.map((x) => [x.date, x.amount])),
  dailyStats: Object.fromEntries(dailyStats.map((d) => [d.date, { total: d.total, correct: d.correct }])),
  chapterStats: Object.fromEntries(chapterStats.map((c) => [c.chapterId, { total: c.total, correct: c.correct }])),
})
