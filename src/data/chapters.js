// 章節地圖：關卡順序即解鎖順序
import jsb1 from './questions/jsb-1-variables.json'
import jsb2 from './questions/jsb-2-functions.json'
import jsb3 from './questions/jsb-3-arrays.json'
import jsb4 from './questions/jsb-4-objects.json'
import jsa1 from './questions/jsa-1-this-scope.json'
import jsa2 from './questions/jsa-2-closures.json'
import jsa3 from './questions/jsa-3-async-basics.json'
import jsa4 from './questions/jsa-4-async-await.json'
import react1 from './questions/react-1-jsx.json'
import react2 from './questions/react-2-props.json'
import react3 from './questions/react-3-state-events.json'
import react4 from './questions/react-4-hooks.json'

export const chapters = [
  {
    id: 'js-basics',
    title: 'JavaScript 基礎',
    icon: 'sprout',
    levels: [jsb1, jsb2, jsb3, jsb4],
  },
  {
    id: 'js-advanced',
    title: 'JavaScript 進階',
    icon: 'rocket',
    levels: [jsa1, jsa2, jsa3, jsa4],
  },
  {
    id: 'react',
    title: 'React',
    icon: 'atom',
    levels: [react1, react2, react3, react4],
  },
]

export function getLevel(levelId) {
  for (const ch of chapters) {
    const lv = ch.levels.find((l) => l.id === levelId)
    if (lv) return lv
  }
  return null
}
