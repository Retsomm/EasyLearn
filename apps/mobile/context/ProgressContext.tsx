import { createContext, useContext, type ReactNode } from 'react';
import { useProgressState } from '@/hooks/useProgress';

type ProgressContextValue = ReturnType<typeof useProgressState>;

const ProgressContext = createContext<ProgressContextValue | null>(null);

// 包住整個 app 一次（掛在 app/_layout.tsx 的 ClerkProvider 內側），讓 Home tab（答題寫入進度）
// 跟 Profile tab（顯示統計）共用同一份 progress state。不要在個別畫面各自呼叫 useProgressState()，
// 那樣會變成兩份互不相通的狀態，登入時的搬遷（migrate-local）邏輯也會被重複觸發。
export const ProgressProvider = ({ children }: { children: ReactNode }) => {
  const value = useProgressState();
  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
};

export const useProgress = () => {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used within a ProgressProvider');
  return ctx;
};
