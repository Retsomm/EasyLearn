// 章節地圖：關卡順序即解鎖順序
import jsb1 from './questions/jsb-1-variables.json'
import jsb2 from './questions/jsb-2-functions.json'
import jsb3 from './questions/jsb-3-arrays.json'
import jsb4 from './questions/jsb-4-objects.json'

export const chapters = [
  {
    id: 'js-basics',
    title: 'JavaScript 基礎',
    emoji: '🌱',
    levels: [jsb1, jsb2, jsb3, jsb4],
  },
  {
    id: 'js-advanced',
    title: 'JavaScript 進階',
    emoji: '🚀',
    comingSoon: true,
    levels: [],
  },
  {
    id: 'react',
    title: 'React',
    emoji: '⚛️',
    comingSoon: true,
    levels: [],
  },
]

export function getLevel(levelId) {
  for (const ch of chapters) {
    const lv = ch.levels.find((l) => l.id === levelId)
    if (lv) return lv
  }
  return null
}
