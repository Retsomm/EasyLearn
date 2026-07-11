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

const MAX_XP_PER_REQUEST = 1000
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

const isValidDateStr = (value: string) => DATE_RE.test(value) && !Number.isNaN(new Date(value).getTime())

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
