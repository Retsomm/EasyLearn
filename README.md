# EasyLearn
<img width="1024" height="500" alt="feature-graphic-1024x500" src="https://github.com/user-attachments/assets/9d91eb20-927c-47d5-b0e2-3f925f0b259f" />
JavaScript／React 學習刷題 App：關卡制刷題（對照 MDN《JavaScript Guide》與 react.dev
《Learn React》規劃課綱）、錯題本（Leitner 盒制）、收藏題、XP／連續學習／成長史動畫、
近半年學習熱力圖，支援訪客離線模式與 Google 登入雲端同步。同時有網頁版（PWA）與 Android／iOS
原生 App 兩種型態。

## 專案結構

Yarn workspaces monorepo：

- `apps/web` — Next.js（App Router）網頁版，含 API routes（Prisma + Postgres）與 Clerk 登入
- `apps/mobile` — Expo React Native App（Expo Router，含 iOS／Android 專案），Clerk 登入，
  已備妥 Google Play 上架素材與 EAS Build 設定
- `packages/core`（`@easylearn/core`）— web／mobile 共用的純資料與純函式（題庫、章節、
  型別、抽題／計分邏輯），不依賴 DOM／Prisma

## 技術棧

- **Web**：Next.js 16、React 19、Prisma 7 + `@prisma/adapter-pg`、PostgreSQL（Supabase 代管）
- **Mobile**：Expo（SDK 57）、Expo Router、React Native 0.86、Reanimated
- **共用**：TypeScript、Clerk（Google 登入，web／mobile 共用同一組 publishable key）

## 開發

```bash
yarn install              # repo 根目錄安裝一次即可（會連動 apps/mobile 的 postinstall）

# 網頁版
yarn web                  # 等同 yarn workspace web dev
yarn web:build             # tsc --noEmit && next build
yarn web:lint               # oxlint
yarn web:typecheck

# mobile（在 apps/mobile 目錄下）
yarn workspace mobile start   # expo start
yarn workspace mobile ios     # expo run:ios
yarn workspace mobile android # expo run:android
yarn mobile:typecheck
```

環境變數：複製 `apps/web/.env.example` → `apps/web/.env.local`、
`apps/mobile/.env.example` → `apps/mobile/.env.local`，依註解填入 Clerk 與 Supabase 連線資訊。
mobile 需要能連到 `apps/web` 的 API base URL（模擬器/真機連不到 localhost，需填區網 IP 或
Expo tunnel）。

## 文件

- [docs/roadmap.md](docs/roadmap.md) — 功能規劃與優先順序總覽
- [docs/rn-migration.md](docs/rn-migration.md) — PWA → RN 遷移逐 phase 進度與踩坑記錄
- [docs/curriculum.md](docs/curriculum.md) — 課綱對照表（MDN／react.dev ↔ 關卡）
- [docs/question-format.md](docs/question-format.md) — 題目 JSON schema 說明
