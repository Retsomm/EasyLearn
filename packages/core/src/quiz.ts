import type { Question } from './types'

// 錯題重練跨關卡抽題數
export const REVIEW_SIZE = 6
// 首頁「隨機綜合練習」跨章節抽題數
export const MIXED_SIZE = 10
// 單一關卡每次作答的固定題數：關卡題庫大小不一（5~12 題不等），
// 固定抽樣讓每次刷題的時間可預期，不會因為關卡不同而忽長忽短
export const LEVEL_SIZE = 6

export const shuffle = <T>(arr: T[]): T[] => {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export const sampleQuestions = (pool: Question[]): Question[] =>
  // sort 是穩定排序，洗牌後再排難度，同難度題目每次順序不同
  shuffle(pool).sort((a, b) => a.difficulty - b.difficulty)

// 從題池洗牌後抽出固定數量（題池小於 size 就整包抽完），再依難度排序
export const sampleFixedQuestions = (pool: Question[], size: number): Question[] =>
  shuffle(pool).slice(0, size).sort((a, b) => a.difficulty - b.difficulty)
