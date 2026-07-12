# EasyLearn

Yarn workspaces monorepo：

- `apps/web` — Next.js（App Router）網頁版，含 API routes（Prisma + Postgres）與 Clerk 登入
- `apps/mobile` — Expo React Native App（規劃中，尚未建立）
- `packages/core` — web／mobile 共用的純資料與純函式（題庫、型別、計算邏輯），無 DOM／Prisma 依賴

## 開發

```bash
yarn install        # repo 根目錄安裝一次即可
yarn web            # 啟動網頁版（等同 yarn workspace web dev）
```

其餘文件見 `docs/`（`roadmap.md`、`curriculum.md`、`question-format.md`）。
