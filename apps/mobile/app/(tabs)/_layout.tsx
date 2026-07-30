import { Tabs } from 'expo-router';
import { useAuth } from '@clerk/expo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import TabBarButton from '@/components/TabBarButton';
import { useAppTheme } from '@/context/AppThemeContext';

const TAB_BAR_CONTENT_HEIGHT = 62;

// 對應 apps/web 的 Navbar.tsx 五個分頁（home/notes/recap/stats/profile），樣式對照
// index.css @media(max-width:640px) 底部 tab bar 那組規則（.navbar/.navbar-tab 系列）。
export default function TabLayout() {
  const { isSignedIn } = useAuth();
  const { colors, style: themeStyle } = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.navbarTabInactive,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontFamily: themeStyle.mono.bold,
          fontSize: 10,
          fontWeight: '700',
        },
        tabBarStyle: {
          backgroundColor: colors.navbarBg,
          borderTopWidth: 1,
          borderTopColor: colors.navbarBorder,
          height: TAB_BAR_CONTENT_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 0,
        },
        tabBarItemStyle: {
          paddingVertical: 0,
        },
        tabBarButton: (props) => <TabBarButton {...props} />,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '每日刷題',
          tabBarIcon: ({ color }) => <Icon name="home" size={18} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="notes"
        options={{
          title: '精選筆記',
          tabBarIcon: ({ color }) => <Icon name="book-open" size={18} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="recap"
        options={{
          title: '章節重點',
          tabBarIcon: ({ color }) => <Icon name="star" size={18} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: '學習數據',
          tabBarIcon: ({ color }) => <Icon name="bar-chart" size={18} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: isSignedIn ? '個人資料' : '登入',
          tabBarIcon: ({ color }) => <Icon name="user" size={18} color={color as string} />,
        }}
      />
    </Tabs>
  );
}
