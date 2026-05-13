import { NextResponse } from 'next/server'
import { prisma } from '@mundo-magico/database'
import { z } from 'zod'
import { getApiAuth } from '../../../../../lib/auth'

const schema = z.object({
  quantity: z.number().int().min(1).default(1),
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

    const remaining = item.quantityReceived - item.quantityUsed
    if (data.quantity > remaining) {
      return NextResponse.json({ error: 'Quantidade insuficiente no estoque' }, { status: 400 })
    }

    const [updated] = await prisma.$transaction([
      prisma.childItem.update({
        where: { id: params.id },
        data: { quantityUsed: { increment: data.quantity } },
        include: { child: { select: { id: true, fullName: true } } },
      }),
      prisma.childItemUsage.create({
        data: {
          itemId:   params.id,
          quantity: data.quantity,
          notes:    data.notes,
        },
      }),
    ])

    return NextResponse.json(updated)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }
}
