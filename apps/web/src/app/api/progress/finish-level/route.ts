import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { bumpStreakServer } from '../../../../lib/progressLogic'
import { loadFullProgress } from '../../../../lib/progressStore'

export const dynamic = 'force-dynamic'

interface FinishLevelBody {
  levelId: string
  correct: number
  total: number
  xpEarned: number
  today: string
}

export const POST = async (request: Request) => {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { levelId, correct, total, xpEarned, today } = (await request.json()) as FinishLevelBody

  const [user, prevLevel] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    prisma.completedLevel.findUnique({ where: { userId_levelId: { userId, levelId } } }),
  ])

  const streak = bumpStreakServer({ count: user.streakCount, last: user.streakLast }, today)

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { xp: { increment: xpEarned }, streakCount: streak.count, streakLast: streak.last },
    }),
    prisma.completedLevel.upsert({
      where: { userId_levelId: { userId, levelId } },
      update: { best: Math.max(prevLevel?.best ?? 0, correct), total },
      create: { userId, levelId, best: correct, total },
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
