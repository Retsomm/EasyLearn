import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@clerk/expo';
import {
  applyAnswer,
  bumpStreak,
  bumpXpLog,
  todayStr,
  type Progress,
  type WrongEntryMeta,
} from '@easylearn/core';
import { request } from '@/lib/api';

const STORAGE_KEY = 'easylearn-progress-v1';

const defaultProgress: Progress = {
  xp: 0,
  completedLevels: {},
  wrongIds: {},
  savedIds: {},
  streak: { count: 0, last: null },
  xpLog: {},
  dailyStats: {},
  chapterStats: {},
};

// 舊版 wrongIds 是 { [id]: true }，升級成 Leitner 盒物件（沿用 apps/web 的遷移邏輯）
const migrateWrongIds = (
  wrongIds: Record<string, true | WrongEntryMeta> | undefined,
): Record<string, WrongEntryMeta> =>
  Object.fromEntries(
    Object.entries(wrongIds ?? {}).map(([id, entry]) => [
      id,
      entry === true ? { count: 1, lastWrong: null, box: 1 } : entry,
    ]),
  );

const loadLocal = async (): Promise<Progress> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProgress;
    const data = JSON.parse(raw);
    return { ...defaultProgress, ...data, wrongIds: migrateWrongIds(data.wrongIds) };
  } catch {
    return defaultProgress;
  }
};

// 已登入時打的 API 都回傳伺服器組好的權威 Progress，直接拿來覆蓋樂觀更新的本地 state（跟 apps/web 同一套作法）
const postJson = async (path: string, body: unknown, token: string | null): Promise<Progress> => {
  const data = await request<{ progress: Progress }>(path, { method: 'POST', body, token });
  return data.progress;
};

// Phase 4：接上 Clerk，跟 apps/web 的 src/hooks/useProgress.ts 同一套雙模式邏輯——
// 未登入沿用 Phase 3 的 AsyncStorage 訪客模式；已登入時打 apps/web 既有的 API，伺服器回傳的
// 權威 Progress 直接覆蓋本地樂觀更新。這個 hook 要被 context/ProgressContext.tsx 的
// ProgressProvider 包成單一實例讓所有 tab 共用，不要在每個畫面各自呼叫，否則會變成互不相通的
// 兩份 state，且登入搬遷（migrate-local）邏輯會被重複觸發。
export const useProgressState = () => {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const [progress, setProgress] = useState(defaultProgress);
  const [hydrated, setHydrated] = useState(false);
  const migratedRef = useRef(false);
  // 搬遷時要送目前畫面上看到的這份 progress，不要另外去讀 AsyncStorage：寫入 AsyncStorage 是
  // fire-and-forget 的非同步操作（見下面的寫回 effect），登入瞬間最後一次寫入可能還沒落盤，
  // 這時如果重新讀 AsyncStorage 可能讀到舊值甚至空值，把還沒作答的空進度誤搬上雲端。
  const progressRef = useRef(progress);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    (async () => {
      setProgress(await loadLocal());
      setHydrated(true);
    })();
  }, []);

  // 訪客模式：任何 progress 變動都寫回 AsyncStorage，等 hydrated 才開始寫，避免搶在初始讀取完成前
  // 把儲存空間洗成預設值
  useEffect(() => {
    if (!hydrated) return;
    if (!isSignedIn) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress)).catch(() => {});
  }, [progress, isSignedIn, hydrated]);

  // 登入狀態切換：登入時去讀資料庫（第一次登入且資料庫是空的，就把訪客進度搬過去）；登出則換回
  // 讀本機 AsyncStorage。刻意等 hydrated 才判斷：AsyncStorage 讀取是非同步的，跟這裡的網路請求
  // 誰先完成不保證，沒有這道 guard 可能會先拿到伺服器資料、又被稍後才完成的本地讀取蓋掉。
  //
  // 這是「終身只搬一次」的設計：isNew 只要曾經翻成 false 就永遠是 false，之後登入一律以伺服器
  // 資料為準，不會再把裝置端新增的訪客進度併回去。反覆登出/登入不會觸發第二次搬遷，這是刻意的，
  // 不是 bug——見 docs/rn-migration.md Phase 4 的除錯記錄。
  useEffect(() => {
    if (!isLoaded || !hydrated) return;
    if (!isSignedIn) {
      migratedRef.current = false;
      loadLocal().then(setProgress);
      return;
    }
    if (migratedRef.current) return;
    (async () => {
      try {
        const token = await getToken();
        const data = await request<{ progress: Progress; isNew: boolean }>('/api/progress', { token });
        if (data.isNew) {
          setProgress(await postJson('/api/progress/migrate-local', progressRef.current, token));
        } else {
          setProgress(data.progress);
        }
        // 只有成功載入／搬遷完才標記完成；失敗的話留著讓下一次觸發還能重試
        migratedRef.current = true;
      } catch (err) {
        console.error('progress load/migration failed', err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn, hydrated]);

  const answerQuestion = useCallback(
    (questionId: string, correct: boolean, chapterId?: string) => {
      setProgress((p) => applyAnswer(p, questionId, correct, chapterId));

      if (isSignedIn) {
        getToken()
          .then((token) =>
            postJson('/api/progress/answer', { questionId, correct, chapterId, today: todayStr() }, token),
          )
          .then(setProgress)
          .catch((err) => console.error('answerQuestion sync failed', err));
      }
    },
    [isSignedIn, getToken],
  );

  const toggleSaved = useCallback(
    (questionId: string) => {
      setProgress((p) => {
        const savedIds = { ...p.savedIds };
        if (savedIds[questionId]) delete savedIds[questionId];
        else savedIds[questionId] = true;
        return { ...p, savedIds };
      });

      if (isSignedIn) {
        getToken()
          .then((token) => postJson('/api/progress/save-toggle', { questionId }, token))
          .then(setProgress)
          .catch((err) => console.error('toggleSaved sync failed', err));
      }
    },
    [isSignedIn, getToken],
  );

  const finishLevel = useCallback(
    (levelId: string, correct: number, total: number, xpEarned: number) => {
      setProgress((p) => {
        const prev = p.completedLevels[levelId];
        return {
          ...p,
          xp: p.xp + xpEarned,
          streak: bumpStreak(p.streak),
          xpLog: bumpXpLog(p.xpLog, xpEarned),
          completedLevels: {
            ...p.completedLevels,
            [levelId]: { best: Math.max(prev?.best ?? 0, correct), total },
          },
        };
      });

      if (isSignedIn) {
        getToken()
          .then((token) =>
            postJson(
              '/api/progress/finish-level',
              { levelId, correct, total, xpEarned, today: todayStr() },
              token,
            ),
          )
          .then(setProgress)
          .catch((err) => console.error('finishLevel sync failed', err));
      }
    },
    [isSignedIn, getToken],
  );

  // 錯題重練結束：只加 XP 和 streak，不動關卡紀錄
  const finishReview = useCallback(
    (xpEarned: number) => {
      setProgress((p) => ({
        ...p,
        xp: p.xp + xpEarned,
        streak: bumpStreak(p.streak),
        xpLog: bumpXpLog(p.xpLog, xpEarned),
      }));

      if (isSignedIn) {
        getToken()
          .then((token) => postJson('/api/progress/finish-review', { xpEarned, today: todayStr() }, token))
          .then(setProgress)
          .catch((err) => console.error('finishReview sync failed', err));
      }
    },
    [isSignedIn, getToken],
  );

  return { progress, hydrated, answerQuestion, toggleSaved, finishLevel, finishReview };
};
