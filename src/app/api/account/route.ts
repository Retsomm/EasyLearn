import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

export const dynamic = 'force-dynamic'

export const DELETE = async () => {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  await prisma.user.deleteMany({ where: { id: userId } })

  const client = await clerkClient()
  await client.users.deleteUser(userId)

  return NextResponse.json({ ok: true })
}
