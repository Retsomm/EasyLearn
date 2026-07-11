# EasyLearn 開發 Roadmap

> 建立日期：2026-07-11。已完成的基礎：29 關 348 題、PWA 可安裝、XP／連續天數／錯題重練、進度匯出匯入。

## 已完成

### 題池擴充（6 題 → 12 題）✅ 2026-07-11 全數完成
- 29 關全部擴充到 12 題，總計 348 題
- 抽題邏輯已改為整個題池作答（洗牌後依難度排序）
- `scripts/validate-questions.mjs` 全數通過（0 失敗），每題程式碼皆實際執行驗證輸出

## 進行中

（無，下一步請參考「建議的優先順序」）

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

### 2. 更完善的錯題本＋儲存題目本
- 現況：`wrongIds` 只是 `{ questionId: true }`，答對一次就從錯題本移除，沒有任何歷史
- 錯題本強化：
  - [ ] 記錄錯誤次數、最後答錯日期（`{ count, lastWrong }`）
  - [ ] 錯題本瀏覽頁：可以翻看題目與解釋，不用重考才能看
  - [ ] 間隔重複（spaced repetition）：答對不要立刻移除，改成 Leitner 盒制
        （答對升級、答錯降回，最高級才畢業），避免「碰巧對一次就消失」
- 儲存題目本（收藏）：
  - [ ] 答題時可加書籤（星號），存 `savedIds`
  - [ ] 收藏瀏覽頁，可從收藏直接重練
- [ ] 進度資料結構升級時做 migration（現在 `load()` 只有 shallow merge，
      巢狀新欄位如 `streak` 內加東西會拿不到預設值）

### 3. 經驗值成長可視化
- 現況：XP 只存一個總數，**沒有歷史紀錄——無法回溯**，這個先做資料層越早越好
- [ ] 先開始記每日 XP log：`xpLog: { 'YYYY-MM-DD': number }`（答題就累計，UI 之後再做）
- [ ] 等級制：XP 換算等級與稱號，Home 顯示等級進度條
- [ ] 每週長條圖／月曆 heatmap（GitHub style）呈現學習量
- [ ] 各章節掌握度：以最佳成績算每章正確率，雷達圖或進度條

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
2. XP 每日 log 的**資料層**（不做 UI 也要先記，資料無法回溯）
3. 錯題本強化＋收藏（純前端就能做，不用等後端）
4. ~~題目 schema 驗證 script~~（已完成：`scripts/validate-questions.mjs`）
5. XP 可視化 UI（等 log 累積幾天資料）
6. Clerk ＋雲端同步（工程最大，牽涉後端選型，放在功能穩定後）
