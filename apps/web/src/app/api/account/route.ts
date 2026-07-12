import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export const DELETE = async () => {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  // 先刪資料庫紀錄、再刪 Clerk 帳號：如果 Clerk 那步失敗，使用者還能用同一個 session 重試；
  // 反過來的話，Clerk 帳號沒了會直接無法再驗證身分，留下永遠孤兒化的資料庫紀錄
  try {
    await prisma.user.deleteMany({ where: { id: userId } })
  } catch (err) {
    console.error('[account] failed to delete prisma records', userId, err)
    return NextResponse.json({ error: 'delete failed' }, { status: 500 })
  }

  try {
    const client = await clerkClient()
    await client.users.deleteUser(userId)
  } catch (err) {
    console.error('[account] failed to delete clerk user', userId, err)
    return NextResponse.json({ error: 'delete failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
