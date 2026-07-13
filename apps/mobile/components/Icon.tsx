import { Text } from '@/components/Themed';
import type { IconName } from '@easylearn/core';

// Phase 3 MVP：先用 emoji 頂替 web 版的 SVG 圖示（apps/web/src/components/Icons.tsx），
// 求功能完整（離線可以跑完整答題流程），不追求跟 web 像素級一致的視覺。
// 之後要做「星際 HUD」視覺時再換成真的向量圖示。
const EMOJI = {
  'arrow-left': '←',
  'arrow-right': '→',
  x: '✕',
  'chevron-right': '›',
  lock: '🔒',
  'check-circle': '✅',
  play: '▶️',
  sprout: '🌱',
  rocket: '🚀',
  atom: '⚛️',
  eye: '👁️',
  bug: '🐛',
  search: '🔍',
  pencil: '✏️',
  'book-open': '📖',
  lightbulb: '💡',
  flag: '🏁',
  trophy: '🏆',
  flame: '🔥',
  'rotate-ccw': '↺',
  download: '⬇️',
  star: '⭐',
  home: '🏠',
  clock: '🕐',
  'bar-chart': '📊',
  user: '👤',
  shuffle: '🔀',
  logout: '🚪',
  trash: '🗑️',
} satisfies Record<IconName, string>;

interface IconProps {
  name: IconName;
  size?: number;
}

export default function Icon({ name, size = 18 }: IconProps) {
  return <Text style={{ fontSize: size, lineHeight: size * 1.2 }}>{EMOJI[name]}</Text>;
}
