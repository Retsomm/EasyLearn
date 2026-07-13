import type { Prisma } from '@prisma/client'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidDateStr } from '@/lib/progressLogic'
import { loadFullProgress } from '@/lib/progressStore'

export const dynamic = 'force-dynamic'

interface AnswerBody {
  questionId: string
  correct: boolean
  chapterId?: string
  today: string
}

// 答題後更新錯題本＋每日／分科作答統計，規則跟 useProgress.ts 的 answerQuestion 一致：
// 答錯→記入或重置錯題紀錄；答對→只要這題還在錯題本裡就直接刪除（答對一次就畢業）
export const POST = async (request: Request) => {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { questionId, correct, chapterId, today } = (await request.json()) as AnswerBody

  if (typeof questionId !== 'string' || questionId.length === 0) {
    return NextResponse.json({ error: 'invalid questionId' }, { status: 400 })
  }
  if (typeof correct !== 'boolean') {
    return NextResponse.json({ error: 'invalid correct' }, { status: 400 })
  }
  if (typeof today !== 'string' || !isValidDateStr(today)) {
    return NextResponse.json({ error: 'invalid today' }, { status: 400 })
  }

  const existing = await prisma.wrongEntry.findUnique({ where: { userId_questionId: { userId, questionId } } })

  // 先算出「這次要寫入哪些操作」（計算），跟下面實際執行交易（動作）分開：
  // 每個分支各自算出自己的 0 或 1 筆寫入，最後展開組成同一份交易清單
  const wrongEntryWrites: Prisma.PrismaPromise<unknown>[] = correct
    ? existing
      ? [prisma.wrongEntry.delete({ where: { userId_questionId: { userId, questionId } } })]
      : []
    : [
        prisma.wrongEntry.upsert({
          where: { userId_questionId: { userId, questionId } },
          update: { count: { increment: 1 }, lastWrong: today, box: 1 },
          create: { userId, questionId, count: 1, lastWrong: today, box: 1 },
        }),
      ]

  const dailyStatWrite = prisma.dailyStat.upsert({
    where: { userId_date: { userId, date: today } },
    update: { total: { increment: 1 }, correct: { increment: correct ? 1 : 0 } },
    create: { userId, date: today, total: 1, correct: correct ? 1 : 0 },
  })

  const chapterStatWrites: Prisma.PrismaPromise<unknown>[] = chapterId
    ? [
        prisma.chapterStat.upsert({
          where: { userId_chapterId: { userId, chapterId } },
          update: { total: { increment: 1 }, correct: { increment: correct ? 1 : 0 } },
          create: { userId, chapterId, total: 1, correct: correct ? 1 : 0 },
        }),
      ]
    : []

  try {
    await prisma.$transaction([...wrongEntryWrites, dailyStatWrite, ...chapterStatWrites])
  } catch (err) {
    console.error('[progress/answer] transaction failed', userId, err)
    return NextResponse.json({ error: 'update failed' }, { status: 500 })
  }

  const { progress } = await loadFullProgress(userId)
  return NextResponse.json({ progress })
}
