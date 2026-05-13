import { NextResponse } from 'next/server'
import { prisma } from '@mundo-magico/database'
import { getApiAuth } from '../../../../../lib/auth'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getApiAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const existing = await prisma.developmentReport.findFirst({
    where: { id: params.id, schoolId: user.schoolId },
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const report = await prisma.developmentReport.update({
    where: { id: params.id },
    data: {
      isDraft:     false,
      publishedAt: new Date(),
    },
  })

  return NextResponse.json(report)
}
