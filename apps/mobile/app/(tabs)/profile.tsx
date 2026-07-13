import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth, useSSO, useUser } from '@clerk/expo';

// 注意：View 刻意從 'react-native' 引入（預設透明），不是 Themed 的 View——Themed.View
// 沒有明確設定 backgroundColor 時會強制塗上整頁背景色 colors.bg（#04070a），拿來當純版面
// 容器（例如卡片內部的 row/column）會蓋掉外層卡片自己的 colors.card（#0a1216）背景，
// 兩色非常接近、肉眼平常看不出來，但疊起來後有些區塊會比周圍明顯偏黑，就是這次「怪異黑底」
// 的真正根因（用 RN 內建 Element Inspector 點出來確認過：backgroundColor 顯示的是 #04070a
// 而不是預期的 #0a1216）。這個檔案是目前唯一同時匯入 Themed 的 Text／View 又拿 View 當純版面
// 容器用的地方，其他畫面都已經是用這裡的 plain View，只有這支需要修正。
import { Text } from '@/components/Themed';
import Icon from '@/components/Icon';
import AccountHeader from '@/components/AccountHeader';
import Mascot from '@/components/Mascot';
import GrowthHistory from '@/components/GrowthHistory';
import XpBar from '@/components/XpBar';
import { PrimaryButton, TextButton, buttonTextStyles } from '@/components/Button';
import { colors, fonts } from '@/constants/theme';
import { useProgress } from '@/context/ProgressContext';
import { request } from '@/lib/api';
import { chapters, getNextStage, getStage, getStageProgress } from '@easylearn/core';

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
  const { height: windowHeight } = useWindowDimensions();
  const containerStyle = [styles.container, { paddingTop: 24 }];
  // 上一輪的 bug：modalCard 自己的 maxHeight:'75%' 是相對於「背景遮罩層」（不含底部 tab bar，
  // 比整個視窗矮）算的，但這裡用 useWindowDimensions() 量的是整個視窗高度，兩個基準對不起來，
  // 算出來給 ScrollView 的數字可能比 modalCard 自己被夾住的高度還大，導致外層先把畫面切掉、
  // ScrollView 自己的 maxHeight 根本沒機會生效。這次把 modalCard 自己的高度也改成同一個基準
  // 算出來的明確數字（不再用 '75%' 字串），兩層用同一個數字，才不會互相打架。
  const growthModalCardMaxHeight = windowHeight * 0.75;
  const growthModalScrollMaxHeight = growthModalCardMaxHeight - 80; // 80 ≈ 標題列＋卡片上下 padding

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
      <View style={[styles.container, { paddingTop: insets.top + 24 }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!isSignedIn) {
    return (
      <View style={styles.loginContainer}>
        <View style={[styles.loginBox, { marginTop: insets.top }]}>
          <Icon name="sprout" size={36} color={colors.ink} />
          <Text style={styles.title}>登入 EasyLearn</Text>
          <Text style={styles.subtitle}>登入後可在多裝置同步學習進度；未登入也能繼續刷題，進度先存在這台裝置。</Text>
          <PrimaryButton onPress={handleSignIn} style={styles.loginBtn}>
            <Icon name="user" size={18} color={colors.primaryInk} />
            <Text style={buttonTextStyles.primary}>使用 Google 登入</Text>
          </PrimaryButton>
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
  const xpProgress = getStageProgress(progress.xp);

  return (
    <>
      {/* 這層包住 ScrollView 的 View 才是真正的安全區留白：paddingTop 是它自己的 padding，
          不屬於可捲動內容，所以捲動時不會被捲走，狀態列底下永遠有這個不透明的 colors.bg
          墊著。之前把 insets.top 放進 ScrollView 的 contentContainerStyle，那塊留白屬於
          「捲動內容」的一部分，往上捲一下就跟著捲走了，底下的內容接著就直接畫到狀態列後面，
          跟狀態列的時間/電量文字重疊。 */}
      <View style={[styles.screenWrap, { paddingTop: insets.top }]}>
        <ScrollView contentContainerStyle={containerStyle}>
          {!user ? (
            <ActivityIndicator color={colors.primary} />
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
                  <View style={styles.xpBarWrap}>
                    <XpBar progress={xpProgress} width="100%" height={8} />
                  </View>
                </View>
                <TextButton onPress={() => setShowGrowth(true)}>
                  <Text style={buttonTextStyles.text}>查看全部 ›</Text>
                </TextButton>
              </View>
            </View>

            <Text style={styles.sectionTitle}>學習統計</Text>
            {!hydrated ? (
              <ActivityIndicator style={styles.spinner} color={colors.primary} />
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
                  <Icon name="logout" size={15} color={colors.ink} />
                  <Text style={styles.accountItemText}>登出</Text>
                </View>
                <Icon name="chevron-right" size={16} color="rgba(95, 240, 224, 0.4)" />
              </Pressable>
              <Pressable
                style={[styles.accountItem, styles.accountItemDanger]}
                onPress={handleDeleteAccount}
                disabled={deleting}
              >
                <View style={styles.accountItemLabel}>
                  <Icon name="trash" size={15} color={colors.wrong} />
                  <Text style={[styles.accountItemText, styles.accountItemDangerText]}>
                    {deleting ? '刪除中…' : '刪除帳號'}
                  </Text>
                </View>
                <Icon name="chevron-right" size={16} color="rgba(255, 92, 114, 0.5)" />
              </Pressable>
            </View>
          </>
        )}
        </ScrollView>
      </View>

      {/* 成長史彈窗刻意不用 RN 的 <Modal>：Android 上 Modal 是另開一個系統 Dialog 視窗，
          不會繼承 app 主視窗的 edge-to-edge／安全區設定，導致底部導覽列那塊區域露出系統預設的
          純黑背景（實機回報過這個視覺問題）。改成同一棵 React tree 裡的絕對定位覆蓋層，
          確保跟其他畫面共用同一個視窗、同一份安全區設定。
          背景（點擊關閉）跟卡片本體刻意是「手足」關係，不是卡片包在背景 Pressable 裡面：
          上一版把整個卡片放進背景 Pressable 底下，結果 (1) Pressable 包住 ScrollView 讓
          iOS 滑不動，(2) 拿掉卡片自己的 stopPropagation 保護後，點卡片內容也會被判定成
          點到背景、直接關閉彈窗。改成背景 Pressable 蓋滿全螢幕、卡片容器用
          pointerEvents="box-none" 疊在背景「上面」（手足關係，卡片不是背景的子節點）：
          點卡片本體時，RN 的觸控命中測試會直接打到卡片自己的畫面元素，不會經過背景
          Pressable；只有點卡片以外、真正露出背景的空白處，才會落到背景 Pressable 上觸發關閉。 */}
      {user && showGrowth && (
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowGrowth(false)} />
          <View style={styles.modalCardWrap} pointerEvents="box-none">
            <View style={[styles.modalCard, { maxHeight: growthModalCardMaxHeight }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>成長史</Text>
                <Pressable onPress={() => setShowGrowth(false)} hitSlop={8}>
                  <Icon name="x" size={20} color={colors.ink} />
                </Pressable>
              </View>
              <ScrollView
                style={{ maxHeight: growthModalScrollMaxHeight }}
                contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
              >
                <GrowthHistory xp={progress.xp} />
              </ScrollView>
            </View>
          </View>
        </View>
      )}
    </>
  );
}

function StatItem({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrap: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    backgroundColor: colors.bg,
  },
  loginContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.bg,
  },
  loginBox: {
    alignItems: 'center',
    gap: 8,
    maxWidth: 340,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: 'rgba(95, 240, 224, 0.25)',
    paddingVertical: 36,
    paddingHorizontal: 28,
  },
  title: {
    fontFamily: fonts.mono.bold,
    fontSize: 22,
    fontWeight: '700',
    color: colors.inkStrong,
    marginTop: 4,
  },
  subtitle: {
    fontFamily: fonts.sans.regular,
    fontSize: 13,
    lineHeight: 22,
    color: colors.inkSoft,
    textAlign: 'center',
    marginBottom: 4,
  },
  loginBtn: {
    marginTop: 8,
  },
  spinner: {
    marginTop: 8,
  },
  error: {
    fontFamily: fonts.sans.regular,
    color: colors.wrong,
    fontSize: 13,
    textAlign: 'center',
  },
  hero: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.optionBorder,
    padding: 22,
  },
  heroXpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
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
    fontFamily: fonts.mono.bold,
    fontWeight: '700',
    fontSize: 13,
    color: colors.primary,
  },
  heroXpCount: {
    fontFamily: fonts.mono.regular,
    fontSize: 11,
    color: colors.inkSoft,
  },
  xpBarWrap: {
    marginTop: 8,
  },
  modalRoot: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(4, 7, 10, 0.75)',
  },
  modalCardWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
  },
  modalCard: {
    maxHeight: '75%',
    padding: 20,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderColor: colors.optionBorder,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitle: {
    fontFamily: fonts.mono.bold,
    fontSize: 16,
    fontWeight: '700',
    color: colors.inkStrong,
  },
  sectionTitle: {
    fontFamily: fonts.mono.bold,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: 'rgba(95, 240, 224, 0.65)',
    marginTop: 24,
    marginBottom: 12,
  },
  // 對照 index.css @media(max-width:480px) 的 .profile-stat-grid 手機版變體：手機寬度幾乎
  // 都落在這個斷點內，直接採用單欄、標籤在左數值在右的橫列樣式（不是桌面版 4 欄 grid）。
  statGrid: {
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.optionBorder,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  statValue: {
    fontFamily: fonts.mono.extraBold,
    fontSize: 18,
    fontWeight: '800',
    color: colors.cyan,
  },
  statLabel: {
    fontFamily: fonts.sans.regular,
    fontSize: 12,
    color: colors.inkFaint,
  },
  accountList: {
    borderWidth: 1,
    borderColor: colors.optionBorder,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(95, 240, 224, 0.12)',
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
    fontFamily: fonts.sans.regular,
    fontSize: 14,
    color: colors.ink,
  },
  accountItemDangerText: {
    color: colors.wrong,
  },
});
