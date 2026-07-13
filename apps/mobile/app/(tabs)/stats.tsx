import { ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { View } from '@/components/Themed';
import { useProgress } from '@/context/ProgressContext';
import Stats from '@/screens/Stats';

export default function StatsScreen() {
  const { progress, hydrated } = useProgress();
  const insets = useSafeAreaInsets();

  if (!hydrated) {
    return (
      <View style={[styles.loading, { paddingTop: insets.top }]}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={[styles.flexFill, { paddingTop: insets.top }]}>
      <Stats progress={progress} />
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flexFill: {
    flex: 1,
  },
});
