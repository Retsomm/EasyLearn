import Svg, { Circle, Defs, Line, Pattern, RadialGradient, Rect, Stop } from 'react-native-svg';
import { StyleSheet } from 'react-native';

import { useAppTheme } from '@/context/AppThemeContext';
import type { ColorPalette, ThemeId } from '@/constants/themePalettes';

// 對照 apps/web/src/index.css 的 body::before（--bg-pattern 星點/光暈）與 body::after
// （掃描線）：網頁版用 CSS radial-gradient／repeating-linear-gradient 疊在整頁背景上，
// RN 沒有這兩種 CSS 語法，改用 react-native-svg（專案已有的依賴）畫等價的星點/光暈/掃描線。
// 座標是照抄各主題 CSS 裡宣告的位置，只是把超出 400 磚塊寬度的值 mod 400，讓它們落在同一塊
// 可以貼齊重複的磚塊裡；1a/1c/1f 那種大片、不重複的柔光（radial-gradient(circle at X% Y%...)）
// 改用 RadialGradient 疊在整片 Rect 上，位置一樣用百分比對應 CSS 的 `at X% Y%`。
// 這整支元件只負責畫「背景裝飾」，不吃觸控（pointerEvents="none"），疊在 Themed.View 的
// colors.bg 實色背景之上、children 之下。

const TILE = 400;

interface Dot {
  cx: number;
  cy: number;
  r: number;
  color: 'cyan' | 'primary' | 'white';
  opacity: number;
}

const mod = (n: number) => n % TILE;

// 對照 :root 的 --bg-pattern（6 個星點，400x400 磚塊）
const DEFAULT_DOTS: Dot[] = [
  { cx: 40, cy: 60, r: 1, color: 'cyan', opacity: 0.5 },
  { cx: 180, cy: 200, r: 1, color: 'cyan', opacity: 0.35 },
  { cx: 320, cy: 90, r: 1.4, color: 'primary', opacity: 0.4 },
  { cx: mod(500), cy: 260, r: 1, color: 'cyan', opacity: 0.4 },
  { cx: mod(650), cy: 120, r: 1, color: 'cyan', opacity: 0.3 },
  { cx: 90, cy: 340, r: 1, color: 'cyan', opacity: 0.3 },
];

// 對照 html[data-theme='1e'] 的 --bg-pattern（4 個星點，沒覆寫 tile size，沿用 400x400）
const CONSTELLATION_DOTS: Dot[] = [
  { cx: 60, cy: 80, r: 1, color: 'cyan', opacity: 0.5 },
  { cx: 300, cy: 200, r: 1, color: 'cyan', opacity: 0.4 },
  { cx: mod(550), cy: 100, r: 1, color: 'cyan', opacity: 0.35 },
  { cx: mod(700), cy: 300, r: 1, color: 'cyan', opacity: 0.3 },
];

// 對照 html[data-theme='1b'] 的 14 個星點（原本 --bg-pattern-size 是 100% 100% 不重複，
// 只會擠在畫面左上角一小塊；這裡刻意改成跟其他主題一樣用 400x400 磚塊平鋪，讓「極簡星域」
// 這個主題名稱在手機小螢幕上也能看到星點灑滿整個畫面，不是只有左上角一叢）
const STARFIELD_DOTS: Dot[] = [
  { cx: 20, cy: 30, r: 1, color: 'cyan', opacity: 0.6 },
  { cx: 70, cy: 90, r: 1.5, color: 'white', opacity: 0.65 },
  { cx: 130, cy: 50, r: 1, color: 'cyan', opacity: 0.4 },
  { cx: 180, cy: 150, r: 1, color: 'white', opacity: 0.5 },
  { cx: 240, cy: 20, r: 1, color: 'cyan', opacity: 0.45 },
  { cx: 300, cy: 110, r: 1.5, color: 'white', opacity: 0.6 },
  { cx: 40, cy: 200, r: 1, color: 'cyan', opacity: 0.35 },
  { cx: 100, cy: 260, r: 1, color: 'white', opacity: 0.4 },
  { cx: 190, cy: 240, r: 1, color: 'cyan', opacity: 0.5 },
  { cx: 330, cy: 260, r: 1.5, color: 'white', opacity: 0.55 },
  { cx: 360, cy: 180, r: 1, color: 'cyan', opacity: 0.4 },
  { cx: 10, cy: 340, r: 1, color: 'white', opacity: 0.35 },
  { cx: 270, cy: 330, r: 1, color: 'cyan', opacity: 0.4 },
  { cx: 150, cy: 380, r: 1, color: 'white', opacity: 0.45 },
];

const dotFill = (colors: ColorPalette, color: Dot['color']) =>
  color === 'cyan' ? colors.cyan : color === 'primary' ? colors.primary : '#ffffff';

function DotLayer({ dots, colors }: { dots: Dot[]; colors: ColorPalette }) {
  return (
    <>
      <Defs>
        <Pattern id="dots" width={TILE} height={TILE} patternUnits="userSpaceOnUse">
          {dots.map((d, i) => (
            <Circle key={i} cx={d.cx} cy={d.cy} r={d.r} fill={dotFill(colors, d.color)} fillOpacity={d.opacity} />
          ))}
        </Pattern>
      </Defs>
      <Rect x={0} y={0} width="100%" height="100%" fill="url(#dots)" />
    </>
  );
}

interface Blob {
  id: string;
  cxPct: number;
  cyPct: number;
  rPct: number;
  color: string;
  opacity: number;
}

function BlobLayer({ blobs }: { blobs: Blob[] }) {
  return (
    <>
      <Defs>
        {blobs.map((b) => (
          <RadialGradient key={b.id} id={b.id} cx={`${b.cxPct}%`} cy={`${b.cyPct}%`} r={`${b.rPct}%`}>
            <Stop offset="0" stopColor={b.color} stopOpacity={b.opacity} />
            <Stop offset="1" stopColor={b.color} stopOpacity={0} />
          </RadialGradient>
        ))}
      </Defs>
      {blobs.map((b) => (
        <Rect key={b.id} x={0} y={0} width="100%" height="100%" fill={`url(#${b.id})`} />
      ))}
    </>
  );
}

// 對照 html[data-theme='1f'] 的 repeating-linear-gradient 直條紋（每 24px 一條 1px 細線）
function StripeLayer({ color }: { color: string }) {
  const stripes = Array.from({ length: 20 }, (_, i) => i * 24);
  return (
    <>
      {stripes.map((x) => (
        <Line key={x} x1={x} y1={0} x2={x} y2="100%" stroke={color} strokeWidth={1} strokeOpacity={0.2} />
      ))}
    </>
  );
}

// 對照 body::after 的掃描線（每 3px 一條、白色 0.02 透明度的水平細線），六個主題共用同一層
function ScanlineLayer() {
  return (
    <>
      <Defs>
        <Pattern id="scanlines" width={3} height={3} patternUnits="userSpaceOnUse">
          <Line x1={0} y1={0.5} x2={3} y2={0.5} stroke="#ffffff" strokeWidth={1} strokeOpacity={0.02} />
        </Pattern>
      </Defs>
      <Rect x={0} y={0} width="100%" height="100%" fill="url(#scanlines)" />
    </>
  );
}

function ThemedPattern({ themeId, colors }: { themeId: ThemeId; colors: ColorPalette }) {
  switch (themeId) {
    case '1a':
      return (
        <BlobLayer
          blobs={[
            { id: 'b1', cxPct: 18, cyPct: 8, rPct: 42, color: colors.cyan, opacity: 0.32 },
            { id: 'b2', cxPct: 85, cyPct: 0, rPct: 46, color: colors.primary, opacity: 0.24 },
            { id: 'b3', cxPct: 55, cyPct: 105, rPct: 55, color: '#5eead4', opacity: 0.16 },
          ]}
        />
      );
    case '1b':
      return (
        <>
          <DotLayer dots={STARFIELD_DOTS} colors={colors} />
          <BlobLayer blobs={[{ id: 'b1', cxPct: 82, cyPct: 8, rPct: 45, color: colors.cyan, opacity: 0.1 }]} />
        </>
      );
    case '1c':
      return (
        <BlobLayer
          blobs={[
            { id: 'b1', cxPct: 10, cyPct: 0, rPct: 38, color: colors.cyan, opacity: 0.22 },
            { id: 'b2', cxPct: 90, cyPct: 15, rPct: 36, color: colors.primary, opacity: 0.2 },
          ]}
        />
      );
    case '1e':
      return <DotLayer dots={CONSTELLATION_DOTS} colors={colors} />;
    case '1f':
      return (
        <>
          <StripeLayer color={colors.primary} />
          <BlobLayer blobs={[{ id: 'b1', cxPct: 15, cyPct: 10, rPct: 50, color: colors.cyan, opacity: 0.22 }]} />
        </>
      );
    default:
      return <DotLayer dots={DEFAULT_DOTS} colors={colors} />;
  }
}

// 疊在 colors.bg 實色背景之上、children 之下的裝飾層；不吃觸控。
export default function ThemeBackground() {
  const { themeId, colors } = useAppTheme();
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <ThemedPattern themeId={themeId} colors={colors} />
      <ScanlineLayer />
    </Svg>
  );
}
