import { useState } from 'react'
import { useProgress } from './hooks/useProgress'
import { getLevel } from './data/chapters'
import Home from './screens/Home'
import ChapterMap from './screens/ChapterMap'
import Quiz from './screens/Quiz'

export default function App() {
  const { progress, finishLevel, exportProgress, importProgress } = useProgress()
  const [view, setView] = useState({ name: 'home' })

  if (view.name === 'quiz') {
    const level = getLevel(view.levelId)
    return (
      <Quiz
        key={view.levelId}
        level={level}
        progress={progress}
        finishLevel={finishLevel}
        onExit={() => setView({ name: 'map' })}
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
      exportProgress={exportProgress}
      importProgress={importProgress}
    />
  )
}
