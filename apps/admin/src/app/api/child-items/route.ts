import { NextResponse } from 'next/server'
import { prisma } from '@mundo-magico/database'
import { z } from 'zod'
import { getApiAuth } from '../../../lib/auth'

const schema = z.object({
  childId:         z.string(),
  itemType:        z.string(),
  description:     z.string().optional(),
  quantityReceived: z.number().int().min(0).default(0),
  alertThreshold:  z.number().int().min(0).default(5),
  notes:           z.string().optional(),
})

export async function GET(req: Request) {
  const user = await getApiAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const childId = searchParams.get('childId')

  const items = await prisma.childItem.findMany({
    where: {
      schoolId: user.schoolId,
      ...(childId ? { childId } : {}),
    },
    include: {
      child: { select: { id: true, fullName: true, photoUrl: true } },
      usageHistory: { orderBy: { usedAt: 'desc' }, take: 10 },
    },
    orderBy: { child: { fullName: 'asc' } },
  })

  return NextResponse.json(items)
}

export async function POST(req: Request) {
  try {
    const user = await getApiAuth(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const data = schema.parse(body)

    const item = await prisma.childItem.create({
      data: {
        schoolId:         user.schoolId,
        childId:          data.childId,
        itemType:         data.itemType,
        description:      data.description,
        quantityReceived: data.quantityReceived,
        quantityUsed:     0,
        alertThreshold:   data.alertThreshold,
        notes:            data.notes,
      },
      include: {
        child: { select: { id: true, fullName: true, photoUrl: true } },
      },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }
}
