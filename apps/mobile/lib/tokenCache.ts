import * as SecureStore from 'expo-secure-store'
import type { TokenCache } from '@clerk/expo'

// Clerk session token 存進裝置的 Keychain/Keystore（expo-secure-store），
// 讓使用者重開 App 不用重新登入
export const tokenCache: TokenCache = {
  getToken: (key) => SecureStore.getItemAsync(key).catch(() => null),
  saveToken: (key, value) => SecureStore.setItemAsync(key, value).catch(() => {}),
}
