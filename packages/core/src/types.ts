// 圖示名稱：web/mobile 各自的 Icons 元件都要實作這個聯集裡的每一個 key
// （用 `satisfies Record<IconName, ...>` 讓 TS 在漏刻某個圖示時直接報錯）
export type IconName =
  | 'arrow-left'
  | 'arrow-right'
  | 'x'
  | 'chevron-right'
  | 'lock'
  | 'check-circle'
  | 'play'
  | 'sprout'
  | 'rocket'
  | 'atom'
  | 'eye'
  | 'bug'
  | 'search'
  | 'pencil'
  | 'book-open'
  | 'lightbulb'
  | 'flag'
  | 'trophy'
  | 'flame'
  | 'rotate-ccw'
  | 'download'
  | 'star'
  | 'home'
  | 'clock'
  | 'bar-chart'
  | 'user'
  | 'shuffle'
  | 'logout'
  | 'trash'
  | 'smartphone'

export type QuestionType = 'predict-output' | 'find-bug' | 'same-or-not' | 'fill-in' | 'concept'

export interface QuestionOption {
  id: string
  text: string
  code?: string
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

// 純閱讀教材：跟 Chapter/Level 不同，沒有測驗題目，只有一段段完整的文字內容
// （不是條列重點），適合需要「從零開始讀懂」的官方文件翻譯內容
export interface ReadingSection {
  id: string
  title: string
  paragraphs: string[]
}

export interface ReadingChapter {
  id: string
  title: string
  icon: IconName
  sections: ReadingSection[]
}

// 主題：首頁卡片的顯示單位。大多數主題底下只有一個 Chapter（點卡片直接進關卡列表）；
// 少數主題（例如一套書拆成好幾本）底下有多個 Chapter，點卡片要先看到「書的列表」
export interface Topic {
  id: string
  title: string
  icon: IconName
  chapters: Chapter[]
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
  savedKeyPointIds: Record<string, boolean>
  streak: Streak
  xpLog: Record<string, number>
  dailyStats: Record<string, DailyStat>
  chapterStats: Record<string, DailyStat>
}
