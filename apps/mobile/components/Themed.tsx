import { Text as DefaultText, View as DefaultView } from 'react-native';

import ThemeBackground from '@/components/ThemeBackground';
import { fonts } from '@/constants/theme';
import { useAppTheme } from '@/context/AppThemeContext';

export type TextProps = DefaultText['props'];
export type ViewProps = DefaultView['props'];

// text/background 顏色跟著 AppThemeContext 的目前主題走（帳號頁「外觀主題」切換的
// 六色主題），不是系統的 light/dark 模式——這支 app 一律固定深色排版，只是深色系裡的
// 色票會換。之前透過 constants/Colors.ts 的 light/dark 對照表是尚未支援多主題切換前的
// 寫法，light 那組本來就沒被用到。
export function Text(props: TextProps) {
  const { style, ...otherProps } = props;
  const { colors } = useAppTheme();

  return <DefaultText style={[{ color: colors.ink, fontFamily: fonts.sans.regular }, style]} {...otherProps} />;
}

// 除了實色背景，還疊一層 ThemeBackground（星點/光暈/掃描線裝飾，對照 apps/web body::before／
// ::after），畫在 children 之下——這支元件目前唯一的用途就是畫面最外層的背景容器（見
// ThemeBackground.tsx 開頭的說明），所以在這裡統一疊加，不用每個畫面各自處理。
export function View(props: ViewProps) {
  const { style, children, ...otherProps } = props;
  const { colors } = useAppTheme();

  return (
    <DefaultView style={[{ backgroundColor: colors.bg }, style]} {...otherProps}>
      <ThemeBackground />
      {children}
    </DefaultView>
  );
}
