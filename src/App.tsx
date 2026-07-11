import { useState } from 'react'
import { useProgress } from './hooks/useProgress'
import { getLevel, getWrongQuestions, getWrongEntries, getSavedQuestions, chapters } from './data/chapters'
import { shuffle, sampleQuestions, REVIEW_SIZE, MIXED_SIZE } from './utils/quiz'
import Navbar from './components/Navbar'
import Home from './screens/Home'
import Notes from './screens/Notes'
import Stats from './screens/Stats'
import Profile from './screens/Profile'
import ChapterMap from './screens/ChapterMap'
import Quiz from './screens/Quiz'
import QuestionBook from './screens/QuestionBook'
import type { Question } from './types'

type View =
  | { name: 'home' }
  | { name: 'notes' }
  | { name: 'stats' }
  | { name: 'profile' }
  | { name: 'wrongbook' }
  | { name: 'savedbook' }
  | { name: 'levellist'; chapterId: string | null }
  | { name: 'quiz'; levelId: string; questions: Question[] }
  | { name: 'review'; questions: Question[] }
  | { name: 'mixed'; questions: Question[] }
  | { name: 'savedpractice'; questions: Question[] }

// 決定目前畫面該讓 navbar 的哪個分頁保持高亮
const navGroupOf = (viewName: View['name']): string => {
  if (viewName === 'stats') return 'stats'
  if (viewName === 'profile') return 'profile'
  if (['notes', 'review', 'wrongbook', 'savedbook', 'savedpractice'].includes(viewName)) return 'notes'
  return 'home'
}

const navGroupOfChapter = (levelId: string): string | null => {
  for (const ch of chapters) {
    if (ch.levels.some((l) => l.id === levelId)) return ch.id
  }
  return null
}

const App = () => {
  const { progress, answerQuestion, toggleSaved, finishLevel, finishReview } = useProgress()
  const [view, setView] = useState<View>({ name: 'home' })

  const startLevel = (levelId: string) => {
    // 整個題池隨機排序作答（同難度內順序每次不同）
    const level = getLevel(levelId)
    if (!level) return
    setView({ name: 'quiz', levelId, questions: sampleQuestions(level.questions) })
  }

  const startReview = () => {
    const picked = shuffle(getWrongQuestions(progress.wrongIds)).slice(0, REVIEW_SIZE)
    if (picked.length === 0) return
    setView({ name: 'review', questions: picked })
  }

  const startMixedPractice = () => {
    const pool = chapters.flatMap((ch) => ch.levels.flatMap((l) => l.questions))
    const picked = shuffle(pool).slice(0, MIXED_SIZE).sort((a, b) => a.difficulty - b.difficulty)
    setView({ name: 'mixed', questions: picked })
  }

  const startSavedPractice = () => {
    const picked = sampleQuestions(getSavedQuestions(progress.savedIds))
    if (picked.length === 0) return
    setView({ name: 'savedpractice', questions: picked })
  }

  const handleNavigate = (key: string) => {
    setView({ name: key } as View)
  }

  let content = null

  if (view.name === 'quiz') {
    const level = getLevel(view.levelId)
    if (!level) return null
    content = (
      <Quiz
        key={view.levelId}
        level={{ ...level, questions: view.questions }}
        progress={progress}
        answerQuestion={answerQuestion}
        toggleSaved={toggleSaved}
        finishLevel={finishLevel}
        finishReview={finishReview}
        onExit={() => setView({ name: 'levellist', chapterId: navGroupOfChapter(level.id) })}
        exitTo="levellist"
      />
    )
  } else if (view.name === 'review') {
    content = (
      <Quiz
        key="review"
        level={{ id: '__review__', title: '錯題重練', questions: view.questions }}
        mode="review"
        progress={progress}
        answerQuestion={answerQuestion}
        toggleSaved={toggleSaved}
        finishLevel={finishLevel}
        finishReview={finishReview}
        onExit={() => setView({ name: 'notes' })}
        exitTo="notes"
      />
    )
  } else if (view.name === 'mixed') {
    content = (
      <Quiz
        key="mixed"
        level={{ id: '__mixed__', title: '隨機綜合練習', questions: view.questions }}
        mode="mixed"
        progress={progress}
        answerQuestion={answerQuestion}
        toggleSaved={toggleSaved}
        finishLevel={finishLevel}
        finishReview={finishReview}
        onExit={() => setView({ name: 'home' })}
        exitTo="home"
      />
    )
  } else if (view.name === 'savedpractice') {
    content = (
      <Quiz
        key="savedpractice"
        level={{ id: '__saved__', title: '收藏題庫練習', questions: view.questions }}
        mode="mixed"
        progress={progress}
        answerQuestion={answerQuestion}
        toggleSaved={toggleSaved}
        finishLevel={finishLevel}
        finishReview={finishReview}
        onExit={() => setView({ name: 'notes' })}
        exitTo="notes"
      />
    )
  } else if (view.name === 'wrongbook') {
    content = (
      <QuestionBook
        kind="wrong"
        entries={getWrongEntries(progress.wrongIds)}
        savedIds={progress.savedIds}
        onToggleSave={toggleSaved}
        onBack={() => setView({ name: 'notes' })}
        onReview={startReview}
      />
    )
  } else if (view.name === 'savedbook') {
    content = (
      <QuestionBook
        kind="saved"
        entries={getSavedQuestions(progress.savedIds)}
        savedIds={progress.savedIds}
        onToggleSave={toggleSaved}
        onBack={() => setView({ name: 'notes' })}
      />
    )
  } else if (view.name === 'levellist') {
    content = (
      <ChapterMap
        chapterId={view.chapterId}
        progress={progress}
        onStartLevel={startLevel}
        onBack={() => setView({ name: 'home' })}
      />
    )
  } else if (view.name === 'notes') {
    content = (
      <Notes
        progress={progress}
        onOpenWrongBook={() => setView({ name: 'wrongbook' })}
        onOpenSavedBook={() => setView({ name: 'savedbook' })}
        onReview={startReview}
        onPracticeSaved={startSavedPractice}
      />
    )
  } else if (view.name === 'stats') {
    content = <Stats progress={progress} />
  } else if (view.name === 'profile') {
    content = <Profile progress={progress} />
  } else {
    content = (
      <Home
        progress={progress}
        onOpenChapter={(chapterId) => setView({ name: 'levellist', chapterId })}
        onMixedPractice={startMixedPractice}
      />
    )
  }

  return (
    <>
      <Navbar active={navGroupOf(view.name)} onNavigate={handleNavigate} />
      <div id="page-body">{content}</div>
    </>
  )
}

export default App
