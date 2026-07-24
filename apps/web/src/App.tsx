import { useState } from 'react'
import { useProgress } from '@/hooks/useProgress'
import {
  getLevel,
  getWrongQuestions,
  getWrongEntries,
  getSavedQuestions,
  chapters,
  sampleQuestions,
  sampleFixedQuestions,
  REVIEW_SIZE,
  MIXED_SIZE,
  LEVEL_SIZE,
} from '@easylearn/core'
import Navbar from '@/components/Navbar'
import Home from '@/screens/Home'
import Notes from '@/screens/Notes'
import Stats from '@/screens/Stats'
import Profile from '@/screens/Profile'
import ChapterMap from '@/screens/ChapterMap'
import Quiz from '@/screens/Quiz'
import QuestionBook from '@/screens/QuestionBook'
import type { Question } from '@easylearn/core'

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

const navGroupOfChapter = (levelId: string): string | null =>
  chapters.find((ch) => ch.levels.some((l) => l.id === levelId))?.id ?? null

const App = () => {
  const { progress, answerQuestion, toggleSaved, finishLevel, finishReview, resetLocalProgress } =
    useProgress()
  const [view, setView] = useState<View>({ name: 'home' })

  const startLevel = (levelId: string) => {
    // 固定抽 LEVEL_SIZE 題作答，題池不足就整包抽完（同難度內順序每次不同）
    const level = getLevel(levelId)
    if (!level) return
    setView({ name: 'quiz', levelId, questions: sampleFixedQuestions(level.questions, LEVEL_SIZE) })
  }

  const startReview = () => {
    const picked = sampleFixedQuestions(getWrongQuestions(progress.wrongIds), REVIEW_SIZE)
    if (picked.length === 0) return
    setView({ name: 'review', questions: picked })
  }

  const startMixedPractice = () => {
    const pool = chapters.flatMap((ch) => ch.levels.flatMap((l) => l.questions))
    const picked = sampleFixedQuestions(pool, MIXED_SIZE)
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

  // 'quiz' 畫面若拿不到關卡資料（例如 levelId 失效），整頁（含 Navbar）都不渲染，
  // 提前算出來讓下面的 switch 維持「每個分支都回傳同一抽象層次的畫面元件」
  const quizLevel = view.name === 'quiz' ? getLevel(view.levelId) : null
  if (view.name === 'quiz' && !quizLevel) return null

  const content = (() => {
    switch (view.name) {
      case 'quiz':
        return (
          <Quiz
            key={view.levelId}
            level={{ ...quizLevel!, questions: view.questions }}
            progress={progress}
            answerQuestion={answerQuestion}
            toggleSaved={toggleSaved}
            finishLevel={finishLevel}
            finishReview={finishReview}
            onExit={() => setView({ name: 'levellist', chapterId: navGroupOfChapter(quizLevel!.id) })}
            exitTo="levellist"
          />
        )
      case 'review':
        return (
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
      case 'mixed':
        return (
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
      case 'savedpractice':
        return (
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
      case 'wrongbook':
        return (
          <QuestionBook
            kind="wrong"
            entries={getWrongEntries(progress.wrongIds)}
            savedIds={progress.savedIds}
            onToggleSave={toggleSaved}
            onBack={() => setView({ name: 'notes' })}
            onReview={startReview}
          />
        )
      case 'savedbook':
        return (
          <QuestionBook
            kind="saved"
            entries={getSavedQuestions(progress.savedIds)}
            savedIds={progress.savedIds}
            onToggleSave={toggleSaved}
            onBack={() => setView({ name: 'notes' })}
          />
        )
      case 'levellist':
        return (
          <ChapterMap
            chapterId={view.chapterId}
            progress={progress}
            onStartLevel={startLevel}
            onBack={() => setView({ name: 'home' })}
          />
        )
      case 'notes':
        return (
          <Notes
            progress={progress}
            onOpenWrongBook={() => setView({ name: 'wrongbook' })}
            onOpenSavedBook={() => setView({ name: 'savedbook' })}
            onReview={startReview}
            onPracticeSaved={startSavedPractice}
          />
        )
      case 'stats':
        return <Stats progress={progress} />
      case 'profile':
        return <Profile progress={progress} onClearLocalData={resetLocalProgress} />
      default:
        return (
          <Home
            progress={progress}
            onOpenChapter={(chapterId) => setView({ name: 'levellist', chapterId })}
            onMixedPractice={startMixedPractice}
          />
        )
    }
  })()

  return (
    <>
      <Navbar active={navGroupOf(view.name)} onNavigate={handleNavigate} />
      <div id="page-body">{content}</div>
    </>
  )
}

export default App
