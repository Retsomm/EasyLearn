import { prisma } from './prisma'
import { toProgress } from './progressLogic'
import type { Progress } from '@easylearn/core'

// 撈這個使用者的全部子表，組回跟 localStorage 版一致的 Progress 形狀
export const loadFullProgress = async (userId: string): Promise<{ progress: Progress; isNew: boolean }> => {
  const [user, completedLevels, wrongEntries, savedQuestions, xpLogs, dailyStats, chapterStats] =
    await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.completedLevel.findMany({ where: { userId } }),
      prisma.wrongEntry.findMany({ where: { userId } }),
      prisma.savedQuestion.findMany({ where: { userId } }),
      prisma.xpLog.findMany({ where: { userId } }),
      prisma.dailyStat.findMany({ where: { userId } }),
      prisma.chapterStat.findMany({ where: { userId } }),
    ])

  if (!user) {
    const created = await prisma.user.create({ data: { id: userId } })
    return { progress: toProgress(created, [], [], [], [], [], []), isNew: true }
  }

  return {
    progress: toProgress(user, completedLevels, wrongEntries, savedQuestions, xpLogs, dailyStats, chapterStats),
    isNew: completedLevels.length === 0 && wrongEntries.length === 0 && savedQuestions.length === 0 && xpLogs.length === 0,
  }
}
