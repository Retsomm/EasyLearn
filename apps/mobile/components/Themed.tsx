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

// 純版面用途的容器：只跟著主題換 backgroundColor，不畫裝飾層，可以安心巢狀使用
// （不會疊出好幾層 ThemeBackground）。畫面最外層想要星點/光暈/掃描線裝飾，改用下面的 ScreenRoot。
export function View(props: ViewProps) {
  const { style, ...otherProps } = props;
  const { colors } = useAppTheme();

  return <DefaultView style={[{ backgroundColor: colors.bg }, style]} {...otherProps} />;
}

// 疊一層 ThemeBackground（星點/光暈/掃描線裝飾，對照 apps/web body::before／::after），
// 畫在 children 之下——只給每個 tab 畫面最外層的根容器用一次，其他巢狀版面一律用上面的 View，
// 避免裝飾層跟著巢狀結構重複疊加。
export function ScreenRoot(props: ViewProps) {
  const { style, children, ...otherProps } = props;
  const { colors } = useAppTheme();

  return (
    <DefaultView style={[{ backgroundColor: colors.bg }, style]} {...otherProps}>
      <ThemeBackground />
      {children}
    </DefaultView>
  );
}
