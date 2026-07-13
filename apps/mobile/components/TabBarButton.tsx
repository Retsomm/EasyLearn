import type { ReactNode } from 'react';
import { Pressable, StyleSheet, type PressableProps } from 'react-native';

import { colors } from '@/constants/theme';

interface TabBarButtonProps extends PressableProps {
  children?: ReactNode;
}

// 對照 index.css @media(max-width:640px) 的 .navbar-tab.is-active：選中的分頁上緣露出
// 2px primary 色細線＋淡淡的底色，其餘分頁保持透明。expo-router 的 tabBarItemStyle
// 沒辦法依 focus 狀態動態切換，所以用 tabBarButton 換掉預設按鈕自己控制這段樣式。
export default function TabBarButton({ children, style, accessibilityState, ...rest }: TabBarButtonProps) {
  const focused = accessibilityState?.selected;
  return (
    <Pressable
      {...rest}
      accessibilityState={accessibilityState}
      style={[styles.base, focused && styles.active, style as never]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 9,
    borderTopWidth: 2,
    borderTopColor: 'transparent',
  },
  active: {
    borderTopColor: colors.primary,
    backgroundColor: 'rgba(255, 180, 84, 0.08)',
  },
});
