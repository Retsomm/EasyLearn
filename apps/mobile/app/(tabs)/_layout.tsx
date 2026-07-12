import { SymbolView } from 'expo-symbols';
import { Tabs } from 'expo-router';
import { useAuth } from '@clerk/expo';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

// 對應 apps/web 的 Navbar.tsx 四個分頁（home/notes/stats/profile）
export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { isSignedIn } = useAuth();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '每日刷題',
          tabBarIcon: ({ color }) => (
            <SymbolView name={{ ios: 'house', android: 'home', web: 'home' }} tintColor={color} size={26} />
          ),
        }}
      />
      <Tabs.Screen
        name="notes"
        options={{
          title: '精選筆記',
          tabBarIcon: ({ color }) => (
            <SymbolView name={{ ios: 'book', android: 'book', web: 'book' }} tintColor={color} size={26} />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: '學習數據',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'chart.bar', android: 'bar_chart', web: 'bar_chart' }}
              tintColor={color}
              size={26}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: isSignedIn ? '個人資料' : '登入',
          tabBarIcon: ({ color }) => (
            <SymbolView name={{ ios: 'person', android: 'person', web: 'person' }} tintColor={color} size={26} />
          ),
        }}
      />
    </Tabs>
  );
}
