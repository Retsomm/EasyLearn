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
// 這裡不能一掛載就馬上導回 Profile tab：router.replace 會讓 Profile 畫面重新掛載，
// 如果那時 isSignedIn 還沒被 setActive() 更新完成，重新掛載的 Profile 會先閃一次
// 「未登入」畫面，等 isSignedIn 變 true 才又切回登入後的畫面。改成在這裡先等
// isSignedIn 真的變 true 再導航，Profile 重新掛載時就已經是登入後的狀態，不會閃現。
// 加一個逾時保底，避免 setActive 意外沒完成時卡死在這個空畫面出不去。
export default function SSOCallback() {
  const router = useRouter();
  const { isSignedIn } = useAuth();

  useEffect(() => {
    if (isSignedIn) {
      router.replace('/(tabs)/profile');
      return;
    }
    const timeout = setTimeout(() => router.replace('/(tabs)/profile'), FALLBACK_TIMEOUT_MS);
    return () => clearTimeout(timeout);
  }, [isSignedIn, router]);

  // 刻意留白、不放 spinner：這個畫面應該只存在幾十毫秒，加上 _layout.tsx 已經關掉
  // header 跟切換動畫，任何內容（連 spinner 都算）反而更容易讓使用者感覺到「閃過一個畫面」
  return <View style={{ flex: 1 }} />;
}
