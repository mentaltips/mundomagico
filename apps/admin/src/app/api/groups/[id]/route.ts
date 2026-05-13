import { NextResponse } from 'next/server'
import { prisma } from '@mundo-magico/database'
import { z } from 'zod'
import { getApiAuth } from '../../../../lib/auth'

const schema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  capacity: z.number().int().positive().optional(),
})

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getApiAuth(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const data = schema.parse(body)

    // Verifica se pertence à escola
    const existing = await prisma.group.findUnique({ where: { id: params.id } })
    if (!existing || existing.schoolId !== user.schoolId) {
      return NextResponse.json({ error: 'Grupo não encontrado' }, { status: 404 })
    }

    const group = await prisma.group.update({
      where: { id: params.id },
      data: {
        name: data.name,
        capacity: data.capacity,
      }
    })

    return NextResponse.json(group)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getApiAuth(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const existing = await prisma.group.findUnique({ where: { id: params.id } })
    if (!existing || existing.schoolId !== user.schoolId) {
      return NextResponse.json({ error: 'Grupo não encontrado' }, { status: 404 })
    }

    await prisma.group.delete({ where: { id: params.id } })

    return new NextResponse(null, { status: 204 })
  } catch (err) {
    return NextResponse.json({ error: 'Erro ao excluir' }, { status: 500 })
  }
}
