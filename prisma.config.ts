import 'dotenv/config'
import { defineConfig, env } from '@prisma/config'

// `prisma migrate`／`prisma generate` 用這裡設定的連線字串。用 DIRECT_URL（非連線池）
// 是因為 Supabase 的 pgbouncer 連線池（transaction mode）不支援跑 migration 需要的 DDL／prepared statement。
export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DIRECT_URL'),
  },
})
