import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { bumpStreakServer } from '../../../../lib/progressLogic'
import { loadFullProgress } from '../../../../lib/progressStore'

export const dynamic = 'force-dynamic'

interface FinishReviewBody {
  xpEarned: number
  today: string
}

export const POST = async (request: Request) => {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { xpEarned, today } = (await request.json()) as FinishReviewBody

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })
  const streak = bumpStreakServer({ count: user.streakCount, last: user.streakLast }, today)

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { xp: { increment: xpEarned }, streakCount: streak.count, streakLast: streak.last },
    }),
    prisma.xpLog.upsert({
      where: { userId_date: { userId, date: today } },
      update: { amount: { increment: xpEarned } },
      create: { userId, date: today, amount: xpEarned },
    }),
  ])

  const { progress } = await loadFullProgress(userId)
  return NextResponse.json({ progress })
}
