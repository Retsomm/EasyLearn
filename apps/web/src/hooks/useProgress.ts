import { useEffect, useRef, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import {
  applyAnswer,
  bumpStreak,
  bumpXpLog,
  todayStr,
  type Progress,
  type WrongEntryMeta,
} from '@easylearn/core'

const STORAGE_KEY = 'easylearn-progress-v1'

const defaultProgress: Progress = {
  xp: 0,
  // { [levelId]: { best: 答對題數, total: 題數 } }
  completedLevels: {},
  // 錯題本：{ [questionId]: { count: 答錯次數, lastWrong: 'YYYY-MM-DD', box } }（box 是舊版 Leitner
  // 盒制留下的欄位，現在答對一次就直接移出錯題本，box 不再影響移出時機，維持型別/DB 相容）
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
): Record<string, WrongEntryMeta> =>
  Object.fromEntries(
    Object.entries(wrongIds ?? {}).map(([id, entry]) => [
      id,
      entry === true ? { count: 1, lastWrong: null, box: 1 } : entry,
    ]),
  )

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
  const prevIsSignedInRef = useRef(isSignedIn)

  // 掛載後立刻補讀一次本機 localStorage（不用等 Clerk 的 isLoaded），訪客模式才能馬上看到資料
  useEffect(() => {
    setProgress(load())
    setHydrated(true)
  }, [])

  // 訪客模式：跟以前一樣，任何 progress 變動都寫回 localStorage。
  // 用 hydrated 擋住「掛載當下那一輪」：那一輪 progress 還是初始的 defaultProgress，
  // 這裡如果沒擋，會搶在上面那個 effect 讀到真資料之前，先把 localStorage 洗成空的。
  // 另外用 prevIsSignedInRef 擋住「剛從已登入切成未登入」的那一輪：這個當下 progress state
  // 還是切換前的雲端資料（要等下面登出效果的 setProgress(load()) 才會變成訪客資料），
  // 如果這裡沒擋，會把切換前的舊雲端資料寫回 localStorage，蓋掉 resetLocalProgress 剛清空的內容，
  // 讓下面的登出效果讀回這份「復活」的舊資料——這正是刪除帳號後重新登入還會看到舊資料殘留的成因。
  useEffect(() => {
    if (!hydrated) return
    const justSignedOut = prevIsSignedInRef.current && !isSignedIn
    prevIsSignedInRef.current = isSignedIn
    if (!isSignedIn && !justSignedOut) localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
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
    ;(async () => {
      try {
        const res = await fetch('/api/progress')
        if (!res.ok) throw new Error(`progress fetch failed: ${res.status}`)
        const data = (await res.json()) as { progress: Progress; isNew: boolean }
        if (data.isNew) {
          setProgress(await postJson('/api/progress/migrate-local', load()))
        } else {
          setProgress(data.progress)
        }
        // 只有成功載入／搬遷完才標記完成；失敗的話留著讓下一次觸發還能重試
        migratedRef.current = true
      } catch (err) {
        console.error('progress load/migration failed', err)
      }
    })()
  }, [isLoaded, isSignedIn])

  // 每答一題就更新錯題本：答錯 → 記入／重置錯題紀錄；答對 → 這題若在錯題本裡就直接移出
  // 同時累計每日／分科作答統計，供學習數據頁使用
  const answerQuestion = (questionId: string, correct: boolean, chapterId?: string) => {
    setProgress((p) => applyAnswer(p, questionId, correct, chapterId))

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

  // 清除本機殘留進度：刪除帳號或使用者手動要求清除本機快取時呼叫。
  // localStorage 一律清除；但記憶體中的 progress state 只有訪客身分才重置——
  // 已登入使用者的 progress 是雲端資料的權威副本，清本機快取不代表雲端資料被清掉，
  // 畫面不該瞬間歸零。刪除帳號流程則交給呼叫端接著執行的 signOut()：
  // 之後 isSignedIn 變 false 的 effect 會重新讀（已清空的）localStorage，自然歸零。
  const resetLocalProgress = () => {
    localStorage.removeItem(STORAGE_KEY)
    if (!isSignedIn) setProgress(defaultProgress)
  }

  return {
    progress,
    answerQuestion,
    toggleSaved,
    finishLevel,
    finishReview,
    resetLocalProgress,
  }
}
