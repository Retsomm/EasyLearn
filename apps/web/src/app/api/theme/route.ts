import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidThemeId } from '@/lib/themes'

export const dynamic = 'force-dynamic'

export const GET = async () => {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const user = await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId },
    select: { theme: true },
  })
  return NextResponse.json({ theme: user.theme })
}

export const POST = async (request: Request) => {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { theme } = (await request.json()) as { theme?: string }
  if (!theme || !isValidThemeId(theme)) {
    return NextResponse.json({ error: 'invalid theme' }, { status: 400 })
  }

  const user = await prisma.user.upsert({
    where: { id: userId },
    update: { theme },
    create: { id: userId, theme },
    select: { theme: true },
  })
  return NextResponse.json({ theme: user.theme })
}
