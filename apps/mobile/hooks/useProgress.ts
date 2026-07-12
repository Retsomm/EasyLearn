import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  bumpCounter,
  bumpStreak,
  bumpXpLog,
  GRADUATE_BOX,
  todayStr,
  type Progress,
  type WrongEntryMeta,
} from '@easylearn/core';

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

// Phase 3：只做訪客模式（AsyncStorage），不接 Clerk 同步——那是 Phase 4 的範圍。
// AsyncStorage 是非同步 API，跟 web 版 localStorage 同步讀取不同，多一個 hydrated flag
// 讓呼叫端知道「本機資料讀取完成前」不要顯示或覆寫進度。
export const useProgress = () => {
  const [progress, setProgress] = useState(defaultProgress);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const data = JSON.parse(raw);
          setProgress({ ...defaultProgress, ...data, wrongIds: migrateWrongIds(data.wrongIds) });
        }
      } catch {
        // 讀取失敗（資料損毀等）就維持 defaultProgress
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress)).catch(() => {});
  }, [progress, hydrated]);

  const answerQuestion = useCallback((questionId: string, correct: boolean, chapterId?: string) => {
    setProgress((p) => {
      const wrongIds = { ...p.wrongIds };
      const entry = wrongIds[questionId];
      if (correct) {
        if (entry) {
          const box = entry.box + 1;
          if (box > GRADUATE_BOX) delete wrongIds[questionId];
          else wrongIds[questionId] = { ...entry, box };
        }
      } else {
        wrongIds[questionId] = {
          count: (entry?.count ?? 0) + 1,
          lastWrong: todayStr(),
          box: 1,
        };
      }
      const dailyStats = bumpCounter(p.dailyStats, todayStr(), correct);
      const chapterStats = chapterId ? bumpCounter(p.chapterStats, chapterId, correct) : p.chapterStats;
      return { ...p, wrongIds, dailyStats, chapterStats };
    });
  }, []);

  const toggleSaved = useCallback((questionId: string) => {
    setProgress((p) => {
      const savedIds = { ...p.savedIds };
      if (savedIds[questionId]) delete savedIds[questionId];
      else savedIds[questionId] = true;
      return { ...p, savedIds };
    });
  }, []);

  const finishLevel = useCallback((levelId: string, correct: number, total: number, xpEarned: number) => {
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
  }, []);

  const finishReview = useCallback((xpEarned: number) => {
    setProgress((p) => ({
      ...p,
      xp: p.xp + xpEarned,
      streak: bumpStreak(p.streak),
      xpLog: bumpXpLog(p.xpLog, xpEarned),
    }));
  }, []);

  return { progress, hydrated, answerQuestion, toggleSaved, finishLevel, finishReview };
};
