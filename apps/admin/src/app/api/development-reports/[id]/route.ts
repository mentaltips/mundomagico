import { NextResponse } from 'next/server'
import { prisma } from '@mundo-magico/database'
import { z } from 'zod'
import { getApiAuth } from '../../../../lib/auth'

const schema = z.object({
  period:                z.enum(['SEMANAL', 'MENSAL', 'BIMESTRAL', 'SEMESTRAL', 'PERSONALIZADO']).optional(),
  startDate:             z.string().optional(),
  endDate:               z.string().optional(),
  motorCoordination:     z.string().optional(),
  socialization:         z.string().optional(),
  language:              z.string().optional(),
  autonomy:              z.string().optional(),
  feeding:               z.string().optional(),
  sleep:                 z.string().optional(),
  participation:         z.string().optional(),
  adaptation:            z.string().optional(),
  peerInteraction:       z.string().optional(),
  teamObservations:      z.string().optional(),
  parentRecommendations: z.string().optional(),
  isDraft:               z.boolean().optional(),
})

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getApiAuth(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const existing = await prisma.developmentReport.findFirst({
      where: { id: params.id, schoolId: user.schoolId },
    })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await req.json()
    const data = schema.parse(body)

    const report = await prisma.developmentReport.update({
      where: { id: params.id },
      data: {
        ...(data.period                !== undefined && { period: data.period }),
        ...(data.startDate             !== undefined && { startDate: new Date(data.startDate) }),
        ...(data.endDate               !== undefined && { endDate: new Date(data.endDate) }),
        ...(data.motorCoordination     !== undefined && { motorCoordination: data.motorCoordination }),
        ...(data.socialization         !== undefined && { socialization: data.socialization }),
        ...(data.language              !== undefined && { language: data.language }),
        ...(data.autonomy              !== undefined && { autonomy: data.autonomy }),
        ...(data.feeding               !== undefined && { feeding: data.feeding }),
        ...(data.sleep                 !== undefined && { sleep: data.sleep }),
        ...(data.participation         !== undefined && { participation: data.participation }),
        ...(data.adaptation            !== undefined && { adaptation: data.adaptation }),
        ...(data.peerInteraction       !== undefined && { peerInteraction: data.peerInteraction }),
        ...(data.teamObservations      !== undefined && { teamObservations: data.teamObservations }),
        ...(data.parentRecommendations !== undefined && { parentRecommendations: data.parentRecommendations }),
        ...(data.isDraft               !== undefined && { isDraft: data.isDraft }),
      },
      include: {
        child: { select: { id: true, fullName: true, photoUrl: true } },
      },
    })

    return NextResponse.json(report)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = await getApiAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const existing = await prisma.developmentReport.findFirst({
    where: { id: params.id, schoolId: user.schoolId },
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.developmentReport.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
