# EasyLearn 開發 Roadmap

> 建立日期：2026-07-11。已完成的基礎：29 關 348 題、PWA 可安裝、XP／連續天數／錯題重練、進度匯出匯入。

## 已完成

### 題池擴充（6 題 → 12 題）✅ 2026-07-11 全數完成
- 29 關全部擴充到 12 題，總計 348 題
- 抽題邏輯已改為整個題池作答（洗牌後依難度排序）
- `scripts/validate-questions.mjs` 全數通過（0 失敗），每題程式碼皆實際執行驗證輸出

## 進行中

（無，下一步請參考「建議的優先順序」）

### XP 每日 log 資料層 ✅ 2026-07-11
- `useProgress` 新增 `xpLog: { 'YYYY-MM-DD': number }`，`finishLevel`／`finishReview` 都會累加當日 XP
- 純新增頂層欄位，`load()` 現有的 shallow merge 已足夠處理舊資料相容，無需額外 migration
- 尚未做 UI（等級進度條、長條圖／heatmap），資料已開始累積

### 更完善的錯題本＋儲存題目本 ✅ 2026-07-11
- 錯題本改成 Leitner 盒制：`wrongIds[id] = { count, lastWrong, box }`，答錯重置回第 1 盒、答對升一盒，
  超過 `GRADUATE_BOX`（=3）才真正畢業移出錯題本，不再是「碰巧對一次就消失」
- 舊資料相容：`wrongIds` 舊格式是 `{ id: true }`，新增 `migrateWrongIds()` 在 `load()`／`importProgress()`
  時把 boolean 轉成盒制物件——這是第一個需要真正 migration（非 shallow merge 就夠）的欄位變更
- 新增收藏：`savedIds: { id: true }` ＋ `toggleSaved()`，答題卡片右上角星號可收藏
- 新增兩個瀏覽頁（`src/screens/QuestionBook.jsx` 共用元件，`kind="wrong"|"saved"`）：
  不用重考就能翻看題目、正解、解釋；錯題本頁另外顯示答錯次數／熟練度／最近答錯日期，並可直接「開始重練」
  - Home 新增「錯題本 (n)」「收藏 (n)」文字連結
- 共用元件抽出：`TYPE_META` 移到 `src/data/typeMeta.js`（原本卡死在 QuestionCard.jsx 裡）；
  唯讀題目卡抽成 `src/components/QuestionReview.jsx`，答題中的 `QuestionCard` 與瀏覽頁共用同一份題型／星號 UI
- 已用 Playwright（透過系統 Chrome，非 playwright 內建瀏覽器）跑過完整互動流程驗證：收藏／取消收藏即時反映列表、
  錯題本熟練度正確累加、重練時「畢業的錯題」數字正確（例如 box=1 的錯題重練答對一次只會變成 box=2，不會畢業），
  全程 console 無錯誤

### 網頁版導覽改版＋學習數據視覺化 ✅ 2026-07-11
- 首頁改版：頂部改成網頁版橫向 navbar（`src/components/Navbar.jsx`，4 分頁：每日刷題／精選筆記／學習數據／個人資料）。
  原本先留了「全真模考」disabled 佔位分頁，同一天使用者直接要求移除、換成「個人資料」頁
  （`src/screens/Profile.jsx`：吉祥物＋總 XP／連續學習／完成關卡／累計答題統計格，
  原本在 Home 的匯出／匯入進度也搬過來這裡）——所以 navbar 現在 4 個分頁都是可動的，沒有 disabled 項目
- Home 重構：連續學習天數卡（含本週 7 天 pill，標記已練習的日期）、今日正確率／今日已做兩張統計卡、
  新增「隨機綜合練習（10 題）」跨章節抽題按鈕（`Quiz` 新增 `mode="mixed"`，沿用 `finishReview` 不動 `completedLevels`）、
  章節清單從原本獨立的「選擇章節」畫面搬到首頁直接顯示（`ChapterMap.jsx` 簡化成只負責單一章節的關卡清單）
- 新增「精選筆記」頁（`src/screens/Notes.jsx`）：把原本首頁的錯題本／收藏文字連結，改成兩張大卡片
  （點卡片進原本的 `QuestionBook` 列表，卡片按鈕直接開始複習／練習）；收藏題庫新增「開始練習」
  （沿用 `mode="mixed"` 引擎，抽的是收藏的題目而非跨章節隨機）
- 新增「學習數據」頁（`src/screens/Stats.jsx`）：總答題數／平均正確率／累計答對題數統計卡、
  近 7 日做題量＋正確率雙迷你長條圖、分科正確率細分。資料層新增 `useProgress` 的 `dailyStats`／`chapterStats`
  （純新增頂層欄位，沿用既有 shallow merge，無需 migration），`chapters.js` 新增 `getChapterIdForQuestion()`
  查表供 `Quiz.jsx` 答題時回報章節
- 圖表配色用 dataviz skill 的 `validate_palette.js` 驗證過（`#2f9e6b` 正確率／`#7c86ff` 做題量，
  dark mode 明度帶＋CVD 分離度皆 PASS），且遵守「一軸」原則拆成兩個獨立迷你圖，不做雙 Y 軸疊圖
- 已用 Playwright（系統 Chrome）跑過完整互動驗證：答題→首頁統計即時更新→精選筆記數字同步→
  學習數據圖表跟分科正確率正確反映，全程 console 無錯誤

## 規劃中的大功能

### 1. Clerk 登入
- 目標：使用者登入後進度跨裝置同步
- **前置認知**：Clerk 只管身分，不存 app 資料。進度目前只在 localStorage，
  需要搭配一個後端存進度（候選：Supabase / Convex / Firebase，或小量資料塞 Clerk user metadata）
- 為什麼重要：iOS Safari 的 ITP 可能在 7 天不使用後清掉 localStorage，
  PWA 使用者的進度有無預警消失的風險——雲端同步不只是方便，是資料安全
- 步驟拆解：
  - [ ] 選定進度儲存後端
  - [ ] Clerk 接入（登入／登出 UI、匿名試玩不強制登入）
  - [ ] 進度同步策略：本地優先、背景上傳、衝突時取較高值（XP、best 取 max）
  - [ ] 首次登入時把 localStorage 進度搬上雲端

### 2. 經驗值成長可視化
- 現況：`xpLog: { 'YYYY-MM-DD': number }` 資料層已完成；近 7 日做題量／正確率雙圖、分科正確率已在
  「學習數據」頁做出來了（見上方「已完成」）
- [ ] 等級制：XP 換算等級與稱號，Home 顯示等級進度條（目前只有吉祥物 4 階段進化，沒有正式等級稱號）
- [ ] 月曆 heatmap（GitHub style）呈現更長期的學習量，目前只有近 7 日

### 3. 全真模考
- 2026-07-11：navbar 原本預留的 disabled 分頁已移除，換成「個人資料」頁（見上方「已完成」）。
  這個功能目前**沒有 UI 佔位**，之後要做的話要先決定放在哪個分頁（新增第 5 個 navbar 項目，
  或掛在某個現有分頁底下）
- 需求雛形（參考使用者提供的設計圖）：綜合科全真模擬考（跨章節混合出題＋計時）＋分科模擬考試（每科出題＋計時）
- 待確認：計時＋強制交卷邏輯、题數與時限、是否要獨立的結算／答題紀錄畫面

## 其他優化建議（依價值排序）

### 資料與品質
- [x] **題目 JSON schema 驗證 script**：`scripts/validate-questions.mjs`，實際執行每題程式碼比對輸出，
      建議未來加進 build 前自動跑（目前需手動 `node scripts/validate-questions.mjs`）
- [ ] **quiz utils 單元測試**：shuffle、sampleQuestions、bumpStreak（跨日邏輯）
      都是純函式，用 Vitest 很快就能蓋到
- [ ] PWA 版本更新提示：部署新版後舊使用者停在快取版，加「有新版本，點擊更新」toast

### 學習體驗
- [ ] 結算畫面顯示「本關哪幾題錯」＋直接看解釋，不用進錯題本
- [ ] 每日目標：例如「今天完成 1 關」，配合 streak 給提示
- [ ] 答題音效／震動回饋（Vibration API），PWA 手感加分
- [ ] 皮皮（吉祥物）反應多樣化：連對 combo、破紀錄時有不同表情

### 技術體質
- [ ] Bundle 432 KB 偏大，查一下是誰貢獻的（懷疑 code highlight 相關），
      可 lazy load 或換輕量方案
- [ ] 無障礙：按鈕 aria-label、鍵盤作答

## 建議的優先順序

1. ~~題池擴充剩餘 27 關~~（已完成，2026-07-11）
2. ~~XP 每日 log 的**資料層**~~（已完成，2026-07-11）
3. ~~錯題本強化＋收藏~~（已完成，2026-07-11）
4. ~~題目 schema 驗證 script~~（已完成：`scripts/validate-questions.mjs`）
5. ~~網頁版導覽改版＋學習數據視覺化~~（已完成，2026-07-11：navbar／首頁重構／精選筆記頁／學習數據頁）
6. 全真模考（navbar 已預留 disabled 分頁，實作優先度看使用者需求）
7. 等級稱號＋月曆 heatmap（經驗值可視化的剩餘部分）
8. Clerk ＋雲端同步（工程最大，牽涉後端選型，放在功能穩定後）
