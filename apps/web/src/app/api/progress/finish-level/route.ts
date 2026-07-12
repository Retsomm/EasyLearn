import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { bumpStreakServer, isValidDateStr, MAX_XP_PER_REQUEST } from '@/lib/progressLogic'
import { loadFullProgress } from '@/lib/progressStore'

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

  if (typeof levelId !== 'string' || levelId.length === 0) {
    return NextResponse.json({ error: 'invalid levelId' }, { status: 400 })
  }
  if (!Number.isInteger(total) || total < 0) {
    return NextResponse.json({ error: 'invalid total' }, { status: 400 })
  }
  if (!Number.isInteger(correct) || correct < 0 || correct > total) {
    return NextResponse.json({ error: 'invalid correct' }, { status: 400 })
  }
  if (!Number.isInteger(xpEarned) || xpEarned < 0 || xpEarned > MAX_XP_PER_REQUEST) {
    return NextResponse.json({ error: 'invalid xpEarned' }, { status: 400 })
  }
  if (typeof today !== 'string' || !isValidDateStr(today)) {
    return NextResponse.json({ error: 'invalid today' }, { status: 400 })
  }

  await prisma.$transaction(async (tx) => {
    // upsert 確保第一次登入、資料庫還沒有這個使用者列的請求不會炸掉
    const user = await tx.user.upsert({ where: { id: userId }, create: { id: userId }, update: {} })
    const streak = bumpStreakServer({ count: user.streakCount, last: user.streakLast }, today)

    await tx.user.update({
      where: { id: userId },
      data: { xp: { increment: xpEarned }, streakCount: streak.count, streakLast: streak.last },
    })

    // best 只升不降：只有新分數更高才更新 best，否則只同步 total，避免跟另一個併發請求的讀取值互相覆蓋
    const raised = await tx.completedLevel.updateMany({
      where: { userId, levelId, best: { lt: correct } },
      data: { best: correct, total },
    })
    if (raised.count === 0) {
      await tx.completedLevel.upsert({
        where: { userId_levelId: { userId, levelId } },
        update: { total },
        create: { userId, levelId, best: correct, total },
      })
    }

    await tx.xpLog.upsert({
      where: { userId_date: { userId, date: today } },
      update: { amount: { increment: xpEarned } },
      create: { userId, date: today, amount: xpEarned },
    })
  })

  const { progress } = await loadFullProgress(userId)
  return NextResponse.json({ progress })
}
