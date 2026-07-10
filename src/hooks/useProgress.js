import { useEffect, useState } from 'react'

const STORAGE_KEY = 'easylearn-progress-v1'

const defaultProgress = {
  xp: 0,
  // { [levelId]: { best: 答對題數, total: 題數 } }
  completedLevels: {},
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

export function useProgress() {
  const [progress, setProgress] = useState(load)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  }, [progress])

  function finishLevel(levelId, correct, total, xpEarned) {
    setProgress((p) => {
      const prev = p.completedLevels[levelId]
      return {
        ...p,
        xp: p.xp + xpEarned,
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

  return { progress, finishLevel, exportProgress, importProgress }
}
