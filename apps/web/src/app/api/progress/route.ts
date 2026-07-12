import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { loadFullProgress } from '@/lib/progressStore'

export const dynamic = 'force-dynamic'

export const GET = async () => {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { progress, isNew } = await loadFullProgress(userId)
  return NextResponse.json({ progress, isNew })
}
