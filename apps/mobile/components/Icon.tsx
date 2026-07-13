import type { LucideIcon } from 'lucide-react-native';
import ArrowLeft from 'lucide-react-native/icons/arrow-left';
import ArrowRight from 'lucide-react-native/icons/arrow-right';
import Atom from 'lucide-react-native/icons/atom';
import BookOpen from 'lucide-react-native/icons/book-open';
import Bug from 'lucide-react-native/icons/bug';
import ChartColumn from 'lucide-react-native/icons/chart-column';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import CircleCheck from 'lucide-react-native/icons/circle-check';
import Clock from 'lucide-react-native/icons/clock';
import Download from 'lucide-react-native/icons/download';
import Eye from 'lucide-react-native/icons/eye';
import Flag from 'lucide-react-native/icons/flag';
import Flame from 'lucide-react-native/icons/flame';
import House from 'lucide-react-native/icons/house';
import Lightbulb from 'lucide-react-native/icons/lightbulb';
import Lock from 'lucide-react-native/icons/lock';
import LogOut from 'lucide-react-native/icons/log-out';
import Pencil from 'lucide-react-native/icons/pencil';
import Play from 'lucide-react-native/icons/play';
import Rocket from 'lucide-react-native/icons/rocket';
import RotateCcw from 'lucide-react-native/icons/rotate-ccw';
import Search from 'lucide-react-native/icons/search';
import Shuffle from 'lucide-react-native/icons/shuffle';
import Sprout from 'lucide-react-native/icons/sprout';
import Star from 'lucide-react-native/icons/star';
import Trash2 from 'lucide-react-native/icons/trash-2';
import Trophy from 'lucide-react-native/icons/trophy';
import User from 'lucide-react-native/icons/user';
import X from 'lucide-react-native/icons/x';
import type { IconName } from '@easylearn/core';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

// Phase 6：換成跟 tab bar 一致的線型簡約圖示，取代 Phase 3 MVP 暫時頂替用的 emoji。
// lucide-react-native 是 apps/web Icons.tsx 那組線型圖示（lucide.dev）的官方 RN 版本，
// 圖示名稱／路徑跟 web 版是同一個來源，只有少數幾個 icon 在較新版本改了名字
// （check-circle→CircleCheck、home→House、bar-chart→ChartColumn），對照確認過路徑資料一致。
// 用 `lucide-react-native/icons/xxx` 逐一深層匯入，不用根套件的具名匯入：根套件是全部
// 3000+ 個圖示的 barrel re-export，Metro 對 barrel import 的 tree-shaking 不夠乾淨，
// 實測 `expo export --platform web` 這樣會整包 3000+ 圖示一起打包（bundle 從 3.1MB
// 漲到 5.3MB）；換成逐一深層匯入後只打包這裡真的用到的 29 個。
const ICONS: Record<IconName, LucideIcon> = {
  'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight,
  x: X,
  'chevron-right': ChevronRight,
  lock: Lock,
  'check-circle': CircleCheck,
  play: Play,
  sprout: Sprout,
  rocket: Rocket,
  atom: Atom,
  eye: Eye,
  bug: Bug,
  search: Search,
  pencil: Pencil,
  'book-open': BookOpen,
  lightbulb: Lightbulb,
  flag: Flag,
  trophy: Trophy,
  flame: Flame,
  'rotate-ccw': RotateCcw,
  download: Download,
  star: Star,
  home: House,
  clock: Clock,
  'bar-chart': ChartColumn,
  user: User,
  shuffle: Shuffle,
  logout: LogOut,
  trash: Trash2,
};

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

export default function Icon({ name, size = 18, color }: IconProps) {
  const theme = useColorScheme();
  const IconComponent = ICONS[name];
  return <IconComponent size={size} color={color ?? Colors[theme].text} strokeWidth={2} />;
}
