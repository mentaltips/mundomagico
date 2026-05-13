import { NextResponse } from 'next/server'
import { prisma } from '@mundo-magico/database'
import { getApiAuth } from '../../../../lib/auth'

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = await getApiAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const doc = await prisma.childDocument.findFirst({
    where: { id: params.id },
    include: { child: { select: { schoolId: true } } },
  })
  if (!doc || doc.child.schoolId !== user.schoolId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.childDocument.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
