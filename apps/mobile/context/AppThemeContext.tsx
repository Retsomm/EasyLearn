import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@clerk/expo';
import {
  DEFAULT_THEME_ID,
  THEME_PALETTES,
  THEME_STYLES,
  isValidThemeId,
  type ColorPalette,
  type ThemeId,
  type ThemeStyle,
} from '@/constants/themePalettes';
import { request } from '@/lib/api';

const STORAGE_KEY = 'easylearn-theme-v1';

interface AppThemeContextValue {
  themeId: ThemeId;
  colors: ColorPalette;
  style: ThemeStyle;
  setThemeId: (id: ThemeId) => void;
}

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

const loadLocal = async (): Promise<ThemeId> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw && isValidThemeId(raw) ? raw : DEFAULT_THEME_ID;
  } catch {
    return DEFAULT_THEME_ID;
  }
};

// Phase 7：跟 apps/web 的 src/hooks/useTheme.ts 同一套雙模式邏輯——未登入存 AsyncStorage，
// 登入打既有的 /api/theme（跟 apps/web 共用同一支後端），伺服器資料為準；第一次登入時，若
// 資料庫還是預設值、但本機已經手動選過別的主題，視為訪客模式時設定的偏好，同步上去一次。
// 要包在 context/ProgressContext.tsx 之外、app/_layout.tsx 的 ClerkProvider 之內，讓全站共用
// 同一份主題 state，不要在個別畫面各自呼叫。
export const AppThemeProvider = ({ children }: { children: ReactNode }) => {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const [themeId, setThemeIdState] = useState<ThemeId>(DEFAULT_THEME_ID);
  const [hydrated, setHydrated] = useState(false);
  const syncedRef = useRef(false);
  const signOutResetRef = useRef(false);
  const pendingThemeSaveRef = useRef<ThemeId | null>(null);
  const savingThemeRef = useRef(false);
  const mutationGenerationRef = useRef(0);

  useEffect(() => {
    (async () => {
      setThemeIdState(await loadLocal());
      setHydrated(true);
    })();
  }, []);

  // 登入狀態切換：登入時去資料庫拿主題設定；登出則換回讀本機 AsyncStorage。這個 effect
  // 要排在下面的訪客持久化 effect 之前宣告，確保同一次 commit 裡登出分支先把
  // signOutResetRef 設成 true，訪客持久化 effect 才不會用還沒切換過來的舊 themeId 誤寫回本機
  useEffect(() => {
    if (!isLoaded || !hydrated) return;
    if (!isSignedIn) {
      syncedRef.current = false;
      signOutResetRef.current = true;
      pendingThemeSaveRef.current = null;
      loadLocal().then((local) => {
        setThemeIdState(local);
        signOutResetRef.current = false;
      });
      return;
    }
    if (syncedRef.current) return;
    let cancelled = false;
    const generation = mutationGenerationRef.current;
    (async () => {
      try {
        const token = await getToken();
        const data = await request<{ theme?: string }>('/api/theme', { token });
        const remoteTheme = data.theme && isValidThemeId(data.theme) ? data.theme : DEFAULT_THEME_ID;
        const localTheme = await loadLocal();
        let resolved: ThemeId = remoteTheme;
        if (remoteTheme === DEFAULT_THEME_ID && localTheme !== DEFAULT_THEME_ID) {
          if (cancelled || generation !== mutationGenerationRef.current) return;
          const posted = await request<{ theme?: string }>('/api/theme', {
            method: 'POST',
            body: { theme: localTheme },
            token,
          });
          resolved = posted.theme && isValidThemeId(posted.theme) ? posted.theme : DEFAULT_THEME_ID;
        }
        if (cancelled || generation !== mutationGenerationRef.current) return;
        setThemeIdState(resolved);
        syncedRef.current = true;
      } catch (err) {
        if (!cancelled) console.error('theme load/sync failed', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, hydrated, getToken]);

  // 訪客模式：主題變動就寫回 AsyncStorage。登出瞬間 themeId 可能還是登入時的舊值（上面
  // 登出分支的 loadLocal() 還沒 resolve），這段期間跳過寫入，避免把登入時的主題誤寫回本機、
  // 蓋掉訪客真正的本機偏好
  useEffect(() => {
    if (!hydrated || isSignedIn || signOutResetRef.current) return;
    AsyncStorage.setItem(STORAGE_KEY, themeId).catch(() => {});
  }, [themeId, isSignedIn, hydrated]);

  // 存檔請求一次只送一個，快速連續切換主題時只保留最後一個待存的值，等目前這個請求落地後
  // 才送下一個——避免多個 POST 同時飛在外面，因為網路延遲不保證誰先送誰先到，先送的
  // 舊選擇可能反而晚到，把伺服器上的主題蓋回舊值
  const flushThemeSave = (token: string | null) => {
    if (savingThemeRef.current) return;
    const next = pendingThemeSaveRef.current;
    if (next === null) return;
    pendingThemeSaveRef.current = null;
    savingThemeRef.current = true;
    request('/api/theme', { method: 'POST', body: { theme: next }, token })
      .catch((err) => console.error('theme save failed', err))
      .finally(() => {
        savingThemeRef.current = false;
        if (pendingThemeSaveRef.current !== null) {
          getToken()
            .then(flushThemeSave)
            .catch((err) => console.error('theme save failed', err));
        }
      });
  };

  const setThemeId = (next: ThemeId) => {
    if (!isValidThemeId(next)) return;
    mutationGenerationRef.current += 1;
    setThemeIdState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
    if (isSignedIn) {
      pendingThemeSaveRef.current = next;
      getToken()
        .then(flushThemeSave)
        .catch((err) => console.error('theme save failed', err));
    }
  };

  return (
    <AppThemeContext.Provider
      value={{ themeId, colors: THEME_PALETTES[themeId], style: THEME_STYLES[themeId], setThemeId }}
    >
      {children}
    </AppThemeContext.Provider>
  );
};

export const useAppTheme = () => {
  const ctx = useContext(AppThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used within an AppThemeProvider');
  return ctx;
};
