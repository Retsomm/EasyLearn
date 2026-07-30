import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Question } from '@easylearn/core';

export type ViewState =
  | { name: 'home' }
  | { name: 'topicbooks'; topicId: string }
  | { name: 'levellist'; chapterId: string }
  | { name: 'quiz'; levelId: string; questions: Question[] }
  | { name: 'mixed'; questions: Question[] };

// Notes tab（精選筆記）自己的畫面狀態機，跟上面 Home tab 的 ViewState 分開存，理由同下方
// notesQuizSession 的註解：兩個分頁的畫面可能同時掛載，不能共用同一份 view 狀態。
export type NotesViewState =
  | { name: 'notes' }
  | { name: 'wrongbook' }
  | { name: 'savedbook' }
  | { name: 'savedkeypoints' }
  | { name: 'review'; questions: Question[] }
  | { name: 'savedpractice'; questions: Question[] };

export type QuizSessionState = {
  index: number;
  selected: string | null;
  correctCount: number;
  xpEarned: number;
  done: boolean;
  finalXp: number;
};

export const DEFAULT_QUIZ_SESSION: QuizSessionState = {
  index: 0,
  selected: null,
  correctCount: 0,
  xpEarned: 0,
  done: false,
  finalXp: 0,
};

type HomeViewContextValue = {
  view: ViewState;
  setView: (view: ViewState) => void;
  // Home tab（每日刷題）目前作答中的關卡／隨機練習進度
  quizSession: QuizSessionState;
  setQuizSession: (updater: QuizSessionState | ((s: QuizSessionState) => QuizSessionState)) => void;
  // Notes tab（精選筆記）的錯題重練／收藏題庫練習進度，跟上面那份分開存，
  // 因為兩個分頁的 Quiz 元件可能同時掛載（Tabs navigator 預設不會 unmount 沒在看的分頁）
  notesQuizSession: QuizSessionState;
  setNotesQuizSession: (updater: QuizSessionState | ((s: QuizSessionState) => QuizSessionState)) => void;
  // Notes tab 目前顯示哪個子畫面（含抽到的題目），理由同上面 view／quizSession 的註解：
  // SSO 登入回跳導致 (tabs) navigator 重建時，這裡才能連同 notesQuizSession 一起把答題進度
  // 對應的畫面（錯題重練／收藏題庫練習）復原，不然 session 本身還在，但畫面已經退回精選筆記首頁，
  // session 等於變成拿不到的孤兒資料。
  notesView: NotesViewState;
  setNotesView: (view: NotesViewState) => void;
};

const HomeViewContext = createContext<HomeViewContextValue | null>(null);

// 掛在 app/_layout.tsx 的 Stack 之上（跟 ProgressContext 同一層），讓「每日刷題」／「精選筆記」
// 畫面切到哪一步、目前這關答到第幾題都不會因為 (tabs) navigator 被外部 deep link（例如 SSO
// 登入回跳）整個重新建立而被清空——(tabs) 底下的巢狀畫面／元件被丟棄重建時，這裡的 state
// 完全不受影響，跟 apps/mobile/hooks/useProgress.ts 裡已完成的關卡／XP 一樣是
// 「終身跨畫面共用」的設計。
export const HomeViewProvider = ({ children }: { children: ReactNode }) => {
  const [view, setView] = useState<ViewState>({ name: 'home' });
  const [quizSession, setQuizSession] = useState<QuizSessionState>(DEFAULT_QUIZ_SESSION);
  const [notesQuizSession, setNotesQuizSession] = useState<QuizSessionState>(DEFAULT_QUIZ_SESSION);
  const [notesView, setNotesView] = useState<NotesViewState>({ name: 'notes' });

  return (
    <HomeViewContext.Provider
      value={{
        view,
        setView,
        quizSession,
        setQuizSession,
        notesQuizSession,
        setNotesQuizSession,
        notesView,
        setNotesView,
      }}>
      {children}
    </HomeViewContext.Provider>
  );
};

export const useHomeView = () => {
  const ctx = useContext(HomeViewContext);
  if (!ctx) throw new Error('useHomeView must be used within a HomeViewProvider');
  return ctx;
};
