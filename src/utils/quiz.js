// 進關作答整個題池：洗牌後依難度由易到難排（同難度內順序隨機）
export const REVIEW_SIZE = 6

export function shuffle(arr) {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function sampleQuestions(pool) {
  // sort 是穩定排序，洗牌後再排難度，同難度題目每次順序不同
  return shuffle(pool).sort((a, b) => a.difficulty - b.difficulty)
}
