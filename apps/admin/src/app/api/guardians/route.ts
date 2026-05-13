import { NextResponse } from 'next/server'
import { prisma } from '@mundo-magico/database'
import { z } from 'zod'
import { getApiAuth } from '../../../lib/auth'
import bcrypt from 'bcryptjs'

const schema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  phone: z.string().min(1, 'Telefone é obrigatório'),
  email: z.string().email('E-mail inválido').optional(),
})

export async function GET(req: Request) {
  try {
    const user = await getApiAuth(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Guardian não tem schoolId direto — filtramos via ChildGuardian → Child → schoolId
    const guardians = await prisma.guardian.findMany({
      where: {
        children: {
          some: {
            child: { schoolId: user.schoolId },
          },
        },
      },
      orderBy: { fullName: 'asc' },
    })

    return NextResponse.json(guardians)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erro ao buscar responsáveis' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await getApiAuth(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    // payload: { fullName, phone, email, relationship, cpf }
    
    const guardian = await prisma.guardian.create({
      data: {
        fullName: body.fullName,
        phone: body.phone,
        email: body.email,
        relationship: body.relationship || 'Responsável',
        cpf: body.cpf,
      }
    })

    return NextResponse.json(guardian, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erro ao criar responsável' }, { status: 500 })
  }
}
