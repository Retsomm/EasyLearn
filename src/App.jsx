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

// 決定目前畫面該讓 navbar 的哪個分頁保持高亮
function navGroupOf(viewName) {
  if (viewName === 'stats') return 'stats'
  if (viewName === 'profile') return 'profile'
  if (['notes', 'review', 'wrongbook', 'savedbook', 'savedpractice'].includes(viewName)) return 'notes'
  return 'home'
}

export default function App() {
  const {
    progress,
    answerQuestion,
    toggleSaved,
    finishLevel,
    finishReview,
    exportProgress,
    importProgress,
  } = useProgress()
  const [view, setView] = useState({ name: 'home' })

  function startLevel(levelId) {
    // 整個題池隨機排序作答（同難度內順序每次不同）
    const level = getLevel(levelId)
    setView({ name: 'quiz', levelId, questions: sampleQuestions(level.questions) })
  }

  function startReview() {
    const picked = shuffle(getWrongQuestions(progress.wrongIds)).slice(0, REVIEW_SIZE)
    if (picked.length === 0) return
    setView({ name: 'review', questions: picked })
  }

  function startMixedPractice() {
    const pool = chapters.flatMap((ch) => ch.levels.flatMap((l) => l.questions))
    const picked = shuffle(pool).slice(0, MIXED_SIZE).sort((a, b) => a.difficulty - b.difficulty)
    setView({ name: 'mixed', questions: picked })
  }

  function startSavedPractice() {
    const picked = sampleQuestions(getSavedQuestions(progress.savedIds))
    if (picked.length === 0) return
    setView({ name: 'savedpractice', questions: picked })
  }

  function handleNavigate(key) {
    setView({ name: key })
  }

  let content = null

  if (view.name === 'quiz') {
    const level = getLevel(view.levelId)
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
    content = <Profile progress={progress} exportProgress={exportProgress} importProgress={importProgress} />
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

function navGroupOfChapter(levelId) {
  for (const ch of chapters) {
    if (ch.levels.some((l) => l.id === levelId)) return ch.id
  }
  return null
}
