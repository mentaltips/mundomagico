import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@mundo-magico/database'
import { z } from 'zod'

const createSchema = z.object({
  childId: z.string().optional(),
  studentId: z.string().optional(),
  guardianId: z.string().optional(),
  description: z.string().min(1, 'Descrição obrigatória'),
  amount: z.number().positive('Valor deve ser positivo'),
  dueDate: z.string(), // ISO date string
  referenceMonth: z.string().optional(), // "2025-05"
})

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const referenceMonth = searchParams.get('month')

    // Guardians only see invoices for their own children
    let childIdFilter: string | undefined
    if (session.user.role === 'GUARDIAN') {
      const guardian = await prisma.guardian.findFirst({
        where: { userId: session.user.id },
        include: { children: { select: { childId: true } } },
      })
      const childIds = guardian?.children.map((c: any) => c.childId) ?? []
      if (childIds.length === 0) return NextResponse.json([])
      childIdFilter = childIds[0] // primary child
    }

    const invoices = await prisma.invoice.findMany({
      where: {
        schoolId: session.user.schoolId,
        ...(status ? { status } : {}),
        ...(referenceMonth ? { referenceMonth } : {}),
        ...(childIdFilter ? { childId: childIdFilter } : {}),
      },
      include: {
        child: { select: { id: true, fullName: true, photoUrl: true } },
        student: { select: { id: true, fullName: true, photoUrl: true } },
        payments: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { dueDate: 'desc' },
    })

    return NextResponse.json(invoices)
  } catch (error) {
    console.error('[INVOICES_GET]', error)
    return NextResponse.json({ error: 'Erro ao buscar faturas' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()

    // Suporta criação em lote (array) ou individual (objeto)
    const items = Array.isArray(body) ? body : [body]
    const created = []

    for (const item of items) {
      const data = createSchema.parse(item)

      // Verificar se já existe fatura para este aluno/mês
      if (data.referenceMonth && (data.childId || data.studentId)) {
        const existing = await prisma.invoice.findFirst({
          where: {
            schoolId: session.user.schoolId,
            referenceMonth: data.referenceMonth,
            ...(data.childId ? { childId: data.childId } : {}),
            ...(data.studentId ? { studentId: data.studentId } : {}),
            status: { not: 'CANCELADO' },
          },
        })
        if (existing) {
          created.push({ skipped: true, id: existing.id, reason: 'Fatura já existe para este mês' })
          continue
        }
      }

      const invoice = await prisma.invoice.create({
        data: {
          schoolId: session.user.schoolId,
          childId: data.childId || null,
          studentId: data.studentId || null,
          guardianId: data.guardianId || null,
          description: data.description,
          amount: data.amount,
          dueDate: new Date(data.dueDate),
          referenceMonth: data.referenceMonth || null,
          status: 'PENDENTE',
        },
      })
      created.push(invoice)
    }

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('[INVOICES_POST]', error)
    return NextResponse.json({ error: 'Erro ao criar faturas' }, { status: 500 })
  }
}
