import { useCallback, useState, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

// 對照 apps/web index.css 的 clip-path 缺角造型：RN 沒有原生 clip-path，
// 用 react-native-svg 畫一個缺角多邊形當背景，取代 CSS 的 clip-path: polygon(...)。
// 'tr-bl' = 切右上/左下角（.question-card／.note-card／.login-box 用，notch=18）
// 'tl-br' = 切左上/右下角（.primary-btn 用，notch-sm=12）
export type NotchCorners = 'tr-bl' | 'tl-br';

const buildPoints = (w: number, h: number, n: number, corners: NotchCorners): string => {
  const notch = Math.min(n, w / 2, h / 2);
  const pts =
    corners === 'tr-bl'
      ? [
          [0, 0],
          [w - notch, 0],
          [w, notch],
          [w, h],
          [notch, h],
          [0, h - notch],
        ]
      : [
          [notch, 0],
          [w, 0],
          [w, h - notch],
          [w - notch, h],
          [0, h],
          [0, notch],
        ];
  return pts.map((p) => p.join(',')).join(' ');
};

interface NotchedViewProps {
  notch?: number;
  corners?: NotchCorners;
  backgroundColor: string;
  borderColor?: string;
  borderWidth?: number;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

// 用法：外層 style 只放寬度/margin 等排版屬性，padding 一律放 contentStyle——
// 這樣 Svg 背景（絕對定位鋪滿外層）才能涵蓋到完整的 padding 區域，缺角才會切在最外緣。
export default function NotchedView({
  notch = 18,
  corners = 'tr-bl',
  backgroundColor,
  borderColor = 'transparent',
  borderWidth = 0,
  style,
  contentStyle,
  children,
}: NotchedViewProps) {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize((prev) => (prev && prev.width === width && prev.height === height ? prev : { width, height }));
  }, []);

  return (
    <View onLayout={onLayout} style={style}>
      {size ? (
        <Svg width={size.width} height={size.height} style={StyleSheet.absoluteFill}>
          <Polygon
            points={buildPoints(size.width, size.height, notch, corners)}
            fill={backgroundColor}
            stroke={borderColor}
            strokeWidth={borderWidth}
          />
        </Svg>
      ) : null}
      <View style={contentStyle}>{children}</View>
    </View>
  );
}
