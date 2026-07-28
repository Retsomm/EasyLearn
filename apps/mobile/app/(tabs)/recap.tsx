import { useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { View } from '@/components/Themed';
import { useAppTheme } from '@/context/AppThemeContext';
import { useProgress } from '@/context/ProgressContext';
import Recap from '@/screens/Recap';
import RecapChapter from '@/screens/RecapChapter';
import RecapTopicChapters from '@/screens/RecapTopicChapters';
import { getTopicForChapter } from '@easylearn/core';

type ViewState =
  | { name: 'recap' }
  | { name: 'recap-topic'; topicId: string }
  | { name: 'recap-chapter'; chapterId: string };

// 對照 apps/web App.tsx 裡的 recap/recap-chapter 這兩支 view，範圍只到 Recap tab，
// 跟其他 tab 各自獨立一個狀態機（理由同 notes.tsx 的註解）。書 > 章的巢狀導覽（recap-topic）
// 對照 index.tsx 的 topicbooks 狀態機寫法。
export default function RecapScreen() {
  const { progress, hydrated, toggleSavedKeyPoint } = useProgress();
  const { colors } = useAppTheme();
  const [view, setView] = useState<ViewState>({ name: 'recap' });
  const insets = useSafeAreaInsets();

  if (!hydrated) {
    return (
      <View style={[styles.loading, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  let content;
  if (view.name === 'recap-topic') {
    content = (
      <RecapTopicChapters
        topicId={view.topicId}
        onOpenChapter={(chapterId) => setView({ name: 'recap-chapter', chapterId })}
        onBack={() => setView({ name: 'recap' })}
      />
    );
  } else if (view.name === 'recap-chapter') {
    // 這章屬於「一本書底下有好幾章」的分組時，返回鍵要回到那本書的章節清單，不是直接回總覽
    // （對照 index.tsx 的 levellist 分支）
    const topic = getTopicForChapter(view.chapterId);
    const backView: ViewState =
      topic && topic.chapters.length > 1 ? { name: 'recap-topic', topicId: topic.id } : { name: 'recap' };
    content = (
      <RecapChapter
        chapterId={view.chapterId}
        savedKeyPointIds={progress.savedKeyPointIds ?? {}}
        onToggleSavedKeyPoint={toggleSavedKeyPoint}
        onBack={() => setView(backView)}
      />
    );
  } else {
    content = (
      <Recap
        onOpenChapter={(chapterId) => setView({ name: 'recap-chapter', chapterId })}
        onOpenTopic={(topicId) => setView({ name: 'recap-topic', topicId })}
      />
    );
  }

  return <View style={[styles.flexFill, { paddingTop: insets.top }]}>{content}</View>;
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
