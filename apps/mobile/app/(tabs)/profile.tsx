import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { useAuth, useSSO, useUser } from '@clerk/expo';
import type { Progress } from '@easylearn/core';

import { Text, View } from '@/components/Themed';
import { request } from '@/lib/api';

// Phase 2：唯讀 Profile——只讀 GET /api/progress 顯示 XP/streak/關卡數，不寫入。
// 這個畫面也是驗證「mobile 帶 Bearer token 打 web API 不用改 middleware」這個關鍵假設的地方。
export default function ProfileScreen() {
  const { isLoaded, isSignedIn, getToken, signOut } = useAuth();
  const { user } = useUser();
  const { startSSOFlow } = useSSO();
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProgress = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const data = await request<{ progress: Progress }>('/api/progress', { token });
      setProgress(data.progress);
    } catch (err) {
      setError(err instanceof Error ? err.message : '讀取進度失敗');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (isSignedIn) loadProgress();
  }, [isSignedIn, loadProgress]);

  const handleSignIn = async () => {
    setError(null);
    try {
      const { createdSessionId, setActive } = await startSSOFlow({ strategy: 'oauth_google' });
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '登入失敗');
    }
  };

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>登入 EasyLearn</Text>
        <Text style={styles.subtitle}>
          登入後可在多裝置同步學習進度；Home tab 已支援訪客模式離線答題，這裡顯示訪客進度留到 Phase 4（登入同步迴圈）一併處理
        </Text>
        <Pressable style={styles.button} onPress={handleSignIn}>
          <Text style={styles.buttonText}>使用 Google 登入</Text>
        </Pressable>
        {error && <Text style={styles.error}>{error}</Text>}
      </View>
    );
  }

  const totalAnswered = Object.values(progress?.dailyStats ?? {}).reduce((n, d) => n + d.total, 0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {user?.firstName ?? user?.primaryEmailAddress?.emailAddress ?? '已登入'}
      </Text>

      {loading && <ActivityIndicator style={styles.spinner} />}
      {error && <Text style={styles.error}>{error}</Text>}

      {progress && (
        <View style={styles.statGrid}>
          <StatItem label="總 XP" value={progress.xp} />
          <StatItem label="連續學習" value={`${progress.streak.count} 天`} />
          <StatItem label="完成關卡" value={Object.keys(progress.completedLevels).length} />
          <StatItem label="累計答題" value={totalAnswered} />
        </View>
      )}

      <Pressable style={[styles.button, styles.signOutButton]} onPress={() => signOut()}>
        <Text style={styles.buttonText}>登出</Text>
      </Pressable>
    </View>
  );
}

function StatItem({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
  },
  spinner: {
    marginTop: 8,
  },
  error: {
    color: '#e5484d',
    fontSize: 13,
    textAlign: 'center',
  },
  button: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    backgroundColor: '#2e78b7',
  },
  signOutButton: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    marginTop: 8,
  },
  statItem: {
    alignItems: 'center',
    minWidth: 100,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
});
