import { useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth, useSSO, useUser } from '@clerk/expo';

import { Text, View } from '@/components/Themed';
import Icon from '@/components/Icon';
import AccountHeader from '@/components/AccountHeader';
import Mascot from '@/components/Mascot';
import GrowthHistory from '@/components/GrowthHistory';
import { useProgress } from '@/context/ProgressContext';
import { request } from '@/lib/api';
import { chapters, getNextStage, getStage } from '@easylearn/core';

// Phase 4：不再自己打 GET /api/progress，改讀 ProgressProvider 共用的 state——跟 Home tab
// 是同一份進度，登入時的搬遷（migrate-local）也只會在 provider 裡觸發一次。
// Phase 6：補上 web 版 Profile.tsx 其餘還沒搬過來的部分（頭像拖曳/縮放/改名、吉祥物成長史、
// 帳號設定的登出/刪除帳號）。
export default function ProfileScreen() {
  const { isLoaded, isSignedIn, signOut, getToken } = useAuth();
  const { user } = useUser();
  const { startSSOFlow } = useSSO();
  const { progress, hydrated } = useProgress();
  const [error, setError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const [showGrowth, setShowGrowth] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const insets = useSafeAreaInsets();
  const containerStyle = [styles.container, { paddingTop: insets.top }];

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

  const handleDeleteAccount = () => {
    Alert.alert('確定要刪除帳號嗎？', '此操作無法復原，雲端學習進度會一併刪除。', [
      { text: '取消', style: 'cancel' },
      {
        text: '刪除帳號',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            const token = await getToken();
            await request('/api/account', { method: 'DELETE', token });
            await signOut();
          } catch (err) {
            console.error('delete account failed', err);
            Alert.alert('刪除帳號失敗', '請稍後再試');
            setDeleting(false);
          }
        },
      },
    ]);
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
      <View style={styles.loginContainer}>
        <View style={[styles.loginBox, { marginTop: insets.top }]}>
          <Icon name="sprout" size={36} />
          <Text style={styles.title}>登入 EasyLearn</Text>
          <Text style={styles.subtitle}>登入後可在多裝置同步學習進度；未登入也能繼續刷題，進度先存在這台裝置。</Text>
          <Pressable style={styles.button} onPress={handleSignIn}>
            <Icon name="user" size={18} />
            <Text style={styles.buttonText}>使用 Google 登入</Text>
          </Pressable>
          {error && <Text style={styles.error}>{error}</Text>}
        </View>
      </View>
    );
  }

  const totalLevels = chapters.reduce((n, ch) => n + ch.levels.length, 0);
  const doneLevels = Object.keys(progress.completedLevels).length;
  const streak = progress.streak?.count ?? 0;
  const totalAnswered = Object.values(progress.dailyStats ?? {}).reduce((n, d) => n + d.total, 0);

  const stage = getStage(progress.xp);
  const nextStage = getNextStage(progress.xp);
  const xpProgress = nextStage
    ? Math.min(100, Math.round(((progress.xp - stage.min) / (nextStage.min - stage.min)) * 100))
    : 100;

  return (
    <ScrollView contentContainerStyle={containerStyle}>
      {!user ? (
        <ActivityIndicator />
      ) : (
        <>
          <Text style={styles.sectionTitle}>個人資料</Text>
          <View style={styles.hero}>
            <AccountHeader user={user} />
          </View>

          <Text style={styles.sectionTitle}>成長史</Text>
          <View style={styles.hero}>
            <View style={styles.heroXpRow}>
              <Mascot xp={progress.xp} size="sm" />
              <View style={styles.heroXpInfo}>
                <View style={styles.heroXpTop}>
                  <Text style={styles.heroXpName}>{stage.name}</Text>
                  <Text style={styles.heroXpCount}>
                    {nextStage ? `${progress.xp} / ${nextStage.min} XP` : `${progress.xp} XP・已達最終型態`}
                  </Text>
                </View>
                <View style={styles.xpBar}>
                  <View style={[styles.xpBarFill, { width: `${xpProgress}%` }]} />
                </View>
              </View>
              <Pressable onPress={() => setShowGrowth(true)} hitSlop={8}>
                <Text style={styles.growthLink}>查看全部 ›</Text>
              </Pressable>
            </View>
          </View>

          <Modal visible={showGrowth} animationType="slide" transparent onRequestClose={() => setShowGrowth(false)}>
            <View style={styles.modalBackdrop}>
              <View style={[styles.modalCard, { paddingBottom: insets.bottom + 16 }]}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>成長史</Text>
                  <Pressable onPress={() => setShowGrowth(false)} hitSlop={8}>
                    <Icon name="x" size={20} />
                  </Pressable>
                </View>
                <ScrollView>
                  <GrowthHistory xp={progress.xp} />
                </ScrollView>
              </View>
            </View>
          </Modal>

          <Text style={styles.sectionTitle}>學習統計</Text>
          {!hydrated ? (
            <ActivityIndicator style={styles.spinner} />
          ) : (
            <View style={styles.statGrid}>
              <StatItem label="總 XP" value={progress.xp} />
              <StatItem label="連續學習" value={`${streak} 天`} />
              <StatItem label="完成關卡" value={`${doneLevels} / ${totalLevels}`} />
              <StatItem label="累計答題" value={totalAnswered} />
            </View>
          )}

          <Text style={styles.sectionTitle}>帳號設定</Text>
          <View style={styles.accountList}>
            <Pressable style={styles.accountItem} onPress={() => signOut()}>
              <View style={styles.accountItemLabel}>
                <Icon name="logout" size={15} />
                <Text style={styles.accountItemText}>登出</Text>
              </View>
              <Icon name="chevron-right" size={16} />
            </Pressable>
            <Pressable
              style={[styles.accountItem, styles.accountItemDanger]}
              onPress={handleDeleteAccount}
              disabled={deleting}
            >
              <View style={styles.accountItemLabel}>
                <Icon name="trash" size={15} color="#e5484d" />
                <Text style={[styles.accountItemText, styles.accountItemDangerText]}>
                  {deleting ? '刪除中…' : '刪除帳號'}
                </Text>
              </View>
              <Icon name="chevron-right" size={16} color="#e5484d80" />
            </Pressable>
          </View>
        </>
      )}
    </ScrollView>
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
    padding: 16,
    gap: 14,
  },
  loginContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loginBox: {
    alignItems: 'center',
    gap: 10,
    maxWidth: 340,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    backgroundColor: '#2e78b7',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  hero: {
    borderRadius: 16,
    padding: 18,
    backgroundColor: '#88889910',
    gap: 4,
  },
  heroXpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  heroXpInfo: {
    flex: 1,
    minWidth: 0,
  },
  heroXpTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 8,
  },
  heroXpName: {
    fontWeight: '700',
    fontSize: 13,
  },
  heroXpCount: {
    fontSize: 11,
    opacity: 0.6,
  },
  xpBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#88889920',
    overflow: 'hidden',
    marginTop: 6,
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: '#2e78b7',
  },
  growthLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2e78b7',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalCard: {
    maxHeight: '75%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    backgroundColor: '#121212',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    opacity: 0.6,
    marginTop: 4,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    flexBasis: '47%',
    flexGrow: 1,
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#88889910',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
  accountList: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#88889918',
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#88889912',
  },
  accountItemDanger: {
    borderBottomWidth: 0,
  },
  accountItemLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accountItemText: {
    fontSize: 14,
  },
  accountItemDangerText: {
    color: '#e5484d',
  },
});
