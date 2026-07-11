import type { IconName } from './components/Icons'

export type QuestionType = 'predict-output' | 'find-bug' | 'same-or-not' | 'fill-in'

export interface QuestionOption {
  id: string
  text: string
}

export interface Question {
  id: string
  type: QuestionType
  difficulty: number
  topic: string
  docs: string
  story: string
  prompt: string
  code: string
  options: QuestionOption[]
  answer: string
  explanation: string
}

export interface Level {
  id: string
  title: string
  questions: Question[]
}

export interface Chapter {
  id: string
  title: string
  icon: IconName
  levels: Level[]
}

export interface LevelRecord {
  best: number
  total: number
}

export interface WrongEntryMeta {
  count: number
  lastWrong: string | null
  box: number
}

export interface WrongEntry extends WrongEntryMeta {
  question: Question
}

export interface DailyStat {
  total: number
  correct: number
}

export interface Streak {
  count: number
  last: string | null
}

export interface Progress {
  xp: number
  completedLevels: Record<string, LevelRecord>
  wrongIds: Record<string, WrongEntryMeta>
  savedIds: Record<string, boolean>
  streak: Streak
  xpLog: Record<string, number>
  dailyStats: Record<string, DailyStat>
  chapterStats: Record<string, DailyStat>
}
