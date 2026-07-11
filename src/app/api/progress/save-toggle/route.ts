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
  if (existing) {
    await prisma.savedQuestion.delete({ where: { userId_questionId: { userId, questionId } } })
  } else {
    await prisma.savedQuestion.create({ data: { userId, questionId } })
  }

  const { progress } = await loadFullProgress(userId)
  return NextResponse.json({ progress })
}
