import { chapters } from './chapters'
import type { IconName, Topic } from '../types'

// 少數主題底下有好幾個 Chapter（例如原本拆成好幾本書的系列，合併成一本書、每本原書變成一章），要在這裡明確列出分組，
// 其餘 Chapter 一律自動變成「底下只有自己一個 Chapter」的主題，不用逐一列舉
const GROUPED_TOPICS: { id: string; title: string; icon: IconName; chapterIds: string[] }[] = [
  {
    id: 'ydkjs',
    title: '你不知道的JavaScript',
    icon: 'lock',
    chapterIds: ['ydkjs-sc', 'ydkjs-tp', 'ydkjs-tg', 'ydkjs-ap', 'ydkjs-ug', 'ydkjs-es6'],
  },
]

const groupOfChapterId = new Map(
  GROUPED_TOPICS.flatMap((group) => group.chapterIds.map((chapterId) => [chapterId, group])),
)

// 依 chapters 原本的順序展開成主題清單，分組主題會在「該組第一個 Chapter 出現的位置」插入一次
export const topics: Topic[] = (() => {
  const result: Topic[] = []
  const emittedGroupIds = new Set<string>()

  for (const chapter of chapters) {
    const group = groupOfChapterId.get(chapter.id)
    if (!group) {
      result.push({ id: chapter.id, title: chapter.title, icon: chapter.icon, chapters: [chapter] })
      continue
    }
    if (emittedGroupIds.has(group.id)) continue
    emittedGroupIds.add(group.id)
    result.push({
      id: group.id,
      title: group.title,
      icon: group.icon,
      chapters: group.chapterIds
        .map((chapterId) => chapters.find((ch) => ch.id === chapterId))
        .filter((ch): ch is (typeof chapters)[number] => ch !== undefined),
    })
  }

  return result
})()

export const getTopicForChapter = (chapterId: string): Topic | undefined =>
  topics.find((topic) => topic.chapters.some((ch) => ch.id === chapterId))
