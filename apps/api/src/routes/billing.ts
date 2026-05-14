import { Router } from 'express'
import { prisma } from '@mundo-magico/database'
import { requireRole } from '../middleware/requireRole'

const router = Router()

// ─────────────────────────────────────────────────────────────────────────────
// POST /billing/generate-monthly
// Gera mensalidades em lote para todos os ativos com monthlyFee configurado.
// Pula crianças que já têm fatura para o mês de referência.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/generate-monthly', requireRole('ADMIN', 'DIRECTOR'), async (req, res) => {
  try {
    const schoolId = req.user?.schoolId!

    // Mês de referência: aceita "2026-06" ou usa o mês atual
    const referenceMonth: string =
      req.body.referenceMonth || new Date().toISOString().slice(0, 7)

    const [year, month] = referenceMonth.split('-').map(Number)

    // Busca todas as crianças e alunos ativos com mensalidade definida
    const [children, students] = await Promise.all([
      prisma.child.findMany({
        where: { schoolId, status: { in: ['ATIVO', 'ADAPTACAO'] }, monthlyFee: { gt: 0 } },
        include: { invoices: { where: { referenceMonth } } },
      }),
      prisma.student.findMany({
        where: { schoolId, status: 'ATIVO', monthlyFee: { gt: 0 } },
        include: { invoices: { where: { referenceMonth } } },
      }),
    ])

    const created: any[] = []
    const skipped: any[] = []

    // Helper: calcula data de vencimento
    const dueDate = (dueDay: number | null) => {
      const day = Math.min(dueDay ?? 10, 28)
      return new Date(year, month - 1, day)
    }

    // Gera para crianças
    for (const child of children) {
      if (child.invoices.length > 0) {
        skipped.push({ id: child.id, name: child.fullName, reason: 'já existe' })
        continue
      }
      const invoice = await prisma.invoice.create({
        data: {
          schoolId,
          childId: child.id,
          description: `Mensalidade ${referenceMonth.split('-').reverse().join('/')}`,
          amount: child.monthlyFee!,
          dueDate: dueDate(child.dueDay ?? 10),
          referenceMonth,
          status: 'PENDENTE',
        },
      })
      created.push({ id: invoice.id, name: child.fullName, amount: child.monthlyFee })
    }

    // Gera para alunos
    for (const student of students) {
      if (student.invoices.length > 0) {
        skipped.push({ id: student.id, name: student.fullName, reason: 'já existe' })
        continue
      }
      const invoice = await prisma.invoice.create({
        data: {
          schoolId,
          studentId: student.id,
          description: `Mensalidade ${referenceMonth.split('-').reverse().join('/')}`,
          amount: student.monthlyFee!,
          dueDate: dueDate(student.dueDay ?? 10),
          referenceMonth,
          status: 'PENDENTE',
        },
      })
      created.push({ id: invoice.id, name: student.fullName, amount: student.monthlyFee })
    }

    res.status(201).json({
      referenceMonth,
      created: created.length,
      skipped: skipped.length,
      details: { created, skipped },
    })
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Erro ao gerar mensalidades' })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /billing/preview-monthly?referenceMonth=2026-06
// Previsão de quantas faturas serão geradas antes de confirmar
// ─────────────────────────────────────────────────────────────────────────────
router.get('/preview-monthly', requireRole('ADMIN', 'DIRECTOR'), async (req, res) => {
  try {
    const schoolId = req.user?.schoolId!
    const referenceMonth =
      (req.query.referenceMonth as string) || new Date().toISOString().slice(0, 7)

    const [children, students] = await Promise.all([
      prisma.child.findMany({
        where: { schoolId, status: { in: ['ATIVO', 'ADAPTACAO'] }, monthlyFee: { gt: 0 } },
        include: { invoices: { where: { referenceMonth } } },
        select: { id: true, fullName: true, monthlyFee: true, dueDay: true, invoices: true },
      }),
      prisma.student.findMany({
        where: { schoolId, status: 'ATIVO', monthlyFee: { gt: 0 } },
        include: { invoices: { where: { referenceMonth } } },
        select: { id: true, fullName: true, monthlyFee: true, dueDay: true, invoices: true },
      }),
    ])

    const toGenerate = [...children, ...students].filter((c) => c.invoices.length === 0)
    const alreadyExists = [...children, ...students].filter((c) => c.invoices.length > 0)
    const totalAmount = toGenerate.reduce((sum, c) => sum + (c.monthlyFee ?? 0), 0)

    // Sem mensalidade cadastrada
    const [childrenNoFee, studentsNoFee] = await Promise.all([
      prisma.child.count({ where: { schoolId, status: { in: ['ATIVO', 'ADAPTACAO'] }, OR: [{ monthlyFee: null }, { monthlyFee: 0 }] } }),
      prisma.student.count({ where: { schoolId, status: 'ATIVO', OR: [{ monthlyFee: null }, { monthlyFee: 0 }] } }),
    ])

    res.json({
      referenceMonth,
      toGenerate: toGenerate.length,
      alreadyExists: alreadyExists.length,
      withoutFee: childrenNoFee + studentsNoFee,
      totalAmount,
      preview: toGenerate.map((c) => ({ id: c.id, name: c.fullName, amount: c.monthlyFee, dueDay: c.dueDay })),
    })
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Erro ao gerar previsão' })
  }
})

export default router
