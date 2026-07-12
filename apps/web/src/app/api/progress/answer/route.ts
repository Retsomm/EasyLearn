import type { Prisma } from '@prisma/client'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { GRADUATE_BOX } from '@easylearn/core'
import { prisma } from '../../../../lib/prisma'
import { loadFullProgress } from '../../../../lib/progressStore'

export const dynamic = 'force-dynamic'

interface AnswerBody {
  questionId: string
  correct: boolean
  chapterId?: string
  today: string
}

// 答題後更新 Leitner 錯題本＋每日／分科作答統計，規則跟 useProgress.ts 的 answerQuestion 一致：
// 答錯→記入或重置回第 1 盒；答對→有錯題紀錄才升一盒，超過畢業盒就移出錯題本
export const POST = async (request: Request) => {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { questionId, correct, chapterId, today } = (await request.json()) as AnswerBody

  const existing = await prisma.wrongEntry.findUnique({ where: { userId_questionId: { userId, questionId } } })

  // 先算出「這次要寫入哪些操作」（計算），跟下面實際執行交易（動作）分開：
  // 每個分支各自算出自己的 0 或 1 筆寫入，最後展開組成同一份交易清單
  const wrongEntryWrites: Prisma.PrismaPromise<unknown>[] = correct
    ? existing
      ? [
          existing.box + 1 > GRADUATE_BOX
            ? prisma.wrongEntry.delete({ where: { userId_questionId: { userId, questionId } } })
            : prisma.wrongEntry.update({
                where: { userId_questionId: { userId, questionId } },
                data: { box: existing.box + 1 },
              }),
        ]
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

  await prisma.$transaction([...wrongEntryWrites, dailyStatWrite, ...chapterStatWrites])

  const { progress } = await loadFullProgress(userId)
  return NextResponse.json({ progress })
}
