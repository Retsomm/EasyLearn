import { useState } from 'react'
import QuestionCard from '../components/QuestionCard'
import Mascot from '../components/Mascot'
import Icon from '../components/Icons'

const XP_CORRECT = 10
const XP_WRONG = 2
const XP_FIRST_CLEAR_BONUS = 20

export default function Quiz({ level, progress, finishLevel, onExit }) {
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [xpEarned, setXpEarned] = useState(0)
  const [done, setDone] = useState(false)
  const [finalXp, setFinalXp] = useState(0)

  const questions = level.questions
  const question = questions[index]
  const firstClear = !progress.completedLevels[level.id]

  function handleSelect(optId) {
    setSelected(optId)
    const isCorrect = optId === question.answer
    if (isCorrect) setCorrectCount((c) => c + 1)
    setXpEarned((x) => x + (isCorrect ? XP_CORRECT : XP_WRONG))
  }

  function handleNext() {
    if (index + 1 < questions.length) {
      setIndex(index + 1)
      setSelected(null)
    } else {
      const bonus = firstClear ? XP_FIRST_CLEAR_BONUS : 0
      const total = xpEarned + bonus
      finishLevel(level.id, correctCount, questions.length, total)
      setFinalXp(total)
      setDone(true)
    }
  }

  if (done) {
    const perfect = correctCount === questions.length
    return (
      <div className="screen result-screen">
        <Mascot xp={progress.xp + finalXp} mood="happy" />
        <h2 className="result-title">
          {perfect && <Icon name="trophy" size={24} />}
          {perfect ? '全對！太神了' : '關卡完成！'}
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
        </div>
        <p className="result-hint">皮皮吃飽了，明天也要來餵牠喔！</p>
        <button className="primary-btn" onClick={onExit}>
          返回關卡地圖
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
        <span className="quiz-counter">
          {index + 1}/{questions.length}
        </span>
      </div>
      <QuestionCard
        question={question}
        selected={selected}
        onSelect={handleSelect}
        onNext={handleNext}
        isLast={index + 1 === questions.length}
      />
    </div>
  )
}
