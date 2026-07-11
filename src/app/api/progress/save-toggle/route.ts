import { Prisma } from '@prisma/client'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { loadFullProgress } from '../../../../lib/progressStore'

export const dynamic = 'force-dynamic'

interface SaveToggleBody {
  questionId: string
}

export const POST = async (request: Request) => {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { questionId } = (await request.json()) as SaveToggleBody

  const existing = await prisma.savedQuestion.findUnique({ where: { userId_questionId: { userId, questionId } } })
  try {
    if (existing) {
      await prisma.savedQuestion.delete({ where: { userId_questionId: { userId, questionId } } })
    } else {
      await prisma.savedQuestion.create({ data: { userId, questionId } })
    }
  } catch (err) {
    // 重複點擊造成兩個請求同時 toggle：一個 create 撞到另一個剛建好的紀錄（P2002），
    // 或一個 delete 撞到已經被另一個請求刪掉的紀錄（P2025）——兩者都代表結果已經是預期狀態，忽略即可
    const isRaceCondition =
      err instanceof Prisma.PrismaClientKnownRequestError && (err.code === 'P2002' || err.code === 'P2025')
    if (!isRaceCondition) throw err
  }

  const { progress } = await loadFullProgress(userId)
  return NextResponse.json({ progress })
}
