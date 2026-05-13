import { NextResponse } from 'next/server'
import { prisma } from '@mundo-magico/database'
import { z } from 'zod'
import { getApiAuth } from '../../../lib/auth'

const schema = z.object({
  childId:               z.string(),
  period:                z.enum(['SEMANAL', 'MENSAL', 'BIMESTRAL', 'SEMESTRAL', 'PERSONALIZADO']).default('MENSAL'),
  startDate:             z.string(),
  endDate:               z.string(),
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
  isDraft:               z.boolean().default(true),
})

export async function GET(req: Request) {
  const user = await getApiAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const childId = searchParams.get('childId')
  const isDraft = searchParams.get('isDraft')

  const reports = await prisma.developmentReport.findMany({
    where: {
      schoolId: user.schoolId,
      ...(childId ? { childId } : {}),
      ...(isDraft !== null ? { isDraft: isDraft === 'true' } : {}),
    },
    include: {
      child: { select: { id: true, fullName: true, photoUrl: true, group: { select: { name: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(reports)
}

export async function POST(req: Request) {
  try {
    const user = await getApiAuth(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const data = schema.parse(body)

    const report = await prisma.developmentReport.create({
      data: {
        schoolId:              user.schoolId,
        childId:               data.childId,
        period:                data.period,
        startDate:             new Date(data.startDate),
        endDate:               new Date(data.endDate),
        motorCoordination:     data.motorCoordination,
        socialization:         data.socialization,
        language:              data.language,
        autonomy:              data.autonomy,
        feeding:               data.feeding,
        sleep:                 data.sleep,
        participation:         data.participation,
        adaptation:            data.adaptation,
        peerInteraction:       data.peerInteraction,
        teamObservations:      data.teamObservations,
        parentRecommendations: data.parentRecommendations,
        isDraft:               data.isDraft,
        createdBy:             user.id,
      },
      include: {
        child: { select: { id: true, fullName: true, photoUrl: true } },
      },
    })

    return NextResponse.json(report, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }
}
