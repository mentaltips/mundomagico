import { NextResponse } from 'next/server'
import { prisma } from '@mundo-magico/database'
import { z } from 'zod'
import { getApiAuth } from '../../../../../lib/auth'

const schema = z.object({
  quantity: z.number().int().min(1),
  notes:    z.string().optional(),
})

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getApiAuth(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const item = await prisma.childItem.findFirst({
      where: { id: params.id, schoolId: user.schoolId },
    })
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await req.json()
    const data = schema.parse(body)

    const updated = await prisma.childItem.update({
      where: { id: params.id },
      data: {
        quantityReceived:  { increment: data.quantity },
        lastReplenished:   new Date(),
        notes:             data.notes ?? item.notes,
      },
      include: { child: { select: { id: true, fullName: true } } },
    })

    return NextResponse.json(updated)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }
}
