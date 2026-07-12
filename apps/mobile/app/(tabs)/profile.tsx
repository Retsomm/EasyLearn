import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const [signingIn, setSigningIn] = useState(false);
  const insets = useSafeAreaInsets();
  const containerStyle = [styles.container, { paddingTop: insets.top }];

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

  // 只在 isSignedIn 變成 true 時打一次，不能依賴 loadProgress 本身：
  // Clerk 的 getToken 每次 render 不保證是同一個 reference，若依賴 loadProgress
  // 會導致這個 effect 每次 render 都重跑，變成無限狂打 GET /api/progress
  useEffect(() => {
    if (isSignedIn) loadProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn]);

  const handleSignIn = async () => {
    setError(null);
    setSigningIn(true);
    try {
      const { createdSessionId, setActive, authSessionResult } = await startSSOFlow({ strategy: 'oauth_google' });
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        // 成功時刻意不把 signingIn 設回 false：isSignedIn 變 true 之後下面的 if 就不會
        // 再走到「未登入」分支，signingIn 是不是 true 已經不重要。若在這裡就設回 false，
        // 反而可能搶在 isSignedIn 真的更新之前，讓畫面又露出一瞬間的未登入畫面。
      } else {
        // 沒有 createdSessionId 但也沒丟例外：使用者取消、或 startSSOFlow 內部判定失敗。
        // Android 導回時這個元件實例常常會被重新掛載，setError 顯示不出來，
        // 印到 console 才能在 Metro 終端機看到，不然這個失敗會完全無聲無息
        console.error('SSO 沒有取得 session，authSessionResult:', authSessionResult);
        setSigningIn(false);
      }
    } catch (err) {
      console.error('SSO 登入拋出例外：', err);
      setError(err instanceof Error ? err.message : '登入失敗');
      setSigningIn(false);
    }
  };

  if (!isLoaded) return null;

  // Android 導回 OAuth 結果時，畫面會先經過 app/sso-callback.tsx 導回這裡，
  // 但 setActive() 讓 isSignedIn 變 true 需要一點時間，這段空窗如果直接看 isSignedIn
  // 會閃一下未登入畫面。signingIn 從 handleSignIn 一開始就設 true，蓋住這段空窗，
  // 蓋到 setActive 真的完成（isSignedIn 變 true）或失敗（跳回登入畫面＋錯誤訊息）為止。
  if (!isSignedIn && signingIn) {
    return (
      <View style={containerStyle}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!isSignedIn) {
    return (
      <View style={containerStyle}>
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
