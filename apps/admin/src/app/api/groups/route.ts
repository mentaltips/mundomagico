import { NextResponse } from 'next/server'
import { prisma } from '@mundo-magico/database'
import { z } from 'zod'
import { getApiAuth } from '../../../lib/auth'

const schema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  capacity: z.number().int().positive('Capacidade deve ser maior que 0').optional(),
})

export async function GET(req: Request) {
  try {
    const user = await getApiAuth(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const groups = await prisma.group.findMany({
      where: { schoolId: user.schoolId, active: true },
      include: {
        _count: {
          select: { children: true, students: true }
        }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(groups)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erro ao buscar grupos' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await getApiAuth(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const data = schema.parse(body)

    const group = await prisma.group.create({
      data: {
        name: data.name,
        capacity: data.capacity,
        schoolId: user.schoolId
      }
    })

    return NextResponse.json(group, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ error: 'Erro ao criar grupo' }, { status: 500 })
  }
}
