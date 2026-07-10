// 題池抽題：每次進關從關卡題池隨機抽 QUIZ_SIZE 題，依難度排序作答
export const QUIZ_SIZE = 6

export function shuffle(arr) {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function sampleQuestions(pool, n = QUIZ_SIZE) {
  const picked = shuffle(pool).slice(0, n)
  // 抽完照難度由易到難排，保住關卡內的坡度
  return picked.sort((a, b) => a.difficulty - b.difficulty)
}
