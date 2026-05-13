import { NextResponse } from 'next/server'
import { prisma } from '@mundo-magico/database'
import { z } from 'zod'
import { getApiAuth } from '../../../../lib/auth'

const schema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  phone: z.string().optional().nullable(),
  role: z.enum(['ADMIN', 'DIRECTOR', 'TEACHER', 'CAREGIVER', 'STAFF']),
  active: z.boolean().default(true)
})

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getApiAuth(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    if (user.role !== 'ADMIN' && user.role !== 'DIRECTOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const data = schema.parse(body)

    const existing = await prisma.user.findUnique({ where: { id: params.id } })
    if (!existing || existing.schoolId !== user.schoolId || existing.role === 'GUARDIAN') {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        name: data.name,
        phone: data.phone,
        role: data.role,
        active: data.active
      }
    })

    return NextResponse.json(updatedUser)
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

    if (user.role !== 'ADMIN' && user.role !== 'DIRECTOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const existing = await prisma.user.findUnique({ where: { id: params.id } })
    if (!existing || existing.schoolId !== user.schoolId || existing.role === 'GUARDIAN') {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }
    
    if (existing.id === user.id) {
      return NextResponse.json({ error: 'Você não pode excluir sua própria conta' }, { status: 400 })
    }

    await prisma.user.delete({ where: { id: params.id } })

    return new NextResponse(null, { status: 204 })
  } catch (err) {
    return NextResponse.json({ error: 'Erro ao excluir' }, { status: 500 })
  }
}
