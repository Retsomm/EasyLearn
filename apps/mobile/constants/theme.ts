// 對照 apps/web/src/index.css 的 :root CSS variables，逐一搬成 RN 可用的常數。
// 顏色/字型/notch 尺寸都要跟網頁版完全一致，改動這裡務必回頭比對 index.css 有沒有跟著變。
export const colors = {
  bg: '#04070a',
  card: '#0a1216',
  ink: '#dff8f4',
  inkStrong: '#eafffb',
  inkSoft: 'rgba(223, 248, 244, 0.55)',
  inkFaint: 'rgba(223, 248, 244, 0.35)',
  primary: '#ffb454',
  primaryDeep: '#cc8f38',
  primaryInk: '#04070a',
  cyan: '#5ff0e0',
  correct: '#5ff0e0',
  correctFill: 'rgba(95, 240, 224, 0.12)',
  correctSoft: 'rgba(95, 240, 224, 0.08)',
  wrong: '#ff5c72',
  wrongFill: 'rgba(255, 92, 114, 0.12)',
  wrongSoft: 'rgba(255, 92, 114, 0.08)',
  locked: 'rgba(223, 248, 244, 0.35)',
  codeBg: '#04070a',
  track: 'rgba(95, 240, 224, 0.1)',
  optionBg: '#0d1319',
  optionBorder: 'rgba(95, 240, 224, 0.18)',
  secondaryBorder: 'rgba(95, 240, 224, 0.4)',
  badgeBg: 'rgba(255, 180, 84, 0.15)',
  navbarBg: '#060b0e',
  navbarBorder: 'rgba(95, 240, 224, 0.25)',
  navbarTabInactive: 'rgba(95, 240, 224, 0.55)',
  navbarActiveBorder: 'rgba(255, 180, 84, 0.4)',
  noteWrongBg: '#150a0d',
  noteWrongBorder: 'rgba(255, 92, 114, 0.4)',
  noteSavedBg: '#161006',
  noteSavedBorder: 'rgba(255, 180, 84, 0.4)',
  heat0: 'rgba(95, 240, 224, 0.08)',
  heat1: 'rgba(95, 240, 224, 0.2)',
  heat2: 'rgba(95, 240, 224, 0.4)',
  heat3: 'rgba(95, 240, 224, 0.7)',
  heat4: '#5ff0e0',
  chartCount: '#ffb454',
  chartAccuracy: '#5ff0e0',
  heroXpIconBg: '#0d1116',
} as const;

// RN 自訂字型要用 useFonts 載入後的 postscript 名稱，不能用 fontFamily+fontWeight 組合，
// 所以這裡直接對照網頁版每個 weight 個別取一個名字（400/500/700/800 mono、400/500/700/900 sans）。
export const fonts = {
  mono: {
    regular: 'JetBrainsMono_400Regular',
    medium: 'JetBrainsMono_500Medium',
    bold: 'JetBrainsMono_700Bold',
    extraBold: 'JetBrainsMono_800ExtraBold',
  },
  sans: {
    regular: 'NotoSansTC_400Regular',
    medium: 'NotoSansTC_500Medium',
    bold: 'NotoSansTC_700Bold',
    black: 'NotoSansTC_900Black',
  },
} as const;

// 網頁版 --radius 是 0px（全站直角），RN View 預設 borderRadius 就是 0，
// 這個常數只是給明確需要寫出來的地方參照用。
export const radius = 0;
export const notch = 18;
export const notchSm = 12;
