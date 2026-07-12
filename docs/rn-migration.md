# PWA → Expo RN 遷移進度追蹤

這份文件是這次「網頁版重構成 monorepo + 新增 React Native App」工作的**跨對話進度來源**，每個 phase 完成或有重大決策/修正時要更新這份文件（不是只存在 Claude 的 plan 檔或 memory 裡）。

完整計畫（含每個 phase 的細節、驗證方式、關鍵檔案）在使用者本機：
`~/.claude/plans/pwa-my-agent-encapsulated-hejlsberg.md`
（這份不在 git 裡、不會跨機器同步；下面的摘要足以在只有這份文件的情況下接續工作）

## 架構決策（已確認，不要重新討論）

1. **Monorepo 結構**：`apps/web`（Next.js，含 API routes/Prisma）＋ `apps/mobile`（Expo RN，尚未建立）＋ `packages/core`（web/mobile 共用的純資料與純函式，`@easylearn/core`）。
   - 2026-07-12 曾經一度誤解成「Next.js 留在根目錄＋新增 mobile/ 子資料夾」（仿照使用者另一個專案 SelfMap-main 的扁平結構），使用者已明確確認**維持** `apps/*` + `packages/*` 這個較完整的三層結構，不要改回扁平結構。
2. **Auth**：延用 Clerk。web 端 `@clerk/nextjs`（不變）；mobile 端未來用 `@clerk/expo`（注意套件名稱，不是 `@clerk/clerk-expo`）。頭像儲存仍在 Clerk（`user.setProfileImage()` / `user.unsafeMetadata.avatarPosition`），不搬去 Supabase Storage。
3. **Yarn 版本**：這個 repo 是 Yarn 1.22（classic），不是 Berry。workspace 內部依賴要寫 `"*"`，**不能**寫 `"workspace:*"`（那是 Berry/npm/pnpm 的語法，Yarn 1 會直接失敗）。

## 執行過程中發現、跟原計畫不同的事實

- `apps/web/src/proxy.ts` 其實就是 **Next.js 16 把 `middleware.ts` 改名後的新慣例檔名**（`next/dist/lib/constants.js` 裡 `PROXY_FILENAME = 'proxy'`）。裡面已經在跑 `clerkMiddleware()`，`matcher` 涵蓋所有 `/api` 路由。原本規劃階段的探索誤判成「這個專案沒有 middleware」，但最後「mobile 端帶 Bearer token 打 API 應該不用改 web 端程式碼」這個結論方向還是對的——只是理由要修正成「middleware 本來就已經涵蓋全部路由，`auth()` 應該能同時吃 cookie 和 Bearer header」，不是「完全沒有 middleware 擋著」。**這仍然是 Phase 2 最關鍵、必須真機實測的假設，還沒驗證過。**
- 把 `IconName` 型別從 `Icons.tsx` 反轉搬進 `packages/core/src/types.ts` 時，`PATHS` 物件實際的 key 數量比預期多（最終 29 個），過程中連續兩次用簡單 grep 漏抓（`chevron-right`、以及混用引號/不引號 key 的格式差異），最後改用 awk 掃描物件字面量的實際邊界（`/^const PATHS = \{/` 到 `/^\} satisfies/` 之間）才抓齊。**如果之後 mobile 端要重做 Icons.tsx，或未來又要從某個元件反抽型別，不要只用 grep 掃 key，用這種「先鎖定物件字面量邊界」的方式比較不會漏。**

## 各 Phase 進度

- [x] **Phase 0：monorepo 骨架** —— `apps/web`（整包 Next.js 專案搬進去，`package.json` 改名 `web`）＋ `packages/core`（目前只有 `types.ts`，含反抽出來的 `IconName`）。根目錄 `package.json` 改成 workspace root。`next.config.ts` 加 `transpilePackages: ['@easylearn/core']`。清掉 `dist/`（舊 Vite 殘留）、重寫了沒編輯過的 Vite 樣板 `README.md`。
  - 驗證：`yarn install`（root）成功、`node_modules/@easylearn/core` symlink 正確、`yarn workspace web typecheck/lint/build` 三項全過。
  - **尚未 commit**，仍全部可回滾。
  - 2026-07-12：曾啟動 dev server（port 3001）＋ Playwright 截圖做過一次「頁面有沒有正常渲染」的最低限度自我檢查，之後使用者表明希望自己驗證，已停止該背景程序。**之後不要再用 Playwright 自動幫使用者下「已驗證」的結論**，只給使用者確切的目錄＋指令，讓使用者自己在瀏覽器/真機確認（見下方「驗證紀律」）。
- [ ] **Phase 1**：`src/data/`、`src/utils/quiz.ts`、`src/data/typeMeta.ts` 搬進 `packages/core`；從 `useProgress.ts` 抽出 `progressCalc.ts`（`todayStr`/`yesterdayStr`/`bumpXpLog`/`bumpCounter`/`bumpStreak`/`GRADUATE_BOX`），順便解決它跟 `src/lib/progressLogic.ts` 的重複。
- [ ] **Phase 2**：Expo app bootstrap（`apps/mobile`，Expo Router）＋ `@clerk/expo` 登入 ＋ 只做 Profile tab（唯讀）。**第一個可跑的里程碑，也是整個計畫最關鍵的未驗證假設要在這裡測**（mobile Bearer token 打 web 端 API 是否真的不用改 middleware）。
- [ ] **Phase 3**：Guest 模式（AsyncStorage）＋ Home tab，可離線跑一次完整答題流程。
- [ ] **Phase 4**：完整登入同步迴圈（訪客進度搬遷到伺服器）。
- [ ] **Phase 5**：剩餘畫面（Notes/QuestionBook、Stats、review/mixed/savedpractice）。
- [ ] **Phase 6**：頭像拖曳／縮放／改名（最高複雜度的 native gesture，刻意排最後）。
- [ ] **Phase 7**（視是否加 OAuth 才需要）：Clerk native SSO redirect 的 Dashboard 設定。

## 驗證紀律（跨 phase 都適用）

- 這個環境能檢查的：`tsc --noEmit`、`oxlint`、`next build`、之後 mobile 端的 `expo-doctor`／`tsc`。這些過了只代表型別/建置沒問題，不代表功能正確。
- **使用者偏好自己在瀏覽器／真機驗證，不要用 Playwright（或任何自動化）幫使用者做「畫面/功能已驗證」的結論。** 每次一個 phase 完成到「可以看畫面」的程度，直接給使用者：(1) 要在哪個目錄下指令、(2) 指令是什麼、(3) 開哪個網址／怎麼開 app，不要自己截圖宣稱驗證過。
- 尤其 Phase 2 之後任何 native/裝置相關行為（手勢、鍵盤、Clerk native SSO、native module 是否真的 rebuild 生效），**只有使用者在真機/模擬器測過才能標記完成**，這裡不要提前打勾。
