import { Prisma } from '@prisma/client'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { loadFullProgress } from '@/lib/progressStore'

export const dynamic = 'force-dynamic'

interface SaveKeyPointToggleBody {
  keyPointId: string
}

export const POST = async (request: Request) => {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { keyPointId } = (await request.json()) as SaveKeyPointToggleBody

  if (typeof keyPointId !== 'string' || keyPointId.length === 0) {
    return NextResponse.json({ error: 'invalid keyPointId' }, { status: 400 })
  }

  const existing = await prisma.savedKeyPoint.findUnique({ where: { userId_keyPointId: { userId, keyPointId } } })
  try {
    if (existing) {
      await prisma.savedKeyPoint.delete({ where: { userId_keyPointId: { userId, keyPointId } } })
    } else {
      await prisma.savedKeyPoint.create({ data: { userId, keyPointId } })
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
