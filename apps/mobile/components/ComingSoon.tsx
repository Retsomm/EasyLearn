import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text, View } from '@/components/Themed';

interface ComingSoonProps {
  title: string;
  phase: string;
}

// Phase 2 只做 Profile tab，其餘分頁先放路由骨架，等對應 phase 再補內容
export default function ComingSoon({ title, phase }: ComingSoonProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{phase} 還沒做，敬請期待</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    opacity: 0.6,
  },
});
