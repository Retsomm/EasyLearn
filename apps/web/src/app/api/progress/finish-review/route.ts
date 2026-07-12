import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { bumpStreakServer, isValidDateStr, MAX_XP_PER_REQUEST } from '@/lib/progressLogic'
import { loadFullProgress } from '@/lib/progressStore'

export const dynamic = 'force-dynamic'

interface FinishReviewBody {
  xpEarned: number
  today: string
}

export const POST = async (request: Request) => {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { xpEarned, today } = (await request.json()) as FinishReviewBody

  if (!Number.isInteger(xpEarned) || xpEarned < 0 || xpEarned > MAX_XP_PER_REQUEST) {
    return NextResponse.json({ error: 'invalid xpEarned' }, { status: 400 })
  }
  if (typeof today !== 'string' || !isValidDateStr(today)) {
    return NextResponse.json({ error: 'invalid today' }, { status: 400 })
  }

  await prisma.$transaction(async (tx) => {
    // upsert 確保第一次登入的使用者列一定存在；streak 也在同一個交易內讀取，
    // 縮小跟併發請求互相讀到舊 streak 狀態的競態窗口
    const user = await tx.user.upsert({ where: { id: userId }, create: { id: userId }, update: {} })
    const streak = bumpStreakServer({ count: user.streakCount, last: user.streakLast }, today)

    await tx.user.update({
      where: { id: userId },
      data: { xp: { increment: xpEarned }, streakCount: streak.count, streakLast: streak.last },
    })

    await tx.xpLog.upsert({
      where: { userId_date: { userId, date: today } },
      update: { amount: { increment: xpEarned } },
      create: { userId, date: today, amount: xpEarned },
    })
  })

  const { progress } = await loadFullProgress(userId)
  return NextResponse.json({ progress })
}
