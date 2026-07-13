import { colors } from '@/constants/theme';

// useColorScheme() 目前寫死回傳 'dark'，light 這組實際上不會被用到，
// 保留欄位只是配合 Themed.tsx 既有的 light/dark 型別介面。
export default {
  light: {
    text: '#000',
    background: '#fff',
    tint: colors.primary,
    tabIconDefault: '#ccc',
    tabIconSelected: colors.primary,
  },
  dark: {
    text: colors.ink,
    background: colors.bg,
    tint: colors.primary,
    tabIconDefault: colors.navbarTabInactive,
    tabIconSelected: colors.primary,
  },
};
