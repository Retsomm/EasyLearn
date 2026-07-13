# EasyLearn 開發 Roadmap

> 建立日期：2026-07-11。2026-07-13 更新：專案已重構成 Yarn workspaces monorepo
> （`apps/web` Next.js＋`apps/mobile` Expo RN＋`packages/core` 共用純函式），並新增 React Native App。
> 這份文件是功能規劃與優先順序的總覽；**monorepo／RN 遷移本身逐 phase 的細節、驗證方式、關鍵檔案，
> 以 [docs/rn-migration.md](rn-migration.md) 為準**（那份文件明確標註是跨對話的進度來源，這份不重複記錄）。

## 已完成

### 題池擴充（6 題 → 12 題）✅ 2026-07-11 全數完成
- 29 關全部擴充到 12 題，總計 348 題
- 抽題邏輯已改為整個題池作答（洗牌後依難度排序）
- `scripts/validate-questions.mjs` 全數通過（0 失敗），每題程式碼皆實際執行驗證輸出

### XP 每日 log 資料層 ✅ 2026-07-11
- `useProgress` 新增 `xpLog: { 'YYYY-MM-DD': number }`，`finishLevel`／`finishReview` 都會累加當日 XP

### 更完善的錯題本＋儲存題目本 ✅ 2026-07-11
- 錯題本改成 Leitner 盒制：`wrongIds[id] = { count, lastWrong, box }`，超過 `GRADUATE_BOX`（=3）才畢業移出
- 新增收藏：`savedIds`＋`toggleSaved()`，兩個瀏覽頁（`QuestionBook.jsx`，`kind="wrong"|"saved"`）

### 網頁版導覽改版＋學習數據視覺化 ✅ 2026-07-11
- 頂部橫向 navbar（4 分頁：每日刷題／精選筆記／學習數據／個人資料），Home 重構（連續學習卡／統計卡／隨機綜合練習），
  「精選筆記」「學習數據」（近 7 日雙圖＋分科正確率）兩個新頁面

### 經驗值成長可視化 ✅ 2026-07-11
- 不做獨立等級稱號系統，改擴充 `Mascot.tsx`：`STAGES` 改成「行星的成長史」12 階段（0～7000 XP）
- Stats 頁新增近半年學習熱力圖（GitHub style，26 週×7 天，dataviz skill 驗證過色階）

### Clerk 登入 ＋ 雲端同步（web） ✅ 2026-07-11
- Google 登入、可編輯頭像／名稱、成長史預覽，**使用者已在本地實測登入/登出/頭像上傳/名稱編輯皆成功**
- 進度儲存後端定案：PostgreSQL（Supabase 代管）透過 Prisma，正規化關聯表，已登入時完全以資料庫為主，
  未登入沿用 localStorage，首次登入把本地進度搬上雲端（`POST /api/progress/migrate-local`）
- **Supabase 連線與 Prisma migration 已對真實專案跑成功**（7 張表建好），Clerk secret key 也已填入生效

### Yarn workspaces monorepo 重構 ✅ 2026-07-12
- `apps/web`（原本整包 Next.js 專案）＋ `packages/core`（`@easylearn/core`，題庫資料／`quiz.ts`／
  `progressCalc.ts` 等 web/mobile 共用純函式）
- `apps/web` 三項驗證（typecheck/lint/build）全過，已 commit＋push 到 `origin/dev`

### 2026-07-12 code review 修復回合 ✅
- 修掉題庫「正解永遠是選項 a」的系統性缺陷（QuestionCard 改成渲染時洗牌選項）
- API routes 併發／驗證/資料一致性修正、`packages/core` 新增共用 `applyAnswer()`、
  全專案內部 import 統一改用 `@/` alias

## 進行中

### Expo RN App（`apps/mobile`）—— 詳細進度見 [docs/rn-migration.md](rn-migration.md)
Monorepo 重構的直接後續，讓 EasyLearn 除了 PWA 之外也有原生 App。四個 tab（home/notes/stats/profile）
對照網頁版 navbar 的四個分頁。

- [x] **Phase 0-1**：monorepo 骨架＋題庫資料/計算純函式搬進 `packages/core`（已 commit＋push）
- [x] **Phase 2**：`apps/mobile` bootstrap（Expo Router）、`@clerk/expo` 登入接線、唯讀 Profile tab。
      真機測過「mobile 帶 Clerk session Bearer token 打 `apps/web` API」這個全計畫最關鍵的假設，成功。
- [x] **Phase 3**：Home tab 訪客模式（AsyncStorage）＋離線完整答題流程，真機測過持久化有效
- [x] **Phase 4**：完整登入同步迴圈——`useProgress.ts` 接上 Clerk，串起五支 API；新增
      `ProgressProvider` context 讓 Home／Profile 兩個 tab 共用同一份進度。**程式碼已完成，
      這個環境能檢查的（tsc/expo-doctor/expo export）都過了，但尚未真機驗證**，見
      [docs/rn-migration.md](rn-migration.md) 詳細記錄，還沒 commit
- [ ] **Phase 5**：剩餘畫面（Notes/QuestionBook、Stats、review/mixed/saved practice）
- [ ] **Phase 6**：頭像拖曳／縮放／改名（最高複雜度的 native gesture，刻意排最後）
- [ ] **Phase 7**（視是否加其他 OAuth 才需要）：Clerk native SSO redirect 的 Dashboard 設定

## 規劃中的大功能

### 全真模考
- navbar（web／mobile 皆同）目前**沒有 UI 佔位**，要做的話得先決定放哪（新增第 5 個分頁，或掛在
  某個現有分頁底下），web／mobile 是否同時做也要先定
- 需求雛形（參考使用者提供的設計圖）：綜合科全真模擬考（跨章節混合出題＋計時）＋分科模擬考試（每科出題＋計時）
- 待確認：計時＋強制交卷邏輯、題數與時限、是否要獨立的結算／答題紀錄畫面
- 跟 RN 遷移是獨立的兩條線，不衝突，但建議等 RN 遷移 Phase 4-5 告一段落（web/mobile 進度同步邏輯穩定）
  後再開工，避免兩邊都要重寫一次資料層

## 其他優化建議（依價值排序）

### 資料與品質
- [x] **題目 JSON schema 驗證 script**：`scripts/validate-questions.mjs`
- [ ] **quiz utils 單元測試**：shuffle、sampleQuestions、bumpStreak（跨日邏輯），純函式現在都在
      `packages/core`，用 Vitest 很快就能蓋到，且 web/mobile 共用一份測試
- [ ] PWA 版本更新提示：部署新版後舊使用者停在快取版，加「有新版本，點擊更新」toast（web only）

### 學習體驗
- [ ] 結算畫面顯示「本關哪幾題錯」＋直接看解釋，不用進錯題本
- [ ] 每日目標：例如「今天完成 1 關」，配合 streak 給提示
- [ ] 答題音效／震動回饋（Vibration API / RN Haptics），mobile 手感加分
- [ ] 皮皮（吉祥物）反應多樣化：連對 combo、破紀錄時有不同表情

### 技術體質
- [ ] apps/web bundle 偏大，查一下是誰貢獻的（懷疑 code highlight 相關），可 lazy load 或換輕量方案
- [ ] 無障礙：按鈕 aria-label、鍵盤作答（web）

## 建議的優先順序

1. ~~題池擴充剩餘 27 關~~（已完成，2026-07-11）
2. ~~XP 每日 log 的**資料層**~~（已完成，2026-07-11）
3. ~~錯題本強化＋收藏~~（已完成，2026-07-11）
4. ~~題目 schema 驗證 script~~（已完成：`scripts/validate-questions.mjs`）
5. ~~網頁版導覽改版＋學習數據視覺化~~（已完成，2026-07-11）
6. ~~等級稱號＋月曆 heatmap~~（已完成，2026-07-11）
7. ~~Clerk ＋雲端同步（web）~~（已完成，2026-07-11：使用者已實測登入/登出/資料庫讀寫）
8. ~~Yarn workspaces monorepo 重構~~（已完成，2026-07-12）
9. ~~RN 遷移 Phase 4：登入同步迴圈~~（程式碼完成，2026-07-13：待使用者真機驗證後才 commit，
   見 [docs/rn-migration.md](rn-migration.md)）
10. RN 遷移 Phase 5-7：剩餘畫面／頭像手勢／native SSO 設定（下一步）
11. 全真模考（web／mobile UI 位置未定，建議等 RN 遷移主線穩定後再排）
