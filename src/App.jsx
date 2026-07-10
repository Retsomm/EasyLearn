import { useState } from 'react'
import { useProgress } from './hooks/useProgress'
import { getLevel, getWrongQuestions } from './data/chapters'
import { shuffle, sampleQuestions, QUIZ_SIZE } from './utils/quiz'
import Home from './screens/Home'
import ChapterMap from './screens/ChapterMap'
import Quiz from './screens/Quiz'

const REVIEW_SIZE = QUIZ_SIZE

export default function App() {
  const { progress, answerQuestion, finishLevel, finishReview, exportProgress, importProgress } =
    useProgress()
  const [view, setView] = useState({ name: 'home' })

  function startLevel(levelId) {
    // 從關卡題池隨機抽題，重玩不重複
    const level = getLevel(levelId)
    setView({ name: 'quiz', levelId, questions: sampleQuestions(level.questions) })
  }

  function startReview() {
    const picked = shuffle(getWrongQuestions(progress.wrongIds)).slice(0, REVIEW_SIZE)
    if (picked.length === 0) return
    setView({ name: 'review', questions: picked })
  }

  if (view.name === 'quiz') {
    const level = getLevel(view.levelId)
    return (
      <Quiz
        key={view.levelId}
        level={{ ...level, questions: view.questions }}
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
        onStartLevel={startLevel}
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
