import { useEffect, useRef, useState } from 'react'
import { useUser } from '@clerk/nextjs'
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

// 已登入時打的 API 都回傳伺服器組好的權威 Progress，直接拿來覆蓋樂觀更新的本地 state
const postJson = async (url: string, body: unknown): Promise<Progress> => {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = (await res.json()) as { progress: Progress }
  return data.progress
}

export const useProgress = () => {
  const { isSignedIn, isLoaded } = useUser()
  // 初始值固定用 defaultProgress（不能在這裡就呼叫 load()）：Next.js 會先在伺服器端 SSR 這個
  // 'use client' 元件一次，伺服器沒有 localStorage，會跟瀏覽器端讀到的真實資料兜不起來，
  // 造成 hydration mismatch。改成掛載後才用 effect 讀 localStorage，兩邊初始渲染才會一致。
  const [progress, setProgress] = useState(defaultProgress)
  const [hydrated, setHydrated] = useState(false)
  const migratedRef = useRef(false)

  // 掛載後立刻補讀一次本機 localStorage（不用等 Clerk 的 isLoaded），訪客模式才能馬上看到資料
  useEffect(() => {
    setProgress(load())
    setHydrated(true)
  }, [])

  // 訪客模式：跟以前一樣，任何 progress 變動都寫回 localStorage。
  // 用 hydrated 擋住「掛載當下那一輪」：那一輪 progress 還是初始的 defaultProgress，
  // 這裡如果沒擋，會搶在上面那個 effect 讀到真資料之前，先把 localStorage 洗成空的
  useEffect(() => {
    if (!hydrated) return
    if (!isSignedIn) localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  }, [progress, isSignedIn, hydrated])

  // 登入狀態切換：登入時去讀資料庫（第一次登入且資料庫是空的，就把訪客進度搬過去）；
  // 登出則換回讀本機 localStorage，恢復訪客模式
  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) {
      migratedRef.current = false
      setProgress(load())
      return
    }
    if (migratedRef.current) return
    migratedRef.current = true
    ;(async () => {
      const res = await fetch('/api/progress')
      const data = (await res.json()) as { progress: Progress; isNew: boolean }
      if (data.isNew) {
        setProgress(await postJson('/api/progress/migrate-local', load()))
      } else {
        setProgress(data.progress)
      }
    })()
  }, [isLoaded, isSignedIn])

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

    if (isSignedIn) {
      postJson('/api/progress/answer', { questionId, correct, chapterId, today: todayStr() })
        .then(setProgress)
        .catch((err) => console.error('answerQuestion sync failed', err))
    }
  }

  // 收藏／取消收藏題目
  const toggleSaved = (questionId: string) => {
    setProgress((p) => {
      const savedIds = { ...p.savedIds }
      if (savedIds[questionId]) delete savedIds[questionId]
      else savedIds[questionId] = true
      return { ...p, savedIds }
    })

    if (isSignedIn) {
      postJson('/api/progress/save-toggle', { questionId })
        .then(setProgress)
        .catch((err) => console.error('toggleSaved sync failed', err))
    }
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

    if (isSignedIn) {
      postJson('/api/progress/finish-level', { levelId, correct, total, xpEarned, today: todayStr() })
        .then(setProgress)
        .catch((err) => console.error('finishLevel sync failed', err))
    }
  }

  // 錯題重練結束：只加 XP 和 streak，不動關卡紀錄
  const finishReview = (xpEarned: number) => {
    setProgress((p) => ({
      ...p,
      xp: p.xp + xpEarned,
      streak: bumpStreak(p.streak),
      xpLog: bumpXpLog(p.xpLog, xpEarned),
    }))

    if (isSignedIn) {
      postJson('/api/progress/finish-review', { xpEarned, today: todayStr() })
        .then(setProgress)
        .catch((err) => console.error('finishReview sync failed', err))
    }
  }

  return {
    progress,
    answerQuestion,
    toggleSaved,
    finishLevel,
    finishReview,
  }
}
