import { useEffect, useState } from 'react'

const STORAGE_KEY = 'easylearn-progress-v1'

const defaultProgress = {
  xp: 0,
  // { [levelId]: { best: 答對題數, total: 題數 } }
  completedLevels: {},
  // 錯題本：{ [questionId]: true }，答對即移除
  wrongIds: {},
  // 連續學習天數：{ count, last: 'YYYY-MM-DD' }
  streak: { count: 0, last: null },
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultProgress
    const data = JSON.parse(raw)
    return { ...defaultProgress, ...data }
  } catch {
    return defaultProgress
  }
}

function todayStr() {
  return new Date().toLocaleDateString('en-CA') // 本地時區的 YYYY-MM-DD
}

function yesterdayStr() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toLocaleDateString('en-CA')
}

function bumpStreak(streak) {
  const today = todayStr()
  if (streak.last === today) return streak
  return {
    count: streak.last === yesterdayStr() ? streak.count + 1 : 1,
    last: today,
  }
}

export function useProgress() {
  const [progress, setProgress] = useState(load)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  }, [progress])

  // 每答一題就更新錯題本：答錯記入、答對移除
  function answerQuestion(questionId, correct) {
    setProgress((p) => {
      const wrongIds = { ...p.wrongIds }
      if (correct) delete wrongIds[questionId]
      else wrongIds[questionId] = true
      return { ...p, wrongIds }
    })
  }

  function finishLevel(levelId, correct, total, xpEarned) {
    setProgress((p) => {
      const prev = p.completedLevels[levelId]
      return {
        ...p,
        xp: p.xp + xpEarned,
        streak: bumpStreak(p.streak),
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
  function finishReview(xpEarned) {
    setProgress((p) => ({
      ...p,
      xp: p.xp + xpEarned,
      streak: bumpStreak(p.streak),
    }))
  }

  function exportProgress() {
    const blob = new Blob([JSON.stringify(progress, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'easylearn-progress.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  function importProgress(file, onDone) {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result)
        if (typeof data.xp !== 'number' || typeof data.completedLevels !== 'object') {
          throw new Error('格式不對')
        }
        setProgress({ ...defaultProgress, ...data })
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
    finishLevel,
    finishReview,
    exportProgress,
    importProgress,
  }
}
