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
    **新版畫面（拆卡片＋線型圖示）使用者還沒回報看過**，下次要接續先請使用者確認外觀。
- [ ] **Phase 7**（視是否加 OAuth 才需要）：Clerk native SSO redirect 的 Dashboard 設定。

## 驗證紀律（跨 phase 都適用）

- 這個環境能檢查的：`tsc --noEmit`、`oxlint`、`next build`、之後 mobile 端的 `expo-doctor`／`tsc`。這些過了只代表型別/建置沒問題，不代表功能正確。
- **使用者偏好自己在瀏覽器／真機驗證，不要用 Playwright（或任何自動化）幫使用者做「畫面/功能已驗證」的結論。** 每次一個 phase 完成到「可以看畫面」的程度，直接給使用者：(1) 要在哪個目錄下指令、(2) 指令是什麼、(3) 開哪個網址／怎麼開 app，不要自己截圖宣稱驗證過。
- 尤其 Phase 2 之後任何 native/裝置相關行為（手勢、鍵盤、Clerk native SSO、native module 是否真的 rebuild 生效），**只有使用者在真機/模擬器測過才能標記完成**，這裡不要提前打勾。
