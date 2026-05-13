import { NextResponse } from 'next/server'
import { prisma } from '@mundo-magico/database'
import { z } from 'zod'
import { getApiAuth } from '@/lib/auth'

const linkSchema = z.object({
  guardianId: z.string().min(1),
  relationship: z.string().optional().default('Responsável'),
  isPrimary: z.boolean().default(false),
  canPickup: z.boolean().default(true),
})

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getApiAuth(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const data = linkSchema.parse(body)

    const child = await prisma.child.findUnique({ where: { id: params.id } })
    if (!child || child.schoolId !== user.schoolId) {
      return NextResponse.json({ error: 'Criança não encontrada' }, { status: 404 })
    }

    const linking = await prisma.childGuardian.upsert({
      where: {
        childId_guardianId: {
          childId: params.id,
          guardianId: data.guardianId,
        },
      },
      update: {
        isPrimary: data.isPrimary,
        canPickup: data.canPickup,
      },
      create: {
        childId: params.id,
        guardianId: data.guardianId,
        isPrimary: data.isPrimary,
        canPickup: data.canPickup,
      },
    })

    return NextResponse.json(linking)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erro ao vincular responsável' }, { status: 500 })
  }
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getApiAuth(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guardians = await prisma.childGuardian.findMany({
      where: { childId: params.id },
      include: { guardian: true },
    })

    return NextResponse.json(guardians)
  } catch (err) {
    return NextResponse.json({ error: 'Erro ao buscar vínculos' }, { status: 500 })
  }
}
