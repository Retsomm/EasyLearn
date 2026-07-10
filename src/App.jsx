import { useState } from 'react'
import { useProgress } from './hooks/useProgress'
import { getLevel, getWrongQuestions } from './data/chapters'
import Home from './screens/Home'
import ChapterMap from './screens/ChapterMap'
import Quiz from './screens/Quiz'

const REVIEW_SIZE = 6

export default function App() {
  const { progress, answerQuestion, finishLevel, finishReview, exportProgress, importProgress } =
    useProgress()
  const [view, setView] = useState({ name: 'home' })

  function startReview() {
    // 抽最多 6 題錯題組成一輪重練（Fisher-Yates 洗牌，複本操作不動原順序）
    const pool = [...getWrongQuestions(progress.wrongIds)]
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[pool[i], pool[j]] = [pool[j], pool[i]]
    }
    const picked = pool.slice(0, REVIEW_SIZE)
    if (picked.length === 0) return
    setView({ name: 'review', questions: picked })
  }

  if (view.name === 'quiz') {
    const level = getLevel(view.levelId)
    return (
      <Quiz
        key={view.levelId}
        level={level}
        progress={progress}
        answerQuestion={answerQuestion}
        finishLevel={finishLevel}
        finishReview={finishReview}
        onExit={() => setView({ name: 'map' })}
      />
    )
  }

  if (view.name === 'review') {
    return (
      <Quiz
        key="review"
        level={{ id: '__review__', title: '錯題重練', questions: view.questions }}
        mode="review"
        progress={progress}
        answerQuestion={answerQuestion}
        finishLevel={finishLevel}
        finishReview={finishReview}
        onExit={() => setView({ name: 'home' })}
      />
    )
  }

  if (view.name === 'map') {
    return (
      <ChapterMap
        progress={progress}
        onStartLevel={(levelId) => setView({ name: 'quiz', levelId })}
        onBack={() => setView({ name: 'home' })}
      />
    )
  }

  return (
    <Home
      progress={progress}
      onStart={() => setView({ name: 'map' })}
      onReview={startReview}
      exportProgress={exportProgress}
      importProgress={importProgress}
    />
  )
}
