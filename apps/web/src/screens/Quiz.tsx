import { useState } from 'react'
import QuestionCard from '../components/QuestionCard'
import Mascot, { getStage } from '../components/Mascot'
import Icon from '../components/Icons'
import { getChapterIdForQuestion } from '../data/chapters'
import type { Level, Progress } from '@easylearn/core'

const XP_CORRECT = 10
const XP_WRONG = 2
const XP_FIRST_CLEAR_BONUS = 20

interface QuizProps {
  level: Level
  mode?: 'normal' | 'review' | 'mixed'
  progress: Progress
  answerQuestion: (questionId: string, correct: boolean, chapterId?: string) => void
  toggleSaved: (questionId: string) => void
  finishLevel: (levelId: string, correct: number, total: number, xpEarned: number) => void
  finishReview: (xpEarned: number) => void
  onExit: () => void
  exitTo?: string
}

const Quiz = ({
  level,
  mode = 'normal',
  progress,
  answerQuestion,
  toggleSaved,
  finishLevel,
  finishReview,
  onExit,
  exitTo = 'levellist',
}: QuizProps) => {
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [xpEarned, setXpEarned] = useState(0)
  const [done, setDone] = useState(false)
  const [finalXp, setFinalXp] = useState(0)

  const isReview = mode === 'review'
  const isMixed = mode === 'mixed'
  const skipsLevelProgress = isReview || isMixed
  const questions = level.questions
  const question = questions[index]
  const firstClear = !skipsLevelProgress && !progress.completedLevels[level.id]

  const handleSelect = (optId: string) => {
    setSelected(optId)
    const isCorrect = optId === question.answer
    answerQuestion(question.id, isCorrect, getChapterIdForQuestion(question.id))
    if (isCorrect) setCorrectCount((c) => c + 1)
    setXpEarned((x) => x + (isCorrect ? XP_CORRECT : XP_WRONG))
  }

  const handleNext = () => {
    if (index + 1 < questions.length) {
      setIndex(index + 1)
      setSelected(null)
    } else {
      const bonus = firstClear ? XP_FIRST_CLEAR_BONUS : 0
      const total = xpEarned + bonus
      if (skipsLevelProgress) {
        finishReview(total)
      } else {
        finishLevel(level.id, correctCount, questions.length, total)
      }
      setFinalXp(total)
      setDone(true)
    }
  }

  if (done) {
    const perfect = correctCount === questions.length
    return (
      <div className="screen result-screen">
        <Mascot xp={progress.xp} mood="happy" />
        <h2 className="result-title">
          {perfect && <Icon name="trophy" size={24} />}
          {isReview ? '重練完成！' : isMixed ? '練習完成！' : perfect ? '全對！太神了' : '關卡完成！'}
        </h2>
        <div className="result-stats">
          <div className="stat-row">
            <span>答對題數</span>
            <strong>
              {correctCount} / {questions.length}
            </strong>
          </div>
          <div className="stat-row">
            <span>獲得 XP</span>
            <strong>+{finalXp}{firstClear ? '（含首次通關 +20）' : ''}</strong>
          </div>
          {isReview && (
            <div className="stat-row">
              <span>畢業的錯題</span>
              <strong>{questions.filter((q) => !progress.wrongIds[q.id]).length} 題</strong>
            </div>
          )}
        </div>
        <p className="result-hint">
          {isReview && questions.some((q) => progress.wrongIds[q.id])
            ? '還沒畢業的錯題會留著，繼續練會更熟練！'
            : '你的星球又長大了一點，明天也要回來澆灌它喔！'}
        </p>
        <button className="primary-btn" onClick={onExit}>
          {exitTo === 'home' ? '回首頁' : exitTo === 'notes' ? '返回筆記' : '返回關卡地圖'}
        </button>
      </div>
    )
  }

  return (
    <div className="screen quiz-screen">
      <div className="quiz-header">
        <button className="back-btn" onClick={onExit} aria-label="離開關卡">
          <Icon name="x" size={20} />
        </button>
        <div className="progress-dots">
          {questions.map((q, i) => (
            <span
              key={q.id}
              className={`dot ${i < index ? 'dot-done' : ''} ${i === index ? 'dot-current' : ''}`}
            />
          ))}
        </div>
        <span
          key={`${index}-${selected ?? 'waiting'}`}
          className={`quiz-pet ${
            selected === null ? '' : selected === question.answer ? 'pet-happy' : 'pet-sad'
          }`}
          role="img"
          aria-label={getStage(progress.xp).name}
        >
          {getStage(progress.xp).emoji}
        </span>
        <span className="quiz-counter">
          {index + 1}/{questions.length}
        </span>
      </div>
      {isReview && (
        <div className="review-banner">
          <Icon name="rotate-ccw" size={15} />
          錯題重練模式：答對升熟練度，答錯重來，練到最高熟練度才畢業
        </div>
      )}
      {isMixed && (
        <div className="review-banner">
          <Icon name="shuffle" size={15} />
          隨機綜合練習：跨章節抽題，不影響關卡進度
        </div>
      )}
      <QuestionCard
        question={question}
        selected={selected}
        onSelect={handleSelect}
        onNext={handleNext}
        isLast={index + 1 === questions.length}
        saved={!!progress.savedIds[question.id]}
        onToggleSave={toggleSaved}
      />
    </div>
  )
}

export default Quiz
