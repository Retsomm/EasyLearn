import type { Question } from '@easylearn/core'

// 進關作答整個題池：洗牌後依難度由易到難排（同難度內順序隨機）
export const REVIEW_SIZE = 6
// 首頁「隨機綜合練習」跨章節抽題數
export const MIXED_SIZE = 10

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
