import type { ReactNode } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import NotchedView from '@/components/NotchedView';
import { notchSm } from '@/constants/theme';
import type { ColorPalette, ThemeStyle } from '@/constants/themePalettes';
import { useAppTheme } from '@/context/AppThemeContext';

interface ButtonProps {
  onPress?: () => void;
  disabled?: boolean;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

interface PrimaryButtonProps extends ButtonProps {
  contentStyle?: StyleProp<ViewStyle>;
}

// 對照 index.css 的 .primary-btn：缺角（notch-sm，切左上/右下）、實心 primary 底色。
// contentStyle 讓呼叫端覆寫 padding（例如 .next-btn 是 padding:14px，不是預設的 16px 32px）。
export function PrimaryButton({ onPress, disabled, children, style, contentStyle }: PrimaryButtonProps) {
  const { colors, style: themeStyle } = useAppTheme();
  const styles = makeStyles(colors, themeStyle);
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[styles.primaryWrap, disabled && styles.disabled, style]}>
      <NotchedView
        notch={notchSm}
        corners="tl-br"
        backgroundColor={colors.primary}
        contentStyle={[styles.primaryContent, contentStyle]}
      >
        {children}
      </NotchedView>
    </Pressable>
  );
}

// 對照 .secondary-btn：透明底、cyan 邊框，直角矩形（--radius:0）不需要缺角。
export function SecondaryButton({ onPress, disabled, children, style }: ButtonProps) {
  const { colors, style: themeStyle } = useAppTheme();
  const styles = makeStyles(colors, themeStyle);
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.secondary, disabled && styles.disabled, style]}
    >
      {children}
    </Pressable>
  );
}

// 對照 .text-btn／.danger-btn：純文字按鈕。danger（.danger-btn 的 --wrong 色）由呼叫端
// 透過 buttonTextStyles.textDanger／Icon color 自行套用在 children 上，這裡只負責版面。
export function TextButton({ onPress, disabled, children, style }: ButtonProps) {
  const { colors, style: themeStyle } = useAppTheme();
  const styles = makeStyles(colors, themeStyle);
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[styles.text, disabled && styles.disabled, style]}>
      {children}
    </Pressable>
  );
}

// 被 Home.tsx／QuestionBook.tsx／AccountHeader.tsx／Quiz.tsx／profile.tsx 等檔案
// 當成 style prop 直接引用（例如 <Text style={buttonTextStyles.primary}>），每個
// 呼叫端都要各自呼叫 makeButtonTextStyles(colors, themeStyle)（搭配 useAppTheme()／useMemo）
// 才會跟著主題切換，不能維持模組層級的靜態物件。
export const makeButtonTextStyles = (colors: ColorPalette, themeStyle: ThemeStyle) =>
  StyleSheet.create({
    primary: {
      fontFamily: themeStyle.mono.bold,
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 0.5,
      color: colors.primaryInk,
    },
    secondary: {
      fontFamily: themeStyle.mono.bold,
      fontSize: 14,
      fontWeight: '700',
      color: colors.ink,
    },
    text: {
      fontFamily: themeStyle.mono.bold,
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
    },
    textDanger: {
      fontFamily: themeStyle.mono.bold,
      fontSize: 12,
      fontWeight: '700',
      color: colors.wrong,
    },
  });

const makeStyles = (colors: ColorPalette, themeStyle: ThemeStyle) =>
  StyleSheet.create({
    // 故意不設 alignSelf：讓按鈕跟著父層的 alignItems 走（父層 center 就置中縮成內容寬，
    // 父層預設 stretch 就撐滿寬度），對應網頁版 inline-flex 元素被 flex 父層擺放的行為。
    primaryWrap: {},
    primaryContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 16,
      paddingHorizontal: 32,
    },
    secondary: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: 'transparent',
      borderWidth: themeStyle.borderWidth,
      borderStyle: themeStyle.borderStyle,
      borderRadius: themeStyle.radius,
      borderColor: colors.secondaryBorder,
      paddingVertical: 13,
      paddingHorizontal: 28,
    },
    text: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      padding: 4,
    },
    disabled: {
      opacity: 0.55,
    },
  });
