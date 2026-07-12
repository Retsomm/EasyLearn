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
  - 已 commit（`09595a5`）並 push 到 `origin/dev`。
  - 2026-07-12：曾啟動 dev server（port 3001）＋ Playwright 截圖做過一次「頁面有沒有正常渲染」的最低限度自我檢查，之後使用者表明希望自己驗證，已停止該背景程序。**之後不要再用 Playwright 自動幫使用者下「已驗證」的結論**，只給使用者確切的目錄＋指令，讓使用者自己在瀏覽器/真機確認（見下方「驗證紀律」）。
- [x] **Phase 1**：`src/data/`（`chapters.ts`／`typeMeta.ts`／`questions/*.json`）、`src/utils/quiz.ts` 搬進 `packages/core/src`；從 `useProgress.ts` 抽出 `packages/core/src/progressCalc.ts`（`todayStr`/`yesterdayStr`/`bumpXpLog`/`bumpCounter`/`bumpStreak`/`GRADUATE_BOX`）。所有 `apps/web` 消費端（`App.tsx`、`screens/*`、`components/QuestionCard.tsx`／`QuestionReview.tsx`）改成從 `@easylearn/core` 匯入，不再走相對路徑。
  - `apps/web/src/lib/progressLogic.ts`（伺服器端）原本自己重複宣告一份 `GRADUATE_BOX`，已改成從 `@easylearn/core` 匯入同一份；`answer/route.ts` 直接改匯入 `@easylearn/core`，不再繞經 `progressLogic.ts` 轉手。
  - `bumpStreakServer`／`addDaysToDateStr` **刻意不搬進 core**：伺服器端用純 UTC 字串運算＋外部傳入 `today`，跟前端 `bumpStreak` 用裝置本地時區的 `Date` 是兩種不同機制（見 `progressLogic.ts` 內註解），硬併會破壞這個「避免主機時區誤判 streak」的設計。
  - `apps/web/scripts/validate-questions.mjs` 的 `QUESTIONS_DIR` 路徑同步改指向 `packages/core/src/data/questions`（題目資料夾搬家的必然結果，不是額外變更）。
  - 驗證：`yarn workspace web typecheck/lint/build` 三項全過；`packages/core` 單獨 `tsc --noEmit` 過；`node scripts/validate-questions.mjs` 重新指向新路徑後跑過，5693 項通過、0 項失敗。
  - 已 commit（`71534d6`）並 push 到 `origin/dev`。
- [~] **Phase 2（程式碼寫完，關鍵假設還沒真機驗證，不算完成）**：`apps/mobile` 用 `create-expo-app --template tabs` 建立（Expo Router），4 個 tab（home/notes/stats/profile）對應 `Navbar.tsx`，只有 Profile 有真的內容，其餘三個是「Phase X 敬請期待」的佔位畫面。
  - `metro.config.js` 加 `watchFolders`/`resolver.nodeModulesPaths`/`resolver.disableHierarchicalLookup` 讓 Metro 解析 workspace 的 `packages/core`——**已用 `npx expo export --platform web` 實測 bundling 成功（1284 modules，4 條路由都正確輸出靜態頁）**，證明這個monorepo 設定真的有接通，不只是型別檢查過而已。
  - 一次裝齊 Phase 2-6 會用到的 native module：`@clerk/expo`、`expo-secure-store`、`@react-native-async-storage/async-storage`、`react-native-svg`、`react-native-gesture-handler`、`@react-native-community/slider`、`expo-image-picker`、`expo-dev-client`。之後每個 phase 不用再裝新的 native module（除非規劃有變）。
  - `app/_layout.tsx`：`ClerkProvider` 包住整個 app，`lib/tokenCache.ts` 用 `expo-secure-store` 存 session token，`WebBrowser.maybeCompleteAuthSession()` 放在 module scope。`EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` 沒設會直接 throw（不是靜默失敗）。
  - `lib/api.ts`：`request<T>()` fetch 包裝，帶 `Authorization: Bearer <token>`、10 秒 abort timeout，對照 `apps/web` 既有 API 的 response 形狀。
  - `app/(tabs)/profile.tsx`：未登入顯示「使用 Google 登入」（`useSSO` 的 `startSSOFlow({ strategy: 'oauth_google' })`，因為 Clerk 這個 instance 目前只開 Google，沒有 email/password）；已登入呼叫 `GET /api/progress` 唯讀顯示 XP／連續學習／完成關卡／累計答題。
  - **跟原計畫不同的地方**：原計畫第 3 節說「Native Applications SSO redirect allowlist 只有要加 OAuth 才需要設定，可以延到 Phase 7」——但 web 端的 Clerk instance 本來就只設定了 Google 登入，沒有 email/password 選項，所以 mobile 要能登入、要能測到关键假设，**這個 Dashboard 設定其實在 Phase 2 現在就要做，沒辦法延到 Phase 7**。使用者要去 Clerk Dashboard → Configure → Native Applications → Allowlist for mobile SSO redirect 設定 `easylearn://` 這個 scheme（`app.json` 的 `scheme` 欄位）。
  - `expo-doctor` 19/20 過，唯一沒過的是 metro monorepo 設定（`resolver.disableHierarchicalLookup` 跟官方預設不同）——這是**刻意的**，官方預設不支援 monorepo，不是漏改。另外 `react-native-screens` 手動釘到 `4.26.0`（比 SDK 57 建議的 `4.25.2` 新一個 patch）解決 `expo-router` 內部依賴版本衝突造成的 duplicate native module，在 `package.json` 的 `expo.install.exclude` 註記過。
  - **這個環境能驗證的都驗證了**：`apps/mobile`／`apps/web`／`packages/core` 三個 `tsc --noEmit` 全過、`expo-doctor` 19/20、`expo export --platform web` 成功。
  - **踩過的坑**：
    - `app/_layout.tsx` 原本寫「module scope `if (!X) throw` 讓 `X` narrow 成 `string`」，但這個 narrow 效果不會帶進後面另一個 function（`RootLayout`）內部，`tsc` 報 `string | undefined` 不能指定給 `string`。修法：在用到的地方（`<ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY!}>`）額外加 `!`——module 層的 throw 已經保證執行到這裡一定有值，只是 TS 的 control flow analysis 看不到跨 function 邊界。
    - 使用者手動建的 `.env.local` 曾把 Clerk key 的前綴打成 `NEXT_PUBLIC_`（那是 apps/web 用的），Expo 只認 `EXPO_PUBLIC_` 前綴。這個 monorepo 三套前綴並存（web 用 `NEXT_PUBLIC_`，mobile 用 `EXPO_PUBLIC_`，舊 Vite 版是 `VITE_`），是最容易搞混的地方。
  - 已 commit（`82546e3`）並 push 到 `origin/dev`。
  - **必須使用者自己在真機／模擬器驗證，這裡完全沒辦法測**（見下方「驗證紀律」）：
    1. 上面提到的 Clerk Dashboard native redirect 設定。
    2. `apps/mobile/.env.local`（複製 `.env.example`）填真的 `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`（跟 web 同一把，注意前綴）跟 `EXPO_PUBLIC_API_BASE_URL`（電腦的 LAN IP，不能填 localhost；LAN IP 換網路會變，要重新查）。
    3. `cd apps/mobile && npx expo run:ios`（或 `run:android`）第一次要重新 build Dev Client，純 `expo start` 不會 pick up 剛裝的 native module。改 `EXPO_PUBLIC_` 環境變數只要重啟 Metro，不用重新 build 原生。
    4. 全計畫最關鍵的假設：登入後 Profile tab 能不能成功打 `GET /api/progress` 拿到資料——**這一步如果失敗，退路是幫 `apps/web` 加一個會用 `clerkMiddleware()` 的 `middleware.ts`**，這是有意識的決定，不是預設會成功。
- [x] **Phase 3**：Guest 模式（AsyncStorage）＋ Home tab，可離線跑一次完整答題流程。
  - 新增 `apps/mobile/hooks/useProgress.ts`：對照 `apps/web/src/hooks/useProgress.ts` 的訪客模式邏輯（answerQuestion/toggleSaved/finishLevel/finishReview 的 Leitner 盒制、streak、xpLog、dailyStats/chapterStats 計算完全共用 `packages/core`），存取層從 `localStorage`（同步）換成 `AsyncStorage`（非同步）。**這個 hook 刻意只做訪客模式，沒有接 Clerk 同步**——那是 Phase 4 的範圍，Profile tab 現有的登入讀取邏輯完全沒動。多一個 `hydrated` flag 是因為 `AsyncStorage.getItem` 是非同步的，跟 web 版掛載時就能同步讀到 localStorage 不同，畫面要等這個 flag 才能顯示，避免用預設空進度覆寫掉還沒讀出來的真實資料。
  - 新增 `apps/mobile/screens/{Home,ChapterMap,Quiz}.tsx` ＋ `apps/mobile/components/{QuestionCard,CodeBlock,Icon}.tsx`：邏輯／資料流對照 `apps/web/src/screens/{Home,ChapterMap,Quiz}.tsx` 與 `apps/web/src/components/QuestionCard.tsx`（同樣呼叫 `packages/core` 的 `getLevel`/`sampleQuestions`/`shuffle`/`getChapterIdForQuestion`/`MIXED_SIZE` 等），畫面改用 RN 的 View/Text/Pressable/ScrollView＋StyleSheet 重寫，不是照抄 web 的 CSS class。
  - `apps/mobile/app/(tabs)/index.tsx` 取代原本的 `ComingSoon` 佔位畫面，用跟 `apps/web/src/App.tsx` 相同的手法——一個 `view` 狀態機（home/levellist/quiz/mixed）在單一 tab 內切畫面，不是額外接 expo-router 的巢狀 stack route。範圍只到 Home tab（notes/stats 兩個 tab 各自獨立，還沒做，維持 `ComingSoon` 佔位）。
  - **刻意跟 web 版不同、屬於 Phase 3 MVP 簡化，不是漏做**：
    1. `Icon.tsx` 用 emoji 對照 `IconName` 聯集（`satisfies Record<IconName, string>` 確保沒漏刻），暫時頂替 web 版 `Icons.tsx` 的 SVG 圖示；`CodeBlock.tsx` 只做等寬字體顯示，沒有 web 版那種 token 語法上色。都是「先求離線答題流程能跑」，還沒做「星際 HUD」視覺，之後真的要做像素級一致的視覺時再換掉這兩個檔案。
  - **這個環境能驗證的都驗證了**：`yarn workspace mobile typecheck` 過、`packages/core` 單獨 `tsc --noEmit` 過、`npx expo export --platform web`（1332 modules）成功且四條路由都正確輸出、`expo-doctor` 19/20（唯一沒過的仍是 Phase 2 就有、刻意的 metro monorepo 設定，跟這次改動無關）。
  - **使用者已在真機/模擬器驗證過（2026-07-12）**：Home tab 完整流程（選章節→答題→結算→回關卡地圖、首頁隨機綜合練習）跑過沒問題；AsyncStorage 跨「app 完全關閉重開」持久化確認有效（XP/streak/完成關卡都留著）；目前是淺色主題，可讀性沒問題（深色主題下 emoji 圖示是否跟系統字體不搭，還沒實測，留意即可，不阻塞這個 phase）。
  - **範圍界定（使用者當面確認，2026-07-12）**：Profile tab 未登入畫面原本寫著「未登入的訪客模式留到 Phase 3 做」，是 Phase 2 埋的預留承諾。這次確認過**這句話指的是訪客模式的資料引擎跟 Home tab 離線流程（已完成），不包含「Profile tab 本身在未登入時顯示訪客進度」**——Profile tab 未登入時仍只有登入按鈕，不會讀 AsyncStorage 顯示訪客統計。這塊使用者選擇留到 Phase 4（跟登入同步迴圈一併處理，屆時 Profile tab 的訪客/登入切換邏輯要一次做完整），`profile.tsx` 的提示文字已改成註明這件事，不要誤以為是遺漏。
- [ ] **Phase 4**：完整登入同步迴圈（訪客進度搬遷到伺服器）。
- [ ] **Phase 5**：剩餘畫面（Notes/QuestionBook、Stats、review/mixed/savedpractice）。
- [ ] **Phase 6**：頭像拖曳／縮放／改名（最高複雜度的 native gesture，刻意排最後）。
- [ ] **Phase 7**（視是否加 OAuth 才需要）：Clerk native SSO redirect 的 Dashboard 設定。

## 驗證紀律（跨 phase 都適用）

- 這個環境能檢查的：`tsc --noEmit`、`oxlint`、`next build`、之後 mobile 端的 `expo-doctor`／`tsc`。這些過了只代表型別/建置沒問題，不代表功能正確。
- **使用者偏好自己在瀏覽器／真機驗證，不要用 Playwright（或任何自動化）幫使用者做「畫面/功能已驗證」的結論。** 每次一個 phase 完成到「可以看畫面」的程度，直接給使用者：(1) 要在哪個目錄下指令、(2) 指令是什麼、(3) 開哪個網址／怎麼開 app，不要自己截圖宣稱驗證過。
- 尤其 Phase 2 之後任何 native/裝置相關行為（手勢、鍵盤、Clerk native SSO、native module 是否真的 rebuild 生效），**只有使用者在真機/模擬器測過才能標記完成**，這裡不要提前打勾。
