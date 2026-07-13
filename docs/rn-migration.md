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
- [x] **Phase 2**：`apps/mobile` 用 `create-expo-app --template tabs` 建立（Expo Router），4 個 tab（home/notes/stats/profile）對應 `Navbar.tsx`，只有 Profile 有真的內容，其餘三個是「Phase X 敬請期待」的佔位畫面。
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
    - **（2026-07-12 補記，Phase 3 驗證完才發現）**：Phase 2「一次裝齊 native module」那份清單漏了 `expo-auth-session`——`@clerk/expo` 的 `useSSO().startSSOFlow()` 同時需要 `expo-auth-session` 和 `expo-web-browser`，當時只裝了後者。使用者真機點「使用 Google 登入」直接跳出 `@clerk/expo: Unable to load expo-auth-session and expo-web-browser` 錯誤，登入完全跑不起來。已在 Phase 4 一開始補裝 `npx expo install expo-auth-session`（連帶裝入 `expo-application`／`expo-crypto` 這兩個 transitive 依賴）。**這三個套件都有原生模組，不是純 JS**，所以裝完必須重新 `npx expo run:ios`/`run:android` 重建 Dev Client，光重啟 `expo start` 不會生效——這點跟 Phase 2 文件已經提醒過的「新裝 native module 要重建 Dev Client」規則一致，只是這次是「漏裝」而不是「新裝」。
  - 已 commit（`82546e3`）並 push 到 `origin/dev`。
  - **2026-07-12，Phase 4 開工前真機測試，全計畫最關鍵的假設終於驗證成功**：Android 上登入後 Profile tab 成功打 `GET /api/progress` 拿到 200 回應——mobile 帶 Clerk session Bearer token 打 `apps/web` 的 API，不需要另外幫 `apps/web` 加 `middleware.ts`。過程中連續踩了好幾個坑，才讓登入真正跑得起來（詳細診斷過程見對話紀錄，這裡只記結論與修法，方便之後查閱）：
    1. **漏裝 `expo-auth-session`**：`@clerk/expo` 的 `useSSO().startSSOFlow()` 同時需要 `expo-auth-session` 和 `expo-web-browser`，Phase 2 只裝了後者，導致點登入直接跳 `Unable to load expo-auth-session` 錯誤。修法：`npx expo install expo-auth-session`（連帶裝入 `expo-application`／`expo-crypto` 兩個 transitive 依賴，三個都有原生模組，需要重新 `expo run:ios`/`run:android` 重建 Dev Client）。
    2. **`apps/mobile/.env.local` 的 `EXPO_PUBLIC_API_BASE_URL` port 跟實際跑的 `next dev` 對不上**（設 3001，實際跑在預設的 3000），Android 連線一直 `ConnectException`。改對 port 後才連得上。
    3. **Profile tab 無限狂打 `GET /api/progress`**：`apps/mobile/app/(tabs)/profile.tsx` 的 `useEffect` 依賴到 `loadProgress`（一個 `useCallback`），而 `loadProgress` 又依賴 `getToken`——Clerk 的 `getToken` 每次 render 不保證同一個 reference，導致這個 effect 每次 render 都重跑。修法：effect 改成只依賴 `isSignedIn`。
    4. **Android OAuth 導回閃「This screen doesn't exist」404**：查了 `node_modules/@clerk/expo/dist/hooks/useSSO.js` 原始碼才發現，`startSSOFlow` 沒指定 `redirectUrl` 時預設導去 `easylearn://sso-callback`，這個專案沒有對應路由檔案。iOS 的 `ASWebAuthenticationSession` 不會讓這個 URL 流到 expo-router 的 Linking 監聽器，但 Android 用 Custom Tabs 導回時會，才會被判定成不存在的路由（iOS 因此沒事，只有 Android 會炸）。修法：新增 `apps/mobile/app/sso-callback.tsx`，掛載後**等 `isSignedIn` 真的變 true 才 `router.replace('/(tabs)/profile')`**（不能一掛載就馬上導，那樣 Profile 重新掛載時 `isSignedIn` 可能還沒更新完，會先閃一次未登入畫面），加 15 秒逾時保底避免卡死。
    5. **登入瞬間仍會閃一下未登入畫面**：`profile.tsx` 加 `signingIn` state，從 `handleSignIn` 一開始就設 true 蓋住「`isSignedIn` 還沒更新完」那段空窗，成功時刻意不主動設回 false（避免自己搶在 `isSignedIn` 更新前重新露出登入畫面），失敗或使用者取消才重置。
    6. **UX 順手調整（使用者要求）**：`(tabs)/_layout.tsx` 的 Profile tab 文字改成依 `isSignedIn` 動態顯示「登入」或「個人資料」；四個 tab 與 `+not-found` 全部 `headerShown: false`，移除頂部標題列；拿掉標題列後內容跟系統狀態列（時間/WIFI/電量）重疊，加了 `SafeAreaProvider`（根 `_layout.tsx`）＋各畫面 `useSafeAreaInsets()` 的 `paddingTop`。
  - 上述修法都已在真機（iOS 模擬器＋ Android 模擬器/裝置）測過確認有效，**但程式碼還沒 commit**，下一步要先跟使用者確認要不要一次 commit＋push。
  - ~~必須使用者自己在真機／模擬器驗證~~（已完成，見上）：Clerk Dashboard native redirect 設定、`.env.local` 填值、Dev Client 重建、Bearer token 打 API，四項全部驗證過。
- [x] **Phase 3**：Guest 模式（AsyncStorage）＋ Home tab，可離線跑一次完整答題流程。
  - 新增 `apps/mobile/hooks/useProgress.ts`：對照 `apps/web/src/hooks/useProgress.ts` 的訪客模式邏輯（answerQuestion/toggleSaved/finishLevel/finishReview 的 Leitner 盒制、streak、xpLog、dailyStats/chapterStats 計算完全共用 `packages/core`），存取層從 `localStorage`（同步）換成 `AsyncStorage`（非同步）。**這個 hook 刻意只做訪客模式，沒有接 Clerk 同步**——那是 Phase 4 的範圍，Profile tab 現有的登入讀取邏輯完全沒動。多一個 `hydrated` flag 是因為 `AsyncStorage.getItem` 是非同步的，跟 web 版掛載時就能同步讀到 localStorage 不同，畫面要等這個 flag 才能顯示，避免用預設空進度覆寫掉還沒讀出來的真實資料。
  - 新增 `apps/mobile/screens/{Home,ChapterMap,Quiz}.tsx` ＋ `apps/mobile/components/{QuestionCard,CodeBlock,Icon}.tsx`：邏輯／資料流對照 `apps/web/src/screens/{Home,ChapterMap,Quiz}.tsx` 與 `apps/web/src/components/QuestionCard.tsx`（同樣呼叫 `packages/core` 的 `getLevel`/`sampleQuestions`/`shuffle`/`getChapterIdForQuestion`/`MIXED_SIZE` 等），畫面改用 RN 的 View/Text/Pressable/ScrollView＋StyleSheet 重寫，不是照抄 web 的 CSS class。
  - `apps/mobile/app/(tabs)/index.tsx` 取代原本的 `ComingSoon` 佔位畫面，用跟 `apps/web/src/App.tsx` 相同的手法——一個 `view` 狀態機（home/levellist/quiz/mixed）在單一 tab 內切畫面，不是額外接 expo-router 的巢狀 stack route。範圍只到 Home tab（notes/stats 兩個 tab 各自獨立，還沒做，維持 `ComingSoon` 佔位）。
  - **刻意跟 web 版不同、屬於 Phase 3 MVP 簡化，不是漏做**：
    1. `Icon.tsx` 用 emoji 對照 `IconName` 聯集（`satisfies Record<IconName, string>` 確保沒漏刻），暫時頂替 web 版 `Icons.tsx` 的 SVG 圖示；`CodeBlock.tsx` 只做等寬字體顯示，沒有 web 版那種 token 語法上色。都是「先求離線答題流程能跑」，還沒做「星際 HUD」視覺，之後真的要做像素級一致的視覺時再換掉這兩個檔案。
  - **這個環境能驗證的都驗證了**：`yarn workspace mobile typecheck` 過、`packages/core` 單獨 `tsc --noEmit` 過、`npx expo export --platform web`（1332 modules）成功且四條路由都正確輸出、`expo-doctor` 19/20（唯一沒過的仍是 Phase 2 就有、刻意的 metro monorepo 設定，跟這次改動無關）。
  - **使用者已在真機/模擬器驗證過（2026-07-12）**：Home tab 完整流程（選章節→答題→結算→回關卡地圖、首頁隨機綜合練習）跑過沒問題；AsyncStorage 跨「app 完全關閉重開」持久化確認有效（XP/streak/完成關卡都留著）；目前是淺色主題，可讀性沒問題（深色主題下 emoji 圖示是否跟系統字體不搭，還沒實測，留意即可，不阻塞這個 phase）。
  - **範圍界定（使用者當面確認，2026-07-12）**：Profile tab 未登入畫面原本寫著「未登入的訪客模式留到 Phase 3 做」，是 Phase 2 埋的預留承諾。這次確認過**這句話指的是訪客模式的資料引擎跟 Home tab 離線流程（已完成），不包含「Profile tab 本身在未登入時顯示訪客進度」**——Profile tab 未登入時仍只有登入按鈕，不會讀 AsyncStorage 顯示訪客統計。這塊使用者選擇留到 Phase 4（跟登入同步迴圈一併處理，屆時 Profile tab 的訪客/登入切換邏輯要一次做完整），`profile.tsx` 的提示文字已改成註明這件事，不要誤以為是遺漏。
  - 已 commit（`410a71a`）並 push 到 `origin/dev`。
- [x] **Phase 4：完整登入同步迴圈**（2026-07-13，**使用者已在 iOS 模擬器與 Android 模擬器分別實測成功**，
      詳見本節最後的驗證紀錄；已可 commit）
  - `apps/mobile/hooks/useProgress.ts` 的 `useProgressState()` 改成跟 `apps/web/src/hooks/useProgress.ts`
    同一套雙模式邏輯：未登入沿用 Phase 3 的 AsyncStorage 訪客模式；已登入時用 `@clerk/expo` 的
    `useAuth().getToken()` 拿 token，透過 `lib/api.ts` 的 `request()` 打 `apps/web` 既有的
    `GET /api/progress`／`POST /api/progress/{migrate-local,answer,save-toggle,finish-level,finish-review}`
    五支 API，伺服器回傳的權威 `Progress` 直接覆蓋本地樂觀更新（跟 web 版同一個設計：不是本地優先＋
    背景同步，已登入時完全以伺服器回應為準）。
  - **新增 `apps/mobile/context/ProgressContext.tsx`（`ProgressProvider`）**——這是跟 web 版行為不同、
    mobile 特有的必要調整：web 的 `useProgress()` 只在 `App.tsx` 呼叫一次，往下用 props 傳給所有畫面；
    但 mobile 用 Expo Router 的 tab 架構，Home tab（`app/(tabs)/index.tsx`）跟 Profile tab
    （`app/(tabs)/profile.tsx`）是兩棵獨立的元件樹，各自呼叫 `useProgressState()` 會變成兩份互不相通
    的 state，且登入搬遷（migrate-local）邏輯會被觸發兩次。改成 `ProgressProvider` 包在
    `app/_layout.tsx` 的 `ClerkProvider` 內側（需要 Clerk 的 `useAuth`，所以一定要在 `ClerkProvider`
    裡面），Home／Profile 兩個 tab 都改成從 `@/context/ProgressContext` 讀 `useProgress()`，共用同一份
    progress state 跟同一次登入搬遷。
  - `profile.tsx` 不再自己打 `GET /api/progress`／管理 `loading`／`progress` local state，改直接讀
    context 提供的 `progress`／`hydrated`，登入/登出/SSO 錯誤處理邏輯完全沒動。
  - **設計決定：本機讀取跟登入判斷的 race**——Phase 3 就有的 `hydrated` flag（AsyncStorage 讀取非同步）
    這次多了一個新的race 要處理：登入搬遷的 `useEffect` 原本只依賴 `[isLoaded, isSignedIn]`，這次改成
    多依賴 `hydrated`（`if (!isLoaded || !hydrated) return`）——因為本地讀取跟登入後打 API 誰先完成
    不保證，沒有這道 guard 可能會先拿到伺服器資料、又被稍後才完成的本地讀取蓋掉。
  - **這個環境能驗證的都驗證了**：`packages/core`／`apps/mobile`／`apps/web` 三個 `tsc --noEmit` 全過、
    `expo-doctor` 19/20（唯一沒過的仍是 Phase 2 就有、刻意的 metro monorepo 設定，跟這次改動無關）、
    `npx expo export --platform web` 成功（1356 modules，`/`／`/notes`／`/stats`／`/profile` 等 11 條
    路由都正確輸出，證明 `ProgressProvider` 沒有造成任何 render/bundle 期的錯誤）。
  - **完全沒有測過的部分（使用者要自己在真機/模擬器驗證才能定案）**：訪客刷題資料在登入瞬間是否正確
    搬進資料庫（`migrate-local`）；已登入時答題／收藏／完成關卡是否正確寫回 `apps/web` 的 7 張表；
    Home tab 跟 Profile tab 切換時進度數字是否即時同步（這正是這次改成 `ProgressProvider` context
    要驗證的核心行為）；登出再登入是否讀到同一份雲端進度、且正確切回訪客模式的 AsyncStorage 資料。
  - **2026-07-13 追加，使用者實測回報第一個 bug（iOS 模擬器）**：訪客先答完 12 題（Home 正確顯示
    streak/正確率/已做題數），切到 Profile 登入後，Home 整頁變回全 0（等同 `defaultProgress`），
    不是「維持登入前的數字」而是被洗成空的。
    - **根因**：登入搬遷那段 `if (data.isNew) { const local = await loadLocal(); ... }` 又另外重新
      讀了一次 AsyncStorage，而不是直接用當下畫面已經顯示、確定正確的 `progress` state。問題出在
      寫回 AsyncStorage 的那個 effect（`AsyncStorage.setItem(...).catch(() => {})`）是 fire-and-forget、
      沒有 await 的非同步寫入，登入那一刻最後一次寫入很可能還沒真的落盤，`loadLocal()` 這時讀到的是
      舊值甚至完全空值——空的訪客進度就這樣被搬進資料庫，而且之後不會再重搬（資料庫已經有一筆
      「非 isNew」的紀錄，即使內容是空的）。
    - **修法**：新增 `progressRef`（`useEffect(() => { progressRef.current = progress }, [progress])`
      同步鏡射目前的 `progress` state），搬遷時直接送 `progressRef.current`，不再呼叫 `loadLocal()`
      重讀 AsyncStorage。`tsc --noEmit` 過。
  - **2026-07-13 再追加，使用者第二次實測回報「未登入跟登入後資料還是不一致」（連續天數 1→0、
    今日已做 30→20），但這次診斷後發現＊不是＊程式碼的 bug**：
    - 徵得使用者同意後，直接用唯讀的 Prisma 查詢連 Supabase 確認了實際資料庫內容（一次性診斷，
      沒有寫入任何資料，查完就把腳本刪掉，不是這條同步邏輯的常態做法）。
    - 發現這次測試用的 Clerk 帳號，資料庫裡早在 2026-07-11（比 RN 遷移還早，應該是網頁版開發
      期間）就已經留了 5 筆 `WrongEntry`（錯題本）紀錄。`isNew` 的判斷邏輯（見 Phase 4 一開始
      的實作說明）是「`completedLevels`／`wrongEntries`／`savedQuestions`／`xpLogs` 四張表都空
      才算新使用者」——這是刻意的保護機制（避免每次登入都拿裝置端資料覆蓋掉雲端真實進度），
      但也代表**這個帳號的 `isNew` 從此永遠是 `false`**，不管訪客模式在裝置上刷了幾題，登入時
      都會被判定「不是新使用者」而完全跳過搬遷，只顯示資料庫裡早就存在的舊資料。使用者看到的
      「20 題／streak 0」正是資料庫裡某次已登入狀態刷題留下的舊紀錄，不是這次訪客的 30 題被
      搬壞了。
    - **結論**：`useProgress.ts` 的搬遷邏輯（含上面那次 `progressRef` 修法）本身沒有問題，只是
      這個特定測試帳號因為帶著遷移前就有的舊資料，永遠無法命中「isNew」分支，沒辦法拿來驗證
      搬遷路徑。**之後要驗證登入搬遷，必須用一個資料庫裡四張子表全空的全新帳號測試**（換一個
      從沒登入過這個 app 的 Google 帳號最乾淨；或用 web 版「個人資料→刪除帳號」把舊帳號連
      Clerk 身分一起刪掉重來，但那是不可逆操作）。**教訓**：這台機器上的測試帳號經過好幾輪
      不同 phase 的測試（Phase 2 唯讀 Profile 測試、web 版原本的開發測試），很容易在資料庫裡
      留下「不是空但也不是有意義」的殘餘資料，之後任何要驗證「首次登入搬遷」邏輯的測試，
      第一步都要先確認測試帳號在資料庫裡真的是一張白紙，不要預設「這個帳號感覺沒認真用過」
      就等於「資料庫是空的」。
    - **這輪修法（`progressRef`）仍然還沒有用乾淨帳號重新驗證過**，下次要接續時，先用全新帳號
      走一次「訪客刷題→登入→確認 Home 數字保留」，這次是真的能檢驗到搬遷邏輯本身。
  - **2026-07-13 三度追加，加了臨時除錯 log 後第三次實測，才真正抓到根因**：在 `useProgress.ts`
    的每個關鍵步驟（掛載讀取本機資料、寫回 AsyncStorage、GET /api/progress 回應、送出搬遷 body、
    migrate-local 回應）跟 `apps/web` 的 `GET /api/progress`／`POST /api/progress/migrate-local`
    兩支 route 都加了 `[progress-debug]` 前綴的 `console.log`，讓手機端 Metro 終端機跟網頁端
    `next dev` 終端機兩邊的 log 可以對照看。
    - 從 log 完整重建出流程：**app 啟動時 Clerk 用 Keychain 裡殘留的 session 幾乎立刻自動登入**
      （不是使用者手動按登入），這時本地訪客資料根本還是空的就先觸發了一次搬遷判斷；接著使用者
      手動登出、在訪客模式下多刷了幾題、再登入——但因為第一次自動登入時 `isNew` 已經翻成 `false`
      （資料庫從那時起就不是空的），第二次登入時 `isNew` 依然是 `false`，直接跳過搬遷、顯示的是
      更早以前的舊資料，跟訪客模式剛累積的新資料對不起來。
    - **結論確認**：不是 race condition、不是搬遷邏輯寫錯，就是「終身只搬一次」設計下，反覆登出
      /登入本來就不會觸發第二次搬遷——這跟上一輪（第二次追加）發現的成因是同一類問題，這次用
      log 徹底證實了。跟使用者確認過，**維持「只搬一次」設計不變**，之後測試／使用都不要預期
      「登出再登入」會重新同步。
    - **真正乾淨的驗證**：把資料庫整個清空兩次（每次都先跟使用者確認過範圍才動手，用一次性
      Prisma 腳本 `prisma.user.deleteMany({})` 靠 `onDelete: Cascade` 連帶清光 6 張子表，腳本
      用完即刪，不留在 repo 裡）＋裝置端徹底清掉（iOS 用 `xcrun simctl uninstall` 再
      `npx expo run:ios` 重裝；Android 用 `adb shell pm clear com.retsnom.easylearnmobile`
      清資料，不用整個重裝重 build），確保 Clerk session 也真的被清掉、不會一開 app 就自動登入。
      照「先訪客刷題→再登入一次，中間不登出」這個順序，**iOS 模擬器與 Android 模擬器都各自
      實測成功**：`isNew: true` 正確觸發搬遷、送出的訪客資料（`wrongIdsCount`／`dailyStats` 等）
      跟搬遷後資料庫回傳的資料完全一致，Home tab 數字登入前後沒有變動。
    - 驗證通過後，除錯用的 `console.log` 已經全部清掉（`useProgress.ts` 只留下 `progressRef` 這個
      正式修法，兩支 API route 恢復乾淨），`tsc --noEmit`（三個 package）／`oxlint` 都重新跑過確認過。
  - **Phase 4 到此可以視為完成並 commit**：登入搬遷、雙 tab 共用 progress state、iOS／Android 
    真機（模擬器）搬遷路徑都驗證過。「反覆登出登入不會重新同步」是刻意的既有設計（跟 web 版一致），
    不是待辦事項。
- **2026-07-13，Phase 5 開工前追加**：使用者反映 apps/mobile 淺色主題太刺眼，已把
  `useColorScheme`（含 `.web.ts` 變體）鎖死回傳 `dark`，不再看裝置系統設定；`Colors.ts`
  的 dark 色票從刺眼的純黑 `#000`／純白 `#fff` 改成柔和的 `#121212`／`#e6e6e6`。過程中
  發現 `Icon.tsx` 原本用 `react-native` 原生 `Text` 顯示非 emoji 符號（`✕←→›↺`），預設黑字
  在深色背景幾乎全隱形（真正的彩色 emoji 圖示不受影響），改成從 `components/Themed.tsx`
  匯入 `Text` 讓它跟著主題文字色走。這是暫時性的過渡措施，不是 Phase 5/6 要做的「星際 HUD」
  視覺（那個之後會直接取代 Colors.ts 這套機制），**之後真的動視覺 phase 時要記得這裡的
  強制 dark 是暫時的，不要誤以為是最終設計**。已 commit（`98c3923`）並 push 到 `origin/dev`。
  這個環境沒辦法看實際畫面，使用者尚未回報確認過修好之後的顯示效果。
- [x] **Phase 5：剩餘畫面**（2026-07-13 實作完成，**尚未經使用者在模擬器/真機驗證**）
  - 新增 `apps/mobile/screens/{Notes,QuestionBook,QuestionReview,Stats}.tsx`：邏輯／資料流對照
    `apps/web/src/screens/{Notes,QuestionBook,Stats}.tsx` 與 `apps/web/src/components/QuestionReview.tsx`，
    同樣呼叫 `packages/core` 的 `getWrongQuestions`/`getWrongEntries`/`getSavedQuestions`/`REVIEW_SIZE`
    等既有函式，畫面改用 RN 的 View/Text/Pressable/ScrollView＋StyleSheet 重寫。
  - `app/(tabs)/notes.tsx` 取代原本的 `ComingSoon` 佔位畫面，用跟 `app/(tabs)/index.tsx`（Home tab）
    同一種手法——一個 `view` 狀態機（notes/wrongbook/savedbook/review/savedpractice）在單一 tab 內
    切畫面，`review`/`savedpractice` 直接複用 Phase 3 就有的 `Quiz` 元件（`mode="review"`／
    `mode="mixed"`），跟 Home tab 各自獨立一個狀態機、但共用同一份 `ProgressProvider` context。
  - `app/(tabs)/stats.tsx` 取代 `ComingSoon`，是單一唯讀畫面（不需要 view 狀態機，跟 Profile tab
    同構）。`screens/Stats.tsx` 把 web 版的日期／熱力圖／統計計算邏輯整段搬過來（沒有搬進
    `packages/core`，因為這些函式只有 UI 層在用，不是 web/mobile 共用的資料邏輯），熱力圖用
    RN 的 `ScrollView horizontal` 取代 web 版的 CSS overflow-x scroll。
  - **刻意跟 web 版不同、屬於 MVP 簡化，不是漏做**：熱力圖格子跟迷你長條圖拿掉了 web 版滑鼠
    hover 才有的 `title` tooltip——觸控裝置本來就沒有 hover 這個互動，跟 Phase 3 `CodeBlock`/
    `Icon.tsx` 用 emoji 頂替 SVG 圖示是同一個「先求功能完整，不追求像素級一致視覺」原則。
  - 沒用到的 `components/ComingSoon.tsx`（Phase 2/3 的四個佔位畫面已經全部被真正內容取代）
    已直接刪除，不留 dead code。
  - **這個環境能驗證的都驗證了**：`apps/mobile` `tsc --noEmit` 過、`expo-doctor` 19/20（唯一沒過的
    仍是 Phase 2 就有、刻意的 metro monorepo 設定，跟這次改動無關）、`npx expo export --platform web`
    成功（1358 modules，`/notes`／`/stats` 兩條新路由都正確輸出）。
  - **2026-07-13，使用者在真機/模擬器測過（Notes tab 巢狀按鈕觸控、Stats tab 熱力圖橫向捲動、
    review/savedpractice 結算流程、深色主題配色）四項都 OK**。
  - **2026-07-13 追加，使用者測試後要求改變錯題本規則**：原本是 Leitner 盒制（答對要升滿
    `GRADUATE_BOX`＝3 盒才移出錯題本），改成「答對一次就直接移出錯題本」。這是 `packages/core`
    的共用邏輯（`progressCalc.ts` 的 `applyAnswer`），同時也要改 `apps/web/src/app/api/progress/
    answer/route.ts`（登入時的伺服器端寫入是另外手刻同一套規則的 Prisma 交易，沒有共用
    `applyAnswer`，這次一起改成答對就 `delete`，不再比較 `box+1 > GRADUATE_BOX`）。`GRADUATE_BOX`
    常數跟 `熟練度 X/3` 的 UI 顯示（`QuestionReview.tsx`，web/mobile 各一份）已經完全移除，因為
    移出時機改成單次答對後，這個欄位永遠停在 1，留著顯示只會誤導。**`WrongEntryMeta.box` 欄位／
    Prisma `WrongEntry.box` 資料庫欄位本身刻意保留沒動**（一律寫 1，不再遞增）——避免多動一次
    schema migration，這欄位現在只是歷史包袱，之後如果要徹底清乾淨可以再考慮拿掉。這個環境驗證過
    `apps/web`／`apps/mobile` 的 `tsc --noEmit`、`web` 的 `lint`／`build`、`mobile` 的
    `expo export --platform web`，都過；**2026-07-13 使用者已在真機/模擬器測過，答對後錯題確實
    從清單消失，符合預期**。已 commit（`18de9d2`）並 push 到 `origin/dev`。
- [x] **Phase 6：頭像拖曳／縮放／改名**（2026-07-13 實作完成，**完全沒有真機/模擬器驗證過，
      風險最高，需要先重新原生建置才能測**）
  - `packages/core/src/stages.ts`（新增）：把 `apps/web/src/lib/stages.ts` 的吉祥物成長階段資料
    （`STAGES`/`getStage`/`getNextStage`）搬進共用層——這是 Phase 1 就該搬但當時漏掉的純資料/
    函式，這次 mobile 的 `Mascot`/`GrowthHistory` 也要用到才發現。`apps/web` 的
    `lib/stages.ts` 已刪除，`Profile.tsx`／`Quiz.tsx`／`Mascot.tsx`／`GrowthHistory.tsx`
    改成從 `@easylearn/core` 匯入，行為完全沒變，純粹是搬家。
  - 新增 `apps/mobile/components/{Mascot,GrowthHistory}.tsx`：對照 web 同名元件，靜態顯示，
    沒有搬 web 版 `mood="happy"` 的彈跳動畫（跟 Phase 3 的簡化原則一致）。
  - 新增 `apps/mobile/components/AccountHeader.tsx`（這個 phase 最複雜的部分）：對照 web 版
    `AccountHeader.tsx` 的頭像拖曳/縮放/改名，換算公式（`getOverflow`／裁切位置計算）整段照搬，
    只有互動層换成 RN 對應方案：
    - 拖曳：web 版用滑鼠 `onPointerDown/Move/Up` 手算 dx/dy；mobile 改用
      `react-native-gesture-handler` 的 `PanGestureHandler`（沿用 v1 的 `onGestureEvent`/
      `onHandlerStateChange` API，不是新版 `Gesture.Pan()`＋worklet，减少複雜度），
      `translationX/Y` 本來就是相對手勢起點的累計位移，跟 web 版邏輯概念一致，公式沒改。
      `react-native-gesture-handler` 需要整個 app 包一層 `GestureHandlerRootView`，
      已經加到 `app/_layout.tsx` 最外層。
    - 縮放：`<input type=range>` 換成 `@react-native-community/slider` 的 `<Slider>`。
    - 選照片：`expo-image-picker` 的 `launchImageLibraryAsync`，選到的本機 `file://` URI
      透過 `fetch(uri).then(r => r.blob())` 轉成 `Blob` 再交給 Clerk 的
      `user.setProfileImage({ file: blob })`——RN 沒有瀏覽器的 `File`/`<input type=file>`，
      這個 URI→Blob 轉換是 RN 上傳圖片給任何 API（含 Clerk）的標準作法，但**這條路徑完全沒有
      實機測過，`fetch().blob()` 在 Expo 的 polyfill 下是否真的能把 Clerk 需要的圖片資料正確
      送出，是這個 phase 最大的不確定性**。
    - 已在 `app.json` 的 `plugins` 加上 `expo-image-picker` 的設定（帶中文相簿權限說明文字），
      這是 Phase 2 只裝套件、沒寫 config plugin 設定的收尾。
  - `app/(tabs)/profile.tsx` 大幅擴充：原本只有登入後顯示 4 個統計數字＋登出按鈕的極簡版，
    這次補齊 web 版 `Profile.tsx` 其餘一直沒搬的部分——`AccountHeader`（頭像/改名）、
    `Mascot`（size="sm"）＋ XP 進度條、「成長史」展開/收合、`GrowthHistory`、帳號設定區塊的
    登出／刪除帳號。刪除帳號用 `Alert.alert` 的 destructive 按鈕做確認（RN 没有
    `window.confirm`），呼叫既有的 `DELETE /api/account`（`lib/api.ts` 的 `request`，這支
    endpoint 在 Phase 4 就已經存在於 apps/web，這次是 mobile 第一次呼叫它）。
  - **這個環境能驗證的都驗證了**：`packages/core`／`apps/web`／`apps/mobile` 三個
    `tsc --noEmit` 過、`apps/web` 的 `lint`／`build` 過、`apps/mobile` 的
    `expo export --platform web` 成功（1516 modules，`/profile` 路由正確輸出）、
    `expo-doctor` 19/20（唯一沒過的仍是 Phase 2 就有、刻意的 metro monorepo 設定）。
  - **完全沒有測過、風險最高的部分（使用者要自己在真機/模擬器驗證才能定案）**：
    1. `app.json` 這次改了 `plugins`（新增 `expo-image-picker` 設定）＋ `app/_layout.tsx`
       加了 `GestureHandlerRootView`，**必須重新 `npx expo run:ios`/`run:android` 完整原生
       建置**（不是新裝 native module，但 app.json 的 config plugin 變更同樣需要重新產生
       原生專案設定），光重啟 `expo start` 不會生效，這點跟 Phase 2/4 提醒過的規則一致。
    2. 拖曳頭像的手感、縮放拉桿是否跟拖曳同步、放開後位置是否正確换算——這組數學公式是照搬
       web 版沒改邏輯，但 web 是滑鼠事件、mobile 是觸控手勢，實際手感需要真機才能判斷。
    3. 選照片→上傳→Clerk `setProfileImage` 整條路徑能不能成功（見上面 URI→Blob 轉換的
       不確定性），包含相簿權限彈窗文字是否正確顯示。
    4. 改名存檔、成長史展開/收合、刪除帳號的確認對話框與實際刪除流程。
  - **2026-07-13，使用者原生重建後實機測過，回報三項 UI 調整**（不是 bug，是設計回饋）：
    1. 個人資料不需要顯示 `USER.XXXXXXXX` 這行——`AccountHeader.tsx` 已移除。
    2. 成長史（吉祥物／XP／展開清單）不該跟大頭貼/改名擠在同一張卡片裡——`profile.tsx`
       拆成「個人資料」「成長史」兩張各自獨立的卡片區塊（各自有自己的 section title），
       原本卡片內部的 dashed 分隔線樣式跟著拿掉。
    3. 圖示要換成跟 tab bar 一樣的線型簡約風格，不要用 emoji——`Icon.tsx` 整個換掉，改用
       `lucide-react-native`（新增依賴，peer dep 是已裝好的 `react-native-svg`，純 JS，
       **不需要重新原生建置**，Metro/`expo start` 重新整理就會生效）。這個套件就是
       apps/web `Icons.tsx` 那組線型圖示（lucide.dev）的官方 RN 版本，圖示名稱/路徑跟 web
       版同源，只有 3 個圖示在新版 lucide 改了名字（`check-circle`→`CircleCheck`、
       `home`→`House`、`bar-chart`→`ChartColumn`），對照 SVG path 資料確認過是同一個圖示。
       **踩過的坑**：一開始用根套件的具名匯入（`import { ArrowLeft } from 'lucide-react-native'`），
       `expo export --platform web` 一測發現 bundle 從 3.1MB 漲到 5.3MB、module 數從 1516
       跳到 3296——Metro 對這種全量 barrel re-export 的 tree-shaking 不夠乾淨，即使只用 29
       個圖示還是把全部 3000+ 個圖示打包進去。改成 `lucide-react-native/icons/xxx` 逐一深層
       匯入後，bundle 回到 3.5MB（只比沒有圖示庫的原始 baseline 多 ~0.3MB，符合預期）。
  - 這輪調整驗證過：`tsc --noEmit`、`expo export --platform web`（module 數回到 1397，
    `/profile` 正確輸出）、`expo-doctor` 19/20（同樣跟這次無關的既有問題）。
  - **2026-07-13，使用者實機測試上傳頭像，抓到一個真的 bug＋兩個樣式問題**：
    1. **Bug：`AccountHeader.tsx` 選照片上傳直接丟例外**——
       `Error: Creating blobs from 'ArrayBuffer' and 'ArrayBufferView' are not supported`。
       根因是 RN 的 `Blob` 實作沒辦法從 `fetch()` 內部轉出的 `ArrayBuffer` 建立 Blob，原本寫的
       `fetch(uri).then(r => r.blob())` 在 RN 上傳本機圖片這條路徑上行不通（web 版沒這個問題，
       瀏覽器的 `fetch().blob()` 沒有這個限制）。**修法**：改用 `XMLHttpRequest`
       以 `responseType: 'blob'` 直接讀取本機 URI（RN 社群／Firebase Storage RN 文件都用這個
       workaround，是原生模組認得的 Blob 來源），新增 `uriToBlob()` helper 取代原本的
       fetch 寫法。
    2. **樣式：縮放拉桿在深色主題下整條變成一坨白色**——原本只設定了
       `minimumTrackTintColor`，`maximumTrackTintColor`／`thumbTintColor` 留預設（淺灰/白，
       設計給淺色背景用），在強制深色主題下滑軌+拉桿糊成一片看不出层次。補上深色主題對應的
       `maximumTrackTintColor="#88889940"`。
    3. **樣式：頭像編輯模式的外框只在最上緣露出一小段橘色，不是完整虛線圓**——
       `borderStyle: 'dashed'` 疊在圓形（`borderRadius: 50%`）上是 React Native 已知的平台
       限制，虛線間距沒辦法正確沿著曲線計算，不是我們的樣式參數寫錯。**修法**：改用純色實線框
       （拿掉 `borderStyle: 'dashed'`），一樣能表達「進入編輯模式」，不會有這個算不出來的問題。
  - **2026-07-13 追加，使用者三項介面回饋**（不是 bug，是設計調整）：
    1. 縮放拉桿左側的放大鏡圖示拿掉。
    2. 成長史從「卡片內展開/收合清單」改成點「查看全部 ›」用 RN `Modal`（`animationType="slide"`，
       從底部滑入）彈出完整清單，右上角 X 關閉——不再佔用個人資料頁的常駐版面。
    3. 改名輸入框的文字是黑色看不清楚——`TextInput` 不像 `Text`／`View` 有走 `components/Themed.tsx`
       自動套主題色，是 RN 原生元件，沒特別設定就吃系統預設黑字，在深色底自然隱形。補上
       `color: '#e6e6e6'`（跟其他文字元件一致的淺色）。順手確認過整個 apps/mobile 只有這一處
       用到 `TextInput`，沒有其他地方會有同樣問題。
  - **Android 模擬器沒有內建相簿圖片可測試上傳**：模擬器預設空的，這次直接用 `adb push` 把
    `~/桌布/` 底下三張圖推進 `/sdcard/Pictures/`，再用
    `adb shell am broadcast -a android.intent.action.MEDIA_SCANNER_SCAN_FILE -d file://...`
    觸發媒體掃描讓系統相簿索引到，讓使用者能在 Android 上實測選照片上傳這條路徑
    （純測試用的暫時檔案，不是專案的一部分，不影響 repo）。
  - **2026-07-13，使用者確認「功能測試 OK」**——上傳頭像（含 Android，用上面塞進去的測試圖）、
    拖曳/縮放、改名、放大鏡移除、成長史彈窗、輸入框文字顏色，全部驗證過沒問題。
    **Phase 6 到此真正完成**，已 commit 並 push 到 `origin/dev`。
- [ ] **Phase 7**（視是否加 OAuth 才需要）：Clerk native SSO redirect 的 Dashboard 設定。
- [ ] **UI 全面對齊 apps/web 窄螢幕樣式**（2026-07-13 實作完成，**完全沒有原生重建／真機驗證過，
      風險最高，需要先重新原生建置才能測**）
  - 使用者要求「RN 專案的 UI 對齊網頁的窄螢幕樣式，要完全一模一樣」，範圍是全部畫面
    （Home／ChapterMap／Quiz／Notes／QuestionBook／Stats／Profile），並確認要做到「含缺角與
    自訂字型的像素級還原」（AskUserQuestion 問過，不是我自己假設的範圍）。
  - 新增 `constants/theme.ts`：把 `apps/web/src/index.css` 的 `:root` CSS variables（顏色／
    notch 尺寸）整套搬進 RN 常數，之後任何畫面要用顏色都從這裡引用，不再各自硬編十六進位色碼。
  - 新增 `components/NotchedView.tsx`：RN 沒有原生 `clip-path`，用 `react-native-svg` 的
    `Polygon` 畫一個缺角多邊形當背景（`onLayout` 量到實際寬高才畫，第一幀會有一瞬間無背景，
    是可接受的 trade-off），取代網頁版 `.question-card`／`.note-card`／`.login-box`（notch=18，
    切右上/左下）與 `.primary-btn`（notch-sm=12，切左上/右下）的 clip-path 缺角造型。
  - 新增 `components/Button.tsx`（PrimaryButton／SecondaryButton／TextButton）、
    `components/XpBar.tsx`（cyan→primary 漸層進度條，用新裝的 `expo-linear-gradient`）、
    `components/TabBarButton.tsx`（讓底部 tab bar 選中分頁露出 2px primary 色細線，
    對照 index.css `.navbar-tab.is-active` 在 `@media(max-width:640px)` 的樣式）。
  - **新增字型**：裝 `@expo-google-fonts/jetbrains-mono`／`@expo-google-fonts/noto-sans-tc`
    （跟 `apps/web/src/app/layout.tsx` 從 Google Fonts 載入的同一組 weight：JetBrains Mono
    400/500/700/800、Noto Sans TC 400/500/700/900），`app/_layout.tsx` 的 `useFonts` 換成載入
    這 8 個字重，取代原本沒被用到的 Expo 模板預設字型 `SpaceMono`。畫面裡凡是網頁版
    `font-family:var(--font-mono)`／`var(--font-sans)` 的地方都改引用 `theme.ts` 對應的
    `fonts.mono.*`／`fonts.sans.*` weight-specific family 名稱（RN 自訂字型不能用
    `fontFamily+fontWeight` 組合模擬粗細，要載入時就分開每個字重）。
  - `constants/Colors.ts`／`components/Themed.tsx`：`dark` 主題改成直接對照 `theme.ts` 的
    `colors.bg`／`colors.ink`（原本是 Expo 模板預設的 `#121212`／`#e6e6e6`，跟網頁版的星際深色
    主題完全不同色），`Text` 元件預設套上 `fonts.sans.regular`（對照網頁版 `body{font-family:
    var(--font-sans)}`）。
  - 逐畫面把 hard-coded 的通用色碼（`#2e78b7`／`#88889910` 這類 Expo 模板殘留色）換成
    `theme.ts` 的網頁版色票，並把所有 `borderRadius` 拿掉（網頁版 `--radius:0`，RN View 預設
    `borderRadius` 本來就是 0，不用特別寫）。過程中也順手修正了幾個現有程式碼跟網頁版行為
    不一致的地方（都是照網頁版 index.css/JSX 逐一核對抓出來的）：
    - `ChapterMap.tsx` 的 `levelDone`（完成關卡的綠色底）：網頁版 `.level-done` 這個
      class 在 index.css 裡其實沒有對應規則（沒視覺效果），只有 `:disabled` 的鎖定關卡才變半透明，
      mobile 原本畫的綠色底是多出來的，已拿掉。
    - `Home.tsx` 的今日日期 pill：`is-today` 應該蓋掉 `is-done` 的底色（CSS source order
      `.is-today` 排在 `.is-done` 後面），原本 mobile 的 style array 順序相反，已對調。
    - `QuestionCard.tsx`／`QuestionReview.tsx` 的 `is-dimmed` 選項透明度：網頁版是 `0.4`，
      mobile 原本寫 `0.5`。
    - `QuestionCard.tsx`／`QuestionReview.tsx`／`Quiz.tsx` 補齊網頁版有但 mobile 缺的幾個
      視覺元素：收藏星號改用 lucide `fill` prop 真的填滿（不是只變色）、feedback 標題列補上
      對應圖示、「延伸閱讀」連結補上 book-open 圖示、下一題按鈕補上 flag/arrow-right 圖示、
      Quiz 結算畫面補上 `Mascot`／全對時的獎盃圖示、答題頁 header 補上會依照 XP 換階段表情的
      吉祥物 emoji（`quiz-pet`，先前完全沒渲染這個元素）。
    - `Profile.tsx` 的「學習統計」四格：網頁版在 `@media(max-width:480px)`（幾乎所有手機寬度
      都會落在這個斷點內）是單欄橫列（標籤在左、數字在右），不是桌面版的 4 欄 grid，
      mobile 原本用的是 2 欄 wrap grid，已改成對照手機斷點的單欄橫列樣式。
    - `Stats.tsx` 的分科成效長條顏色：mobile 原本用綠色，網頁版 `.chapter-bar-fill` 基底規則
      是 cyan（Stats 頁沒有套用 Home 頁那組 `.chapter-list:nth-child` 的 cyan/primary/wrong
      三色 override，因為那組選擇器只認 `.chapter-list` 這個 class，Stats 用的是
      `.chapter-stat-list`），已改回 cyan。
  - **成長史彈窗（使用者這次特別交代的部分）**：因為 mobile 已經在 Phase 6 把成長史從「卡片內
    展開清單」改成 `Modal` 彈窗（網頁版目前仍是原地展開，兩邊介面結構不同，沒有網頁版樣式可以
    直接照抄），這次是「依照整體設計系統風格新增」：`modalCard` 背景改成 `--card` 深色卡片色
    （不是原本模板殘留的 `#121212`）、拿掉原本的圓角（`borderTopLeftRadius/RightRadius:20`，
    改成跟全站一致的直角 `radius:0`，只保留一條 cyan 邊框分隔線）、標題與清單項目字體/顏色
    全部改用 `theme.ts` 的 mono／sans 字型與色票，維持跟其他卡片一致的視覺語言。
  - **刻意維持、沒有還原成網頁版的兩處差異**（都是先前對話使用者當面要求拿掉的，不是這次漏做）：
    (1) 個人資料不顯示 `USER.XXXXXXXX` 那行（網頁版 `AccountHeader.tsx` 還留著這行，mobile
    在 Phase 6 已經拿掉，這次沒有加回來）；(2) 頭像縮放拉桿左側沒有放大鏡圖示（網頁版
    `avatar-zoom` 還有 `search` icon，mobile 在 Phase 6 已經拿掉，這次也沒加回來）。
  - **這個環境能驗證的都驗證了**：`packages/core`／`apps/web`／`apps/mobile` 三個
    `tsc --noEmit` 過、`apps/mobile` 的 `expo export --platform web` 成功（1601 modules，
    比裝字型/gradient 前的 1516 略增，符合預期）、`expo-doctor` 19/20（唯一沒過的仍是既有的
    metro monorepo 設定，跟這次改動無關）。
  - **完全沒有測過、風險最高的部分（使用者要自己在真機/模擬器驗證才能定案）**：
    1. 這次新增了 `expo-linear-gradient`（xp 進度條漸層）＋兩套 Google Fonts 套件，
       都是原生層級的新依賴，**必須重新 `npx expo run:ios`/`run:android` 完整原生建置**，
       光重啟 `expo start` 不會生效（跟 Phase 2/6 提醒過的規則一致）。
    2. 整體視覺是否真的跟網頁版窄螢幕「一模一樣」——這次是照著 index.css 的數值逐一手動換算成
       RN style，沒有工具能自動比對兩邊的實際渲染像素，需要使用者自己並排網頁版（縮小瀏覽器
       視窗到手機寬度）跟 app 截圖比對。
    3. 缺角卡片（`NotchedView`）用 SVG 畫背景，`onLayout` 量到尺寸前的那一瞬間沒有背景色，
       正常情況下應該快到看不出來，但沒有在真機上實際感受過這個時間差。
    4. 成長史彈窗、頭像編輯、答題流程等既有功能這次只有動樣式沒有動邏輯，理論上功能行為不受
       影響，但沒有重新整輪測過。
  - 尚未 commit，等使用者原生重建後測過視覺／功能都沒問題才能 commit。
  - **2026-07-13 追加，使用者實機測試回報兩個問題**：
    1. Android 點個人資料 tab 直接丟 `IllegalViewOperationException: Can't find ViewManager
       'ViewManagerAdapter_ExpoLinearGradient'`——確認就是原生依賴沒重建，`expo start` 不會
       重新連結新裝的 `expo-linear-gradient`，需要 `npx expo run:android`。
    2. iOS 模擬器上「成長史」卡片的 XP 進度條顯示一塊「Unimplement...」的灰色佔位框——同一個
       根因，iOS 跟 Android 是各自獨立的原生專案，Android 重建過不代表 iOS 也連結了，需要
       另外 `npx expo run:ios`。
    3. （同一輪回報）近半年學習熱力圖沒有預設捲到今天，要手動往右滑才看得到——這是 Phase 5
       就存在、從來沒被使用者實測過的舊問題，不是這次改動造成的。原本只掛
       `onContentSizeChange` 觸發 `scrollToEnd`，在 iOS 上有時會搶在這個水平 ScrollView
       自己的 viewport 寬度量到之前就先觸發，算出來的捲動位置不準。修法：額外掛 `onLayout`
       也觸發同一個函式，並包一層 `requestAnimationFrame` 讓捲動盡量等這輪版面真的
       commit 完再執行（`screens/Stats.tsx`）。**這個修法沒有模擬器可以實測，只是邏輯上的
       強化，需要使用者重建後確認。**
  - **2026-07-13 再追加，使用者回報成長史彈窗底部有奇怪的黑色背景（第一輪判斷錯誤，見下）**：
    第一輪猜測根因是 RN 核心 `<Modal>` 在 Android 上另開系統 `Dialog` 視窗、不繼承 app 主視窗
    的 edge-to-edge／安全區設定，因此整個拿掉 `<Modal>`，改成同一棵 React tree 裡的絕對定位
    覆蓋層（`position:'absolute'`，順手把「點背景關閉」也補上）。**使用者重建後回報黑底依舊
    存在**——證明 Modal 完全不是根因（拿掉之後問題還在）。
    - **真正根因**：`<ScrollView>`（包住 `<GrowthHistory>` 清單）沒有給 `flexShrink`，
      放在只有 `maxHeight`（沒有固定 `height`）的父層 `modalCard` 裡時，Yoga 預設不會讓它
      乖乖依內容縮小，而是撐開去填滿 `maxHeight` 的上限——清單實際內容（12 個階段，遠不到
      `maxHeight:75%` 的高度）結束後，卡片下半部留了一大塊空的 `colors.card`（`#0a1216`，
      深色主題下跟純黑幾乎無法用肉眼分辨）背景，看起來就像「一塊怪異的黑色」。
    - **修法**：`ScrollView` 補上 `style={{flexShrink:1}}`（讓它可以縮到比內容還小，這是這個
      RN pattern——「maxHeight 容器裡包一個高度不固定、內容短時要貼合內容的 ScrollView」——
      的標準解法），並把原本掛在 `modalCard` 外層的 `paddingBottom: insets.bottom+16`
      移進 `ScrollView` 的 `contentContainerStyle`，讓安全區留白緊貼在清單最後一項後面、
      而不是卡片外層一塊獨立算出來、跟清單實際高度脫勾的空間。
    - **教訓**：這類「RN 容器留白/黑塊」的視覺 bug，先檢查是不是 `ScrollView`／可捲動容器
      在 `maxHeight`-限制的父層裡沒設 `flexShrink` 撐開了不該有的空間，比先假設是原生視窗/
      安全區問題更該優先排查——後者(Modal 分離視窗)雖然是真實存在的平台限制，但這次並不是
      這個 bug 的成因，**拿掉 `<Modal>` 這個改動本身沒有錯（仍然是比較穩妥的架構，順手修好
      的「點背景關閉」也是真的改善），只是它沒有解到使用者回報的這個黑底問題，之後如果
      再遇到全螢幕覆蓋層的怪異留白，直接先看 ScrollView 有沒有 flexShrink，不用重新走一次
      Modal 分離視窗的排查路徑。**
    - 同樣沒有模擬器可以實測，需要使用者重建後（這次是純 JS 邏輯改動，理論上不需要重新
      原生建置，reload 就會生效）確認黑底真的消失。
  - **2026-07-13 第三輪，使用者回報 flexShrink 那次修完問題依舊，且不接受再猜——這次改用
    RN 內建 Element Inspector（`Cmd+D` → Show Element Inspector）直接點選問題區塊，
    才抓到真正根因**：
    - Inspector 顯示被點到的元素（`modalHeader`／`heroXpRow` 這類純版面用的 row 容器）
      實際 `backgroundColor` 是 `#04070a`，但這兩個 style 物件根本沒有寫
      `backgroundColor` 這個屬性——代表這個顏色不是我寫的樣式套上去的，是別的地方硬塗上去的。
    - 查出來是 `app/(tabs)/profile.tsx` 這支檔案的 `import { Text, View } from
      '@/components/Themed'`：`components/Themed.tsx` 的 `View` 元件只要呼叫端沒有明確給
      `backgroundColor`，就會**強制**塗上整頁背景色 `colors.bg`（`#04070a`）。這個顏色跟卡片色
      `colors.card`（`#0a1216`）非常接近、單獨看幾乎分不出來，但當一個純版面用的 row/column
      容器（沒特別設背景）疊在卡片內部時，就會用 `#04070a` 蓋掉卡片本來的 `#0a1216`，
      在有邊界的地方（例如這個 row 剛好佔滿卡片下半部）看起來就是「一塊比周圍明顯偏黑的
      區域」——這就是使用者一路回報的「黑色背景」，跟 Modal、ScrollView flexShrink、
      insets 都無關，前兩輪修法方向完全錯了。
    - **檢查範圍**：`grep` 過整個 `apps/mobile`，這次改版所有畫面裡，只有
      `app/(tabs)/profile.tsx` 跟沒動過的 `app/+not-found.tsx`／`app/sso-callback.tsx`
      會從 `@/components/Themed` 匯入 `View`；其餘畫面（Home／ChapterMap／Quiz／
      QuestionCard／QuestionReview／Notes／QuestionBook／Stats／AccountHeader／Mascot／
      GrowthHistory）都只匯入 `Text`，版面用的 `View` 本來就是從 `react-native` 直接拿
      （預設透明），所以這個 bug**只出現在 profile.tsx 這一支檔案**，不是全站性的。
    - **修法**：`profile.tsx` 的 `View` 改成從 `react-native` 直接匯入（不再用 Themed 版），
      `Text` 仍保留 Themed 版本（`Text` 只影響文字顏色，不會有「蓋住底下內容」的問題，
      不受這個 bug 影響）。原本仰賴 Themed View 預設塗色的 `container` style（登入中的
      loading 畫面用）額外補上明確的 `backgroundColor: colors.bg`，避免拿掉預設塗色後
      這個情境變透明。
    - **教訓**：這類「顏色看起來對不上」的 bug，之後優先用 RN 內建 Element Inspector 或
      React DevTools 直接點出實際套用的 style 值，不要只憑程式碼推論或猜測平台限制
      （Modal 分離視窗、ScrollView maxHeight 那兩輪都是合理但錯誤的推論，实測工具一次就
      定位到真正原因）。也提醒：`Themed.tsx` 的 `View` 元件「沒寫 backgroundColor 就強制
      塗上整頁背景色」這個設計，只適合拿來當「畫面最外層的頁面背景容器」用，**不要拿它
      當純版面用的 row/column 容器**（那種情境要用 `react-native` 原生的 `View`），
      以後這個專案或其他用同一套 Expo 模板起家的專案都要注意這個界線。
    - 這次已經在使用者的 Element Inspector 截圖上直接對照原始碼確認 `#04070a` 對應
      沒設 `backgroundColor` 的 `heroXpRow`／`modalHeader`，可信度比前兩輪高，但**修完
      這版還是沒有經過使用者重新整理後的實機確認，不能標記完成**。
    - **使用者測完回報：黑底問題確實解決了**，同時新發現「捲動畫面時內容會跟頂部系統
      狀態列（時間/電量）重疊」。根因是 `profile.tsx` 原本把 `insets.top` 的安全區留白
      直接寫進 `ScrollView` 的 `contentContainerStyle`（屬於可捲動內容的一部分），往上捲
      一下這塊留白就跟著捲走，底下內容接著就畫到狀態列後面去了。其他三個 tab（Home／Notes／
      Stats）本來就沒有這個問題，因為它們是在 `app/(tabs)/index.tsx`／`notes.tsx`／`stats.tsx`
      外層包一個**不會捲動**的 `View`（自己的 `paddingTop:insets.top`，不屬於任何 ScrollView
      的內容），只有 `profile.tsx` 這支是把整個畫面自己組出來、沒有套用這個既有的固定安全區
      包裝模式。**修法**：把 `insets.top` 從 `contentContainerStyle` 移到外層新增的
      `screenWrap`（`flex:1, backgroundColor: colors.bg`）自己的 `paddingTop`，讓這塊
      留白變成固定不捲動的區域，跟其他三個 tab 的作法一致。**這輪修法尚未經使用者驗證。**
  - **2026-07-13 又追加，使用者回報 iOS 模擬器成長史彈窗滑不到最後 3 個階段（超新星／星雲／
    黑洞），只看得到前 9 個；Android 捲動正常**：確認是（先問過使用者「是完全看不到多滑的
    內容、還是內容都在只是滑不動」釐清屬於後者，不是「本來就沒有更多內容」的誤判）
    上一輪加的 `ScrollView` `flexShrink:1` 在 iOS／Android 上算出來的實際可捲動框架不一致——
    Android 正確、iOS 疑似把可捲動框架算得比視覺內容還小（內容因為 `overflow:visible` 還是
    看得到，但手指划的範圍在框架外，滑不動）。**修法**：改用 `flex:1`（不是 `flexShrink:1`），
    讓 Yoga 直接用「`modalCard` 扣掉 header 後的剩餘空間」決定 ScrollView 框架大小，不透過
    內容自身高度做縮放計算。這個改法之所以安全：`GrowthHistory` 固定顯示全部 12 個階段，
    內容高度不會因進度而變短，不用擔心 `flex:1` 在內容偏短時把卡片撐到 `maxHeight` 上限
    留空白（那個「撐開留空白」的擔心本來就是上一輪的假設，這次的黑底 bug 已經證實是
    Themed View 蓋色造成的，跟 flexShrink/flex 的選擇無關，所以換掉不會有回歸風險）。
    **這輪修法尚未經使用者驗證。**
    - **使用者測完回報：改用 `flex:1` 之後兩個平台都壞了，連內容都看不到**（iOS/Android
      皆是），比原本只有 iOS 滑不到最後幾項還更糟。根因查出來：`modalCard` 自己沒有固定
      `height`（只有 `maxHeight` 上限），`ScrollView` 給 `flexGrow:1`（`flex:1` 隱含）等於
      要求「長到填滿父層可用空間」，但父層自己的高度是靠內容反推的（`flexBasis:auto` 加
      `maxHeight` 上限），這種「子層要長滿、父層要靠子層決定大小」互相依賴的情況 Yoga
      解不出明確答案，兩邊乾脆都塌縮成 0——這是這幾輪裡我學到最扎實的一條：**`flexGrow`／
      `flex:1` 只能用在父層有明確（不是靠內容反推、不是只有 maxHeight 上限）高度的情境**，
      這次的父層不符合這個前提，是我沒有先確認就套用的錯誤。
    - **改法（第三次嘗試，這次換一個完全不同、不依賴 flex 協商的策略）**：不再讓 ScrollView
      的高度依賴跟父層的 flex 協商，改用 `useWindowDimensions()` 量出實際螢幕高度，算出一個
      **明確的數字** `growthModalMaxHeight = windowHeight * 0.75 - 80`（80 是標題列＋卡片
      padding 的估計扣除量），直接當 `<ScrollView style={{maxHeight: 數字}}>` 的 `maxHeight`。
      這是 ScrollView 最基礎、最不會出錯的標準用法——內容超過這個明確數字就自動可捲動，
      不需要 Yoga 去解任何父子互相依賴的 flex 協商，兩個平台算出來的結果理論上會一致。
      `modalCard` 自己的 `maxHeight:'75%'` 保留（當一個無害的外層保險上限，反正 ScrollView
      自己的數字上限已經比它小，實際生效的是 ScrollView 這層）。
    - **這輪修法尚未經使用者驗證，且是同一個子問題（成長史彈窗捲動）第三次嘗試修**，
      如果這次還是不行，下次不要再用 flex 相關屬性猜，直接考慮把整個彈窗改成用
      `FlatList`／固定像素高度的簡單方案，或請使用者用 React DevTools 直接量測
      `ScrollView` 實際 render 出來的 frame/contentSize 數字。
    - **使用者測完回報：加上 onLayout/onContentSizeChange log 量出來的數字完全正常**
      （`modalCard` 653、ScrollView 可視區域 575.3、內容高度 760，內容確實比可視區域高
      約 185px），**但滑動依舊沒反應**——這組數字第一次證實版面尺寸從頭到尾都沒問題，
      問題出在別的地方。
    - **第四輪，終於抓到真正根因**：`modalCard` 外層包了一個 `Pressable`
      （`onPress={(e) => e.stopPropagation()}`，用來擋「點卡片內部不要連動關閉背景遮罩」），
      這個 `Pressable` **直接包住了 ScrollView**——Touchable/Pressable 包住 ScrollView 在
      iOS 上是已知會搶走捲動手勢的問題類別（Pressable 為了顯示按壓回饋，一碰到就搶著宣告
      自己是 responder，導致 ScrollView 原生的 pan 手勢辨識器拿不到那個觸控）。**修法**：
      `modalCard` 改用 `View`（拿掉 `Pressable`／`stopPropagation`），代價是「點卡片內部
      空白處會誤觸關閉彈窗」這個保護跟著沒了——這是刻意接受的取捨，捲不動的清單是更嚴重的
      問題。**這輪修法尚未經使用者驗證，是同一個子問題第四次嘗試**。
    - **教訓**：這次的排查順序值得記下來——(1) 先懷疑版面尺寸算錯（flexShrink/flex 那兩輪，
      都錯），(2) 用量測數字排除版面尺寸這個可能性，(3) 數字排除之後才轉向手勢/觸控衝突
      這個完全不同類別的原因，一次就找對。**同一個症狀（滑不動/內容被截斷）不代表原因只有
      一種，量測數字能幫忙排除掉一整類假設，不用每次都重新從頭猜。**
    - **第五輪，使用者回報拿掉 modalCard 的 Pressable 之後更糟**：現在點卡片內容會直接觸發
      關閉彈窗，而且還是完全滑不動。根因：拿掉 modalCard 自己的 Pressable 之後，整棵卡片
      （含 ScrollView）都還是包在 `modalBackdrop` 這個外層 `Pressable` 底下——問題本來就不是
      「哪一層 Pressable」，而是「任何 Pressable 只要是 ScrollView 的祖先節點，就會搶走
      iOS 的捲動手勢」，加上少了 modalCard 自己的 stopPropagation，現在連點擊都直接冒泡到
      最外層的 `modalBackdrop.onPress` 觸發關閉。
    - **正確架構（這次徹底改結構，不再只是調參數）**：背景（點擊關閉）跟卡片本體改成
      **手足關係**，不是卡片包在背景 Pressable 裡面：
      ```
      <View modalRoot>                         {/* 純容器，不接觸控 */}
        <Pressable modalBackdrop onPress={close} />  {/* 鋪滿全螢幕，負責變暗＋點擊關閉 */}
        <View modalCardWrap pointerEvents="box-none">  {/* 鋪滿全螢幕、flex-end 對齊，
                                                            自己不接觸控只負責排版 */}
          <View modalCard>...header/ScrollView...</View>
        </View>
      </View>
      ```
      RN 的觸控命中測試是照畫面上實際疊放的視覺樹（不是純粹的 React 元件父子關係）由上而下
      找最上層的視圖決定要交給誰處理：點在卡片本體範圍內，會直接命中卡片自己的畫面元素
      （因為卡片視覺上疊在背景「上面」，即使兩者在 React tree 裡是手足不是父子），不會經過
      `modalBackdrop` 的 `Pressable`；只有點在卡片以外、真正露出背景的空白處，才會落到
      `modalBackdrop` 上觸發關閉。`modalCardWrap` 用 `pointerEvents="box-none"`：這層本身
      鋪滿全螢幕只是為了用 `justifyContent:'flex-end'` 排版卡片位置，`box-none` 讓它自己
      不吃觸控（沒被卡片佔到的空白部分的觸控會穿過它，落到底下的 `modalBackdrop`），只有
      它的子節點（卡片本體）會正常接收觸控。這樣 ScrollView 的祖先鏈裡完全沒有任何
      Pressable/Touchable，捲動手勢不會被搶。
    - **這是同一個子問題第五次修，這次是結構性重寫、不是調參數。使用者已在 iOS 模擬器
      實測確認：黑底、狀態列重疊、無法捲動、誤觸關閉四個問題全部解決。** 完整踩坑筆記
      （含每一輪為什麼猜錯、最終正確架構）已整理進
      `~/my-agent/000_Agent/knowledge/learn/EasyLearn/feedback_rn-profile-modal-overlay-bugs.md`，
      跨專案通用的 RN 教訓也記到全域 CLAUDE.md。

## 驗證紀律（跨 phase 都適用）

- 這個環境能檢查的：`tsc --noEmit`、`oxlint`、`next build`、之後 mobile 端的 `expo-doctor`／`tsc`。這些過了只代表型別/建置沒問題，不代表功能正確。
- **使用者偏好自己在瀏覽器／真機驗證，不要用 Playwright（或任何自動化）幫使用者做「畫面/功能已驗證」的結論。** 每次一個 phase 完成到「可以看畫面」的程度，直接給使用者：(1) 要在哪個目錄下指令、(2) 指令是什麼、(3) 開哪個網址／怎麼開 app，不要自己截圖宣稱驗證過。
- 尤其 Phase 2 之後任何 native/裝置相關行為（手勢、鍵盤、Clerk native SSO、native module 是否真的 rebuild 生效），**只有使用者在真機/模擬器測過才能標記完成**，這裡不要提前打勾。
