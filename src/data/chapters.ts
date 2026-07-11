// 章節地圖：關卡順序即解鎖順序
import jsb1 from './questions/jsb-1-variables.json'
import jsb2 from './questions/jsb-2-functions.json'
import jsb3 from './questions/jsb-3-arrays.json'
import jsb4 from './questions/jsb-4-objects.json'
import jsb5 from './questions/jsb-5-control-flow.json'
import jsb6 from './questions/jsb-6-loops.json'
import jsb7 from './questions/jsb-7-numbers-dates.json'
import jsb8 from './questions/jsb-8-strings.json'
import jsb9 from './questions/jsb-9-regex.json'
import jsa1 from './questions/jsa-1-this-scope.json'
import jsa2 from './questions/jsa-2-closures.json'
import jsa3 from './questions/jsa-3-async-basics.json'
import jsa4 from './questions/jsa-4-async-await.json'
import jsa5 from './questions/jsa-5-classes.json'
import jsa6 from './questions/jsa-6-collections-json.json'
import jsa7 from './questions/jsa-7-modules.json'
import jsa8 from './questions/jsa-8-iterators-generators.json'
import jsa9 from './questions/jsa-9-promises-advanced.json'
import react1 from './questions/react-1-jsx.json'
import react2 from './questions/react-2-props.json'
import react3 from './questions/react-3-state-events.json'
import react4 from './questions/react-4-hooks.json'
import react5 from './questions/react-5-lists-conditional.json'
import react6 from './questions/react-6-updating-state.json'
import react7 from './questions/react-7-pure-components.json'
import react8 from './questions/react-8-sharing-state.json'
import react9 from './questions/react-9-preserving-state.json'
import react10 from './questions/react-10-reducer-context.json'
import react11 from './questions/react-11-refs.json'

export const chapters = [
  {
    id: 'js-basics',
    title: 'JavaScript 基礎',
    icon: 'sprout',
    levels: [jsb1, jsb2, jsb3, jsb4, jsb5, jsb6, jsb7, jsb8, jsb9],
  },
  {
    id: 'js-advanced',
    title: 'JavaScript 進階',
    icon: 'rocket',
    levels: [jsa1, jsa2, jsa3, jsa4, jsa5, jsa6, jsa7, jsa8, jsa9],
  },
  {
    id: 'react',
    title: 'React',
    icon: 'atom',
    levels: [react1, react2, react3, react4, react5, react6, react7, react8, react9, react10, react11],
  },
]

export function getLevel(levelId) {
  for (const ch of chapters) {
    const lv = ch.levels.find((l) => l.id === levelId)
    if (lv) return lv
  }
  return null
}

// 題目 id → 所屬章節 id（分科成效統計用）
const questionChapterMap = new Map()
for (const ch of chapters) {
  for (const level of ch.levels) {
    for (const q of level.questions) {
      questionChapterMap.set(q.id, ch.id)
    }
  }
}

export function getChapterIdForQuestion(questionId) {
  return questionChapterMap.get(questionId)
}

// 從錯題本 id 集合撈出題目本體（照章節順序）
export function getWrongQuestions(wrongIds) {
  const out = []
  for (const ch of chapters) {
    for (const level of ch.levels) {
      for (const q of level.questions) {
        if (wrongIds[q.id]) out.push(q)
      }
    }
  }
  return out
}

// 錯題本瀏覽用：題目本體＋熟練度資訊，最需要複習的（盒子小、越久沒複習）排前面
export function getWrongEntries(wrongIds) {
  const out = []
  for (const ch of chapters) {
    for (const level of ch.levels) {
      for (const q of level.questions) {
        const entry = wrongIds[q.id]
        if (entry) out.push({ question: q, ...entry })
      }
    }
  }
  return out.sort((a, b) => a.box - b.box || (a.lastWrong ?? '').localeCompare(b.lastWrong ?? ''))
}

// 從收藏 id 集合撈出題目本體（照章節順序）
export function getSavedQuestions(savedIds) {
  const out = []
  for (const ch of chapters) {
    for (const level of ch.levels) {
      for (const q of level.questions) {
        if (savedIds[q.id]) out.push(q)
      }
    }
  }
  return out
}
