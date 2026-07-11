import { useEffect, useState } from 'react'
import type { DailyStat, Progress, Streak, WrongEntryMeta } from '../types'

const STORAGE_KEY = 'easylearn-progress-v1'

// Leitner 盒制：答對升級、答錯重置回 1，box 超過畢業盒才移出錯題本
export const GRADUATE_BOX = 3

const defaultProgress: Progress = {
  xp: 0,
  // { [levelId]: { best: 答對題數, total: 題數 } }
  completedLevels: {},
  // 錯題本：{ [questionId]: { count: 答錯次數, lastWrong: 'YYYY-MM-DD', box: 熟練度 1~GRADUATE_BOX } }
  wrongIds: {},
  // 收藏題目：{ [questionId]: true }
  savedIds: {},
  // 連續學習天數：{ count, last: 'YYYY-MM-DD' }
  streak: { count: 0, last: null },
  // 每日 XP 紀錄：{ [YYYY-MM-DD]: 當日累計 XP }
  xpLog: {},
  // 每日作答統計：{ [YYYY-MM-DD]: { total, correct } }
  dailyStats: {},
  // 分科作答統計：{ [chapterId]: { total, correct } }
  chapterStats: {},
}

// 舊版 wrongIds 是 { [id]: true }，升級成 Leitner 盒物件
const migrateWrongIds = (
  wrongIds: Record<string, true | WrongEntryMeta> | undefined,
): Record<string, WrongEntryMeta> => {
  const out: Record<string, WrongEntryMeta> = {}
  for (const [id, entry] of Object.entries(wrongIds ?? {})) {
    out[id] = entry === true ? { count: 1, lastWrong: null, box: 1 } : entry
  }
  return out
}

const load = (): Progress => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultProgress
    const data = JSON.parse(raw)
    return { ...defaultProgress, ...data, wrongIds: migrateWrongIds(data.wrongIds) }
  } catch {
    return defaultProgress
  }
}

export const todayStr = (): string => new Date().toLocaleDateString('en-CA') // 本地時區的 YYYY-MM-DD

export const yesterdayStr = (): string => {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toLocaleDateString('en-CA')
}

const bumpXpLog = (xpLog: Record<string, number>, amount: number): Record<string, number> => {
  const today = todayStr()
  return { ...xpLog, [today]: (xpLog[today] ?? 0) + amount }
}

const bumpCounter = (
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

const bumpStreak = (streak: Streak): Streak => {
  const today = todayStr()
  if (streak.last === today) return streak
  return {
    count: streak.last === yesterdayStr() ? streak.count + 1 : 1,
    last: today,
  }
}

export const useProgress = () => {
  const [progress, setProgress] = useState(load)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  }, [progress])

  // 每答一題就更新錯題本（Leitner 盒制）：
  // 答錯 → 記入／重置回第 1 盒；答對 → 升一盒，超過畢業盒才移出錯題本
  // 同時累計每日／分科作答統計，供學習數據頁使用
  const answerQuestion = (questionId: string, correct: boolean, chapterId?: string) => {
    setProgress((p) => {
      const wrongIds = { ...p.wrongIds }
      const entry = wrongIds[questionId]
      if (correct) {
        if (entry) {
          const box = entry.box + 1
          if (box > GRADUATE_BOX) delete wrongIds[questionId]
          else wrongIds[questionId] = { ...entry, box }
        }
      } else {
        wrongIds[questionId] = {
          count: (entry?.count ?? 0) + 1,
          lastWrong: todayStr(),
          box: 1,
        }
      }
      const dailyStats = bumpCounter(p.dailyStats, todayStr(), correct)
      const chapterStats = chapterId ? bumpCounter(p.chapterStats, chapterId, correct) : p.chapterStats
      return { ...p, wrongIds, dailyStats, chapterStats }
    })
  }

  // 收藏／取消收藏題目
  const toggleSaved = (questionId: string) => {
    setProgress((p) => {
      const savedIds = { ...p.savedIds }
      if (savedIds[questionId]) delete savedIds[questionId]
      else savedIds[questionId] = true
      return { ...p, savedIds }
    })
  }

  const finishLevel = (levelId: string, correct: number, total: number, xpEarned: number) => {
    setProgress((p) => {
      const prev = p.completedLevels[levelId]
      return {
        ...p,
        xp: p.xp + xpEarned,
        streak: bumpStreak(p.streak),
        xpLog: bumpXpLog(p.xpLog, xpEarned),
        completedLevels: {
          ...p.completedLevels,
          [levelId]: {
            best: Math.max(prev?.best ?? 0, correct),
            total,
          },
        },
      }
    })
  }

  // 錯題重練結束：只加 XP 和 streak，不動關卡紀錄
  const finishReview = (xpEarned: number) => {
    setProgress((p) => ({
      ...p,
      xp: p.xp + xpEarned,
      streak: bumpStreak(p.streak),
      xpLog: bumpXpLog(p.xpLog, xpEarned),
    }))
  }

  const exportProgress = () => {
    const blob = new Blob([JSON.stringify(progress, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'easylearn-progress.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const importProgress = (file: File, onDone?: (ok: boolean) => void) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string)
        if (typeof data.xp !== 'number' || typeof data.completedLevels !== 'object') {
          throw new Error('格式不對')
        }
        setProgress({ ...defaultProgress, ...data, wrongIds: migrateWrongIds(data.wrongIds) })
        onDone?.(true)
      } catch {
        onDone?.(false)
      }
    }
    reader.readAsText(file)
  }

  return {
    progress,
    answerQuestion,
    toggleSaved,
    finishLevel,
    finishReview,
    exportProgress,
    importProgress,
  }
}
