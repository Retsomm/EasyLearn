import { colors as defaultColors, fonts as defaultFonts } from './theme';

// 對照 apps/web/src/lib/themes.ts 的主題清單／預設值；主題色票邏輯對照
// apps/web/src/index.css 每個 html[data-theme='xxx'] 區塊的 CSS 變數。
export type ThemeId = 'default' | '1a' | '1b' | '1c' | '1e' | '1f';

export interface ThemeOption {
  id: ThemeId;
  label: string;
  swatch: string;
}

export const THEMES: ThemeOption[] = [
  { id: 'default', label: '太空艙 HUD', swatch: '#5ff0e0' },
  { id: '1a', label: '深空星雲', swatch: '#c9a8ff' },
  { id: '1b', label: '極簡星域', swatch: '#8ecbff' },
  { id: '1c', label: '極光玻璃', swatch: '#5eead4' },
  { id: '1e', label: '星圖', swatch: '#e9c982' },
  { id: '1f', label: '霓虹星際', swatch: '#00e5ff' },
];

export const DEFAULT_THEME_ID: ThemeId = 'default';

export const isValidThemeId = (id: string): id is ThemeId => THEMES.some((t) => t.id === id);

// Record<key, string> 而不是直接用 typeof defaultColors：後者是 `as const` 出來的字面量型別，
// 其他 5 個主題算出來的色票是一般 string，指派給字面量型別的欄位會過不了 tsc。
export type ColorPalette = { [K in keyof typeof defaultColors]: string };

interface ThemeBase {
  bg: string;
  bgRgb: string;
  card: string;
  panelAlt: string;
  ink: string;
  inkRgb: string;
  inkStrong: string;
  primary: string;
  primaryRgb: string;
  primaryDeep: string;
  primaryPanel: string;
  onPrimary: string;
  cyan: string;
  cyanRgb: string;
  wrong: string;
  wrongRgb: string;
  wrongPanel: string;
  optionBg: string;
}

const rgba = (rgb: string, a: number) => `rgba(${rgb}, ${a})`;

// 除了 default 主題（直接沿用 apps/web index.css :root 的既有推導結果，見 constants/theme.ts）
// 之外，其餘 5 個主題的完整色票都是用跟 :root 推導完全相同的公式（rgba(x-rgb, alpha) 或直接
// 借用另一個基底色）算出來的，確保色彩邏輯跟網頁版一致。網頁版才有的字型／圓角／虛實線框／
// 背景漸層圖案等裝飾效果這次刻意不搬，RN 版全部維持跟 default 主題一樣，只有色票會換。
const buildPalette = (b: ThemeBase): ColorPalette => ({
  bg: b.bg,
  card: b.card,
  ink: b.ink,
  inkStrong: b.inkStrong,
  inkSoft: rgba(b.inkRgb, 0.55),
  inkFaint: rgba(b.inkRgb, 0.35),
  primary: b.primary,
  primaryDeep: b.primaryDeep,
  primaryInk: b.onPrimary,
  cyan: b.cyan,
  correct: b.cyan,
  correctFill: rgba(b.cyanRgb, 0.12),
  correctSoft: rgba(b.cyanRgb, 0.08),
  correctBorder: rgba(b.cyanRgb, 0.3),
  wrong: b.wrong,
  wrongFill: rgba(b.wrongRgb, 0.12),
  wrongSoft: rgba(b.wrongRgb, 0.08),
  wrongBorder: rgba(b.wrongRgb, 0.3),
  locked: rgba(b.inkRgb, 0.35),
  codeBg: b.bg,
  track: rgba(b.cyanRgb, 0.1),
  optionBg: b.optionBg,
  optionBorder: rgba(b.cyanRgb, 0.18),
  secondaryBorder: rgba(b.cyanRgb, 0.4),
  badgeBg: rgba(b.primaryRgb, 0.15),
  navbarBg: b.panelAlt,
  navbarBorder: rgba(b.cyanRgb, 0.25),
  navbarTabInactive: rgba(b.cyanRgb, 0.55),
  navbarActiveBorder: rgba(b.primaryRgb, 0.4),
  noteWrongBg: b.wrongPanel,
  noteWrongBorder: rgba(b.wrongRgb, 0.4),
  noteSavedBg: b.primaryPanel,
  noteSavedBorder: rgba(b.primaryRgb, 0.4),
  heat0: rgba(b.cyanRgb, 0.08),
  heat1: rgba(b.cyanRgb, 0.2),
  heat2: rgba(b.cyanRgb, 0.4),
  heat3: rgba(b.cyanRgb, 0.7),
  heat4: b.cyan,
  chartCount: b.primary,
  chartAccuracy: b.cyan,
  heroXpIconBg: b.optionBg,
  tabActiveBg: rgba(b.primaryRgb, 0.08),
  sectionLabel: rgba(b.cyanRgb, 0.65),
  hairline: rgba(b.cyanRgb, 0.12),
  dangerChevron: rgba(b.wrongRgb, 0.5),
});

const THEME_BASES: Record<Exclude<ThemeId, 'default'>, ThemeBase> = {
  '1a': {
    bg: '#0b0a1a', bgRgb: '11, 10, 26', card: '#150f2c', panelAlt: '#120b26',
    ink: '#f1e9ff', inkRgb: '241, 233, 255', inkStrong: '#ffffff',
    primary: '#ec4899', primaryRgb: '236, 72, 153', primaryDeep: '#bd3a7a',
    primaryPanel: '#261129', onPrimary: '#2a0d4a',
    cyan: '#c9a8ff', cyanRgb: '201, 168, 255',
    wrong: '#ff6b81', wrongRgb: '255, 107, 129', wrongPanel: '#281626',
    optionBg: '#1a1338',
  },
  '1b': {
    bg: '#05070d', bgRgb: '5, 7, 13', card: '#0b101d', panelAlt: '#080b14',
    ink: '#c7d6ea', inkRgb: '199, 214, 234', inkStrong: '#eef5ff',
    primary: '#9fb4ff', primaryRgb: '159, 180, 255', primaryDeep: '#7f90cc',
    primaryPanel: '#171c2a', onPrimary: '#04101f',
    cyan: '#8ecbff', cyanRgb: '142, 203, 255',
    wrong: '#ff9d9d', wrongRgb: '255, 157, 157', wrongPanel: '#23191e',
    optionBg: '#0f1526',
  },
  '1c': {
    bg: '#0a1128', bgRgb: '10, 17, 40', card: '#111d3a', panelAlt: '#0d1730',
    ink: '#eef4ff', inkRgb: '238, 244, 255', inkStrong: '#ffffff',
    primary: '#a78bfa', primaryRgb: '167, 139, 250', primaryDeep: '#866fc8',
    primaryPanel: '#1d2041', onPrimary: '#07211d',
    cyan: '#5eead4', cyanRgb: '94, 234, 212',
    wrong: '#f472b6', wrongRgb: '244, 114, 182', wrongPanel: '#261d39',
    optionBg: '#16224a',
  },
  '1e': {
    bg: '#0d1128', bgRgb: '13, 17, 40', card: '#141a38', panelAlt: '#10152e',
    ink: '#f2ecd6', inkRgb: '242, 236, 214', inkStrong: '#ffffff',
    primary: '#f2dba0', primaryRgb: '242, 219, 160', primaryDeep: '#c2af80',
    primaryPanel: '#282936', onPrimary: '#241a04',
    cyan: '#e9c982', cyanRgb: '233, 201, 130',
    wrong: '#ff8a80', wrongRgb: '255, 138, 128', wrongPanel: '#2a2033',
    optionBg: '#1a2142',
  },
  '1f': {
    bg: '#160821', bgRgb: '22, 8, 33', card: '#20092e', panelAlt: '#1a0720',
    ink: '#ffffff', inkRgb: '255, 255, 255', inkStrong: '#ffffff',
    primary: '#ff2e88', primaryRgb: '255, 46, 136', primaryDeep: '#cc256d',
    primaryPanel: '#320d2d', onPrimary: '#1a0311',
    cyan: '#00e5ff', cyanRgb: '0, 229, 255',
    wrong: '#ff2e88', wrongRgb: '255, 46, 136', wrongPanel: '#320d2d',
    optionBg: '#2a0a1f',
  },
};

export const THEME_PALETTES: Record<ThemeId, ColorPalette> = {
  default: defaultColors,
  '1a': buildPalette(THEME_BASES['1a']),
  '1b': buildPalette(THEME_BASES['1b']),
  '1c': buildPalette(THEME_BASES['1c']),
  '1e': buildPalette(THEME_BASES['1e']),
  '1f': buildPalette(THEME_BASES['1f']),
};

// 對照 apps/web/src/index.css 每個主題除了色票以外還會覆寫的 --font-mono／--radius／
// --border-w／--border-style／--glow-a：這些是讓 6 個主題視覺上真的長得不一樣的關鍵（不只是
// 換色），RN 版沒有 --font-sans 覆寫（每個主題的內文字型都一樣，只有標題/數字用的等寬展示字型
// mono 會換），也沒有 card-clip／btn-clip 這類 CSS clip-path 切角（RN 目前的卡片本來就是直角
// 矩形，跟切角是兩回事，這次不處理切角）。
// 同 ColorPalette：不能直接用 typeof defaultFonts.mono，那是 `as const` 字面量型別，
// 其他主題換成的字型名稱是一般 string，指派給字面量型別的欄位會過不了 tsc。
export type MonoFontFamily = { [K in keyof typeof defaultFonts.mono]: string };

export interface ThemeStyle {
  mono: MonoFontFamily;
  radius: number;
  borderWidth: number;
  borderStyle: 'solid' | 'dashed';
  glow: number;
}

export const THEME_STYLES: Record<ThemeId, ThemeStyle> = {
  default: {
    mono: defaultFonts.mono,
    radius: 0,
    borderWidth: 1,
    borderStyle: 'solid',
    glow: 1,
  },
  '1a': {
    mono: {
      regular: 'SpaceGrotesk_400Regular',
      medium: 'SpaceGrotesk_500Medium',
      bold: 'SpaceGrotesk_700Bold',
      extraBold: 'SpaceGrotesk_700Bold', // Space Grotesk 沒有 800，退回 700 Bold
    },
    radius: 24,
    borderWidth: 1,
    borderStyle: 'solid',
    glow: 1,
  },
  '1b': {
    mono: {
      regular: 'Rajdhani_400Regular',
      medium: 'Rajdhani_500Medium',
      bold: 'Rajdhani_700Bold',
      extraBold: 'Rajdhani_700Bold', // Rajdhani 沒有 800，退回 700 Bold
    },
    radius: 2,
    borderWidth: 3,
    borderStyle: 'dashed',
    glow: 0.45,
  },
  '1c': {
    mono: {
      regular: 'SpaceGrotesk_400Regular',
      medium: 'SpaceGrotesk_500Medium',
      bold: 'SpaceGrotesk_700Bold',
      extraBold: 'SpaceGrotesk_700Bold',
    },
    radius: 22,
    borderWidth: 1,
    borderStyle: 'solid',
    glow: 1,
  },
  '1e': {
    mono: {
      regular: 'Cinzel_400Regular',
      medium: 'Cinzel_500Medium',
      bold: 'Cinzel_700Bold',
      extraBold: 'Cinzel_800ExtraBold',
    },
    radius: 18,
    borderWidth: 1,
    borderStyle: 'solid',
    glow: 1,
  },
  '1f': {
    mono: {
      regular: 'Orbitron_400Regular',
      medium: 'Orbitron_500Medium',
      bold: 'Orbitron_700Bold',
      extraBold: 'Orbitron_800ExtraBold',
    },
    radius: 0,
    borderWidth: 1,
    borderStyle: 'solid',
    glow: 1,
  },
};
