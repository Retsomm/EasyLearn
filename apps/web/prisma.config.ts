import 'dotenv/config'
import { defineConfig } from '@prisma/config'

// `prisma migrate`／`prisma generate` 用這裡設定的連線字串。用 DIRECT_URL（非連線池）
// 是因為 Supabase 的 pgbouncer 連線池（transaction mode）不支援跑 migration 需要的 DDL／prepared statement。
//
// 這裡沒有讀到 DIRECT_URL 時退回一個不會真的連線的假字串，不用 @prisma/config 的 env()
// helper（讀不到就直接 throw）——因為 Yarn 1 workspaces 的 `postinstall` 是整個 monorepo
// 一起跑，只想裝 apps/mobile 依賴的 `yarn install`（例如 EAS Build）也會觸發這支
// `prisma generate`，但那個環境本來就不會、也不需要有 apps/web 的資料庫連線字串。
// `prisma generate` 本身不需要真的連得上資料庫，只有 `prisma migrate`／正式執行期的
// `@prisma/client` 才需要真正有效的 DIRECT_URL／DATABASE_URL（由 apps/web 自己的
// .env.local 或 Vercel 環境變數提供，這裡的 fallback 不影響那邊）。
export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DIRECT_URL ?? 'postgresql://placeholder:placeholder@localhost:5432/placeholder',
  },
})
