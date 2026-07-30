import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/expo';

import { View } from '@/components/Themed';

// Android 模擬器／較慢的網路下，signIn.reload() + setActive() 這段可能不只 5 秒，
// 拉長一點避免逾時保底提前把使用者導回未登入畫面，蓋掉原本快完成的登入
const FALLBACK_TIMEOUT_MS = 15000;

// @clerk/expo 的 useSSO()（apps/mobile/app/(tabs)/profile.tsx 用到）沒指定 redirectUrl 時，
// 預設會把 OAuth 導回導到 easylearn://sso-callback（見 node_modules/@clerk/expo/dist/hooks/useSSO.js）。
// iOS 的 ASWebAuthenticationSession 不會讓這個 URL 流到 expo-router 的 Linking 監聽器，
// 但 Android 用 Custom Tabs 導回時會，沒有這個路由檔案就會顯示 expo-router 的 404。
//
// 這裡不能一掛載就馬上導回 Profile tab：導航會讓 Profile 畫面重新掛載，如果那時 isSignedIn
// 還沒被 setActive() 更新完成，重新掛載的 Profile 會先閃一次「未登入」畫面，等 isSignedIn
// 變 true 才又切回登入後的畫面。改成在這裡先等 isSignedIn 真的變 true 再導航，Profile
// 重新掛載時就已經是登入後的狀態，不會閃現。加一個逾時保底，避免 setActive 意外沒完成時
// 卡死在這個空畫面出不去。
//
// 用 router.navigate 而不是 router.replace：從這裡導回 (tabs) 群組時，(tabs) 底下巢狀
// Tabs navigator 的既有狀態（例如「每日刷題」分頁答到一半的題目進度）會被整個重新建立，
// 兩者在這點上其實沒有差別（實測過，換成 navigate 沒有解決）；真正撐住那份進度的是
// context/HomeViewContext.tsx（掛在這支 Stack 之上，不受 (tabs) 重建影響）。這裡維持
// navigate 只是語意上更準確（原本就待在 (tabs) 裡，不是要取代它)。
export default function SSOCallback() {
  const router = useRouter();
  const { isSignedIn } = useAuth();

  useEffect(() => {
    if (isSignedIn) {
      router.navigate('/(tabs)/profile');
      return;
    }
    const timeout = setTimeout(() => router.navigate('/(tabs)/profile'), FALLBACK_TIMEOUT_MS);
    return () => clearTimeout(timeout);
  }, [isSignedIn, router]);

  // 刻意留白、不放 spinner：這個畫面應該只存在幾十毫秒，加上 _layout.tsx 已經關掉
  // header 跟切換動畫，任何內容（連 spinner 都算）反而更容易讓使用者感覺到「閃過一個畫面」。
  // 用不帶裝飾層的 View（不是 ScreenRoot）：星點/光暈/掃描線裝飾層沒有意義掛載又立刻卸載，
  // 反而可能在這個本該無感的畫面上造成一次可見的閃爍。
  return <View style={{ flex: 1 }} />;
}
