import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@mundo-magico/database'
import { z } from 'zod'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const students = await prisma.student.findMany({
      where: { schoolId: session.user.schoolId },
      include: { group: true },
      orderBy: { fullName: 'asc' },
    })

    return NextResponse.json(students)
  } catch (error) {
    console.error('[STUDENTS_GET]', error)
    return NextResponse.json({ error: 'Erro ao buscar alunos' }, { status: 500 })
  }
}

const schema = z.object({
  fullName: z.string().min(2),
  birthDate: z.string(),
  groupId: z.string().optional(),
  shift: z.enum(['MANHA', 'TARDE', 'INTEGRAL', 'NOTURNO']).default('MANHA'),
  registrationNumber: z.string().optional(),
  status: z.string().default('ATIVO'),
  observations: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const data = schema.parse(body)

    const student = await prisma.student.create({
      data: {
        ...data,
        schoolId: session.user.schoolId,
        birthDate: new Date(data.birthDate),
      },
    })

    return NextResponse.json(student, { status: 201 })
  } catch (error) {
    console.error('[STUDENTS_POST]', error)
    return NextResponse.json({ error: 'Erro ao criar aluno' }, { status: 400 })
  }
}
