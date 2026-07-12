import { Prisma } from '@prisma/client'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { loadFullProgress } from '@/lib/progressStore'
import type { Progress } from '@easylearn/core'

export const dynamic = 'force-dynamic'

// 只在使用者第一次登入、資料庫還沒有任何紀錄時，把訪客模式的 localStorage 進度搬進資料庫一次。
// 伺服器端會重新確認 isNew，避免重複呼叫把已經存在的雲端進度覆蓋掉。
export const POST = async (request: Request) => {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { isNew, progress } = await loadFullProgress(userId)
  if (!isNew) {
    return NextResponse.json({ progress })
  }

  const local = (await request.json()) as Progress

  try {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          xp: local.xp ?? 0,
          streakCount: local.streak?.count ?? 0,
          streakLast: local.streak?.last ?? null,
        },
      }),
      ...Object.entries(local.completedLevels ?? {}).map(([levelId, rec]) =>
        prisma.completedLevel.create({ data: { userId, levelId, best: rec.best, total: rec.total } }),
      ),
      ...Object.entries(local.wrongIds ?? {}).map(([questionId, rec]) =>
        prisma.wrongEntry.create({
          data: { userId, questionId, count: rec.count, lastWrong: rec.lastWrong, box: rec.box },
        }),
      ),
      ...Object.keys(local.savedIds ?? {})
        .filter((questionId) => local.savedIds[questionId])
        .map((questionId) => prisma.savedQuestion.create({ data: { userId, questionId } })),
      ...Object.entries(local.xpLog ?? {}).map(([date, amount]) =>
        prisma.xpLog.create({ data: { userId, date, amount } }),
      ),
      ...Object.entries(local.dailyStats ?? {}).map(([date, rec]) =>
        prisma.dailyStat.create({ data: { userId, date, total: rec.total, correct: rec.correct } }),
      ),
      ...Object.entries(local.chapterStats ?? {}).map(([chapterId, rec]) =>
        prisma.chapterStat.create({ data: { userId, chapterId, total: rec.total, correct: rec.correct } }),
      ),
    ])
  } catch (err) {
    // 併發呼叫（例如使用者重複觸發搬遷）可能撞到 unique constraint，這時代表另一個請求已經搬完了，
    // 直接回傳目前資料庫的最新進度即可，不用當成錯誤
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      const { progress: existing } = await loadFullProgress(userId)
      return NextResponse.json({ progress: existing })
    }
    throw err
  }

  const { progress: migrated } = await loadFullProgress(userId)
  return NextResponse.json({ progress: migrated })
}
