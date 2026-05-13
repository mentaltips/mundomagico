import { NextResponse } from 'next/server'
import { prisma } from '@mundo-magico/database'
import { z } from 'zod'
import { getApiAuth } from '../../../lib/auth'
import bcrypt from 'bcryptjs'

const schema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().optional(),
  role: z.enum(['ADMIN', 'DIRECTOR', 'TEACHER', 'CAREGIVER', 'STAFF']),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres').optional()
})

export async function GET(req: Request) {
  try {
    const user = await getApiAuth(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const users = await prisma.user.findMany({
      where: { 
        schoolId: user.schoolId,
        role: { not: 'GUARDIAN' } // Exclude guardians from staff view
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(users)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erro ao buscar usuários' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await getApiAuth(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    // Simple RBAC check - only Admin/Director can create staff users
    if (user.role !== 'ADMIN' && user.role !== 'DIRECTOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const data = schema.parse(body)

    const existingUser = await prisma.user.findUnique({ where: { email: data.email } })
    if (existingUser) {
      return NextResponse.json({ error: 'E-mail já está em uso' }, { status: 400 })
    }

    const passToHash = data.password || '123456'
    const hashedPassword = await bcrypt.hash(passToHash, 10)

    const newUser = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: hashedPassword,
        role: data.role,
        schoolId: user.schoolId
      }
    })

    return NextResponse.json(newUser, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ error: 'Erro ao criar usuário' }, { status: 500 })
  }
}
