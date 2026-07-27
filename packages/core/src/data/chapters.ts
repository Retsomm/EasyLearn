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
import sicp11 from './questions/sicp-1-1-elements-of-programming.json'
import sicp12 from './questions/sicp-1-2-processes-and-recursion.json'
import sicp13 from './questions/sicp-1-3-higher-order-functions.json'
import sicp21 from './questions/sicp-2-1-data-abstraction.json'
import sicp22 from './questions/sicp-2-2-hierarchical-data.json'
import sicp23 from './questions/sicp-2-3-symbolic-data.json'
import sicp24 from './questions/sicp-2-4-multiple-representations.json'
import sicp25 from './questions/sicp-2-5-generic-operations.json'
import sicp31 from './questions/sicp-3-1-assignment-local-state.json'
import sicp32 from './questions/sicp-3-2-environment-model.json'
import sicp33 from './questions/sicp-3-3-mutable-data.json'
import sicp34 from './questions/sicp-3-4-concurrency.json'
import sicp35 from './questions/sicp-3-5-streams.json'
import sicp41 from './questions/sicp-4-1-metacircular-evaluator.json'
import sicp42 from './questions/sicp-4-2-lazy-evaluation.json'
import sicp43 from './questions/sicp-4-3-nondeterministic-computing.json'
import sicp44 from './questions/sicp-4-4-logic-programming.json'
import sicp51 from './questions/sicp-5-1-register-machines.json'
import sicp52 from './questions/sicp-5-2-register-machine-simulator.json'
import sicp53 from './questions/sicp-5-3-storage-gc.json'
import sicp54 from './questions/sicp-5-4-explicit-control-evaluator.json'
import sicp55 from './questions/sicp-5-5-compilation.json'
import dmmf1 from './questions/dmmf-1-introducing-ddd.json'
import dmmf2 from './questions/dmmf-2-understanding-domain.json'
import dmmf3 from './questions/dmmf-3-functional-architecture.json'
import dmmf4 from './questions/dmmf-4-understanding-types.json'
import dmmf5 from './questions/dmmf-5-domain-modeling-types.json'
import dmmf6 from './questions/dmmf-6-integrity-consistency.json'
import dmmf7 from './questions/dmmf-7-workflows-as-pipelines.json'
import dmmf8 from './questions/dmmf-8-understanding-functions.json'
import dmmf9 from './questions/dmmf-9-composing-pipeline.json'
import dmmf10 from './questions/dmmf-10-working-with-errors.json'
import dmmf11 from './questions/dmmf-11-serialization.json'
import dmmf12 from './questions/dmmf-12-persistence.json'
import dmmf13 from './questions/dmmf-13-evolving-design.json'
import fljs1 from './questions/fljs-1-why-functional.json'
import fljs2 from './questions/fljs-2-nature-of-functions.json'
import fljs3 from './questions/fljs-3-managing-inputs.json'
import fljs4 from './questions/fljs-4-composing-functions.json'
import fljs5 from './questions/fljs-5-reducing-side-effects.json'
import fljs6 from './questions/fljs-6-value-immutability.json'
import fljs7 from './questions/fljs-7-closure-vs-object.json'
import fljs8 from './questions/fljs-8-recursion.json'
import fljs9 from './questions/fljs-9-list-operations.json'
import fljs10 from './questions/fljs-10-functional-async.json'
import fljs11 from './questions/fljs-11-putting-together.json'
import fljs12 from './questions/fljs-12-transducing.json'
import fljs13 from './questions/fljs-13-humble-monad.json'
import gfp1 from './questions/gfp-1-learning-fp.json'
import gfp2 from './questions/gfp-2-pure-functions.json'
import gfp3 from './questions/gfp-3-immutable-values.json'
import gfp4 from './questions/gfp-4-functions-as-values.json'
import gfp5 from './questions/gfp-5-sequential-programs.json'
import gfp6 from './questions/gfp-6-error-handling.json'
import gfp7 from './questions/gfp-7-requirements-as-types.json'
import gfp8 from './questions/gfp-8-io-as-values.json'
import gfp9 from './questions/gfp-9-streams-as-values.json'
import gfp10 from './questions/gfp-10-concurrent-programs.json'
import gfp11 from './questions/gfp-11-designing-fp-programs.json'
import gfp12 from './questions/gfp-12-testing-fp-programs.json'
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
    id: 'sicp',
    title: '計算機程式的構造和解釋（SICP JS）',
    icon: 'star',
    levels: [
      sicp11, sicp12, sicp13,
      sicp21, sicp22, sicp23, sicp24, sicp25,
      sicp31, sicp32, sicp33, sicp34, sicp35,
      sicp41, sicp42, sicp43, sicp44,
      sicp51, sicp52, sicp53, sicp54, sicp55,
    ].map(asLevel),
  },
  {
    id: 'dmmf',
    title: '領域驅動的函數式設計（Domain Modeling Made Functional）',
    icon: 'shuffle',
    levels: [
      dmmf1, dmmf2, dmmf3, dmmf4, dmmf5, dmmf6, dmmf7,
      dmmf8, dmmf9, dmmf10, dmmf11, dmmf12, dmmf13,
    ].map(asLevel),
  },
  {
    id: 'fljs',
    title: '輕量函數式 JavaScript（Functional-Light JavaScript）',
    icon: 'pencil',
    levels: [
      fljs1, fljs2, fljs3, fljs4, fljs5, fljs6, fljs7,
      fljs8, fljs9, fljs10, fljs11, fljs12, fljs13,
    ].map(asLevel),
  },
  {
    id: 'gfp',
    title: '函數式程式設計實戰（Grokking Functional Programming）',
    icon: 'eye',
    levels: [
      gfp1, gfp2, gfp3, gfp4, gfp5, gfp6,
      gfp7, gfp8, gfp9, gfp10, gfp11, gfp12,
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
