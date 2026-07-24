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
import fp1 from './questions/fp-1-welcome.json'
import fp2 from './questions/fp-2-overview.json'
import fp3 from './questions/fp-3-actions-calculations-data.json'
import fp4 from './questions/fp-4-extract-calculations.json'
import fp5 from './questions/fp-5-improve-actions.json'
import fp6 from './questions/fp-6-copy-on-write.json'
import fp7 from './questions/fp-7-defensive-copying.json'
import fp8 from './questions/fp-8-stratified-design-1.json'
import fp9 from './questions/fp-9-stratified-design-2.json'
import fp10 from './questions/fp-10-first-class-functions-1.json'
import fp11 from './questions/fp-11-first-class-functions-2.json'
import fp12 from './questions/fp-12-array-tools.json'
import fp13 from './questions/fp-13-chaining.json'
import fp14 from './questions/fp-14-nested-data.json'
import fp15 from './questions/fp-15-timeline-diagrams.json'
import fp16 from './questions/fp-16-sharing-resources.json'
import fp17 from './questions/fp-17-coordinating-timelines.json'
import fp18 from './questions/fp-18-reactive-onion.json'
import fp19 from './questions/fp-19-road-ahead.json'
import ri1 from './questions/ri-1-router.json'
import ri2 from './questions/ri-2-i18n.json'
import ri3 from './questions/ri-3-testing.json'
import ri4 from './questions/ri-4-redux.json'
import ri5 from './questions/ri-5-native.json'
import ri6 from './questions/ri-6-ecosystem.json'
import ri7 from './questions/ri-7-misc.json'
import ri8 from './questions/ri-8-modern.json'
import ri9 from './questions/ri-9-core-basics.json'
import ri10 from './questions/ri-10-core-props-events.json'
import ri11 from './questions/ri-11-core-vdom.json'
import ri12 from './questions/ri-12-core-hoc-composition.json'
import ri13 from './questions/ri-13-core-ecosystem-position.json'
import ri14 from './questions/ri-14-core-rendering-patterns.json'
import ri15 from './questions/ri-15-core-jsx-details.json'
import ri16 from './questions/ri-16-core-styling-tools.json'
import ri17 from './questions/ri-17-core-project-conventions.json'
import ri18 from './questions/ri-18-misc-early.json'
import ri19 from './questions/ri-19-misc-hooks-foundations.json'
import ri20 from './questions/ri-20-misc-rendering-internals.json'
import ri21 from './questions/ri-21-misc-reducer-context-deep.json'
import ri22 from './questions/ri-22-misc-useeffect-deep.json'
import ri23 from './questions/ri-23-misc-layouteffect-ref-imperative.json'
import ri24 from './questions/ri-24-misc-memo-callback-custom-hooks.json'
import ri25 from './questions/ri-25-misc-advanced-hooks.json'
import ri26 from './questions/ri-26-misc-code-splitting-perf.json'
import ri27 from './questions/ri-27-misc-error-boundaries.json'
import ri28 from './questions/ri-28-misc-component-conventions.json'
import ri29 from './questions/ri-29-misc-forms-composition.json'
import ri30 from './questions/ri-30-misc-state-alternatives-internals.json'
import type { Chapter, Level, Question, WrongEntry, WrongEntryMeta } from '../types'

// 題目 JSON 的 type 欄位在匯入時只會被推斷成 string，用 as 收斂回字面量聯合型別
const asLevel = (level: unknown) => level as Level

export const chapters: Chapter[] = [
  {
    id: 'js-basics',
    title: 'JavaScript 基礎',
    icon: 'sprout',
    levels: [jsb1, jsb2, jsb3, jsb4, jsb5, jsb6, jsb7, jsb8, jsb9].map(asLevel),
  },
  {
    id: 'js-advanced',
    title: 'JavaScript 進階',
    icon: 'rocket',
    levels: [jsa1, jsa2, jsa3, jsa4, jsa5, jsa6, jsa7, jsa8, jsa9].map(asLevel),
  },
  {
    id: 'react',
    title: 'React',
    icon: 'atom',
    levels: [react1, react2, react3, react4, react5, react6, react7, react8, react9, react10, react11].map(
      asLevel,
    ),
  },
  {
    id: 'fp',
    title: '函數式思考（Grokking Simplicity）',
    icon: 'book-open',
    levels: [
      fp1, fp2, fp3, fp4, fp5, fp6, fp7, fp8, fp9, fp10,
      fp11, fp12, fp13, fp14, fp15, fp16, fp17, fp18, fp19,
    ].map(asLevel),
  },
  {
    id: 'react-interview',
    title: 'React 面試題',
    icon: 'lightbulb',
    levels: [
      ri9, ri10, ri11, ri12, ri13, ri14, ri15, ri16, ri17,
      ri1, ri2, ri3, ri4, ri5, ri6, ri7, ri8,
      ri18, ri19, ri20, ri21, ri22, ri23, ri24, ri25, ri26, ri27, ri28, ri29, ri30,
    ].map(asLevel),
  },
]

// 抽象屏障：所有跟「題目 × 所屬章節」相關的查詢都透過這份攤平清單計算，
// 上層函式不用重複寫三層巢狀迴圈走訪 chapters → levels → questions
interface FlatQuestion {
  chapterId: string
  question: Question
}

const flatQuestions: FlatQuestion[] = chapters.flatMap((ch) =>
  ch.levels.flatMap((level) => level.questions.map((question) => ({ chapterId: ch.id, question }))),
)

export const getLevel = (levelId: string): Level | null =>
  chapters.flatMap((ch) => ch.levels).find((l) => l.id === levelId) ?? null

const questionChapterMap = new Map(flatQuestions.map((fq) => [fq.question.id, fq.chapterId]))

export const getChapterIdForQuestion = (questionId: string): string | undefined =>
  questionChapterMap.get(questionId)

// 從錯題本 id 集合撈出題目本體（照章節順序）
export const getWrongQuestions = (wrongIds: Record<string, WrongEntryMeta>): Question[] =>
  flatQuestions.filter((fq) => wrongIds[fq.question.id]).map((fq) => fq.question)

// 錯題本瀏覽用：題目本體＋熟練度資訊，最需要複習的（盒子小、越久沒複習）排前面
export const getWrongEntries = (wrongIds: Record<string, WrongEntryMeta>): WrongEntry[] =>
  flatQuestions
    .flatMap((fq) => {
      const entry = wrongIds[fq.question.id]
      return entry ? [{ question: fq.question, ...entry }] : []
    })
    .sort((a, b) => a.box - b.box || (a.lastWrong ?? '').localeCompare(b.lastWrong ?? ''))

// 從收藏 id 集合撈出題目本體（照章節順序）
export const getSavedQuestions = (savedIds: Record<string, boolean>): Question[] =>
  flatQuestions.filter((fq) => savedIds[fq.question.id]).map((fq) => fq.question)
