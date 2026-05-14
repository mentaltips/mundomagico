import { Router } from 'express'
import { prisma } from '@mundo-magico/database'

const router = Router()

// GET /pending-config - Alunos sem mensalidade ou responsável principal
router.get('/pending-config', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    
    const [children, students] = await Promise.all([
      prisma.child.findMany({
        where: { 
          schoolId, 
          status: 'ATIVO',
          OR: [
            { monthlyFee: 0 },
            { monthlyFee: null }
          ]
        },
        select: { id: true, name: true }
      }),
      prisma.student.findMany({
        where: { 
          schoolId, 
          status: 'ATIVO',
          OR: [
            { monthlyFee: 0 },
            { monthlyFee: null }
          ]
        },
        select: { id: true, name: true }
      })
    ])

    res.json({
      pending: [
        ...children.map(c => ({ ...c, type: 'Criança' })),
        ...students.map(s => ({ ...s, type: 'Estudante' }))
      ]
    })
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar pendências' })
  }
})

router.get('/', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId!

    const today = new Date()
    const startOfDay   = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay     = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

    // Início da semana corrente (segunda-feira)
    const dow = today.getDay() // 0=dom
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1))
    startOfWeek.setHours(0, 0, 0, 0)

    const [
      activeChildren,
      activeStudents,
      totalGroups,
      pendingInvoices,
      overdueInvoices,
      paidAgg,
      presentToday,
      weeklyRaw,
      totalPresencasMes,
    ] = await Promise.all([
      prisma.child.count({
        where: { schoolId, status: { in: ['ATIVO', 'ADAPTACAO'] } },
      }),
      prisma.student.count({
        where: { schoolId, status: 'ATIVO' },
      }),
      prisma.group.count({ where: { schoolId } }),
      prisma.invoice.count({ where: { schoolId, status: 'PENDENTE', dueDate: { gte: startOfDay } } }),
      prisma.invoice.count({ 
        where: { 
          schoolId, 
          OR: [
            { status: 'VENCIDO' },
            { status: 'PENDENTE', dueDate: { lt: startOfDay } }
          ]
        } 
      }),
      prisma.invoice.aggregate({
        where: { schoolId, status: 'PAGO', paidAt: { gte: startOfMonth } },
        _sum: { paidAmount: true },
      }),
      // Presentes hoje — usa ChildCheckInOut
      prisma.childCheckInOut.count({
        where: {
          schoolId,
          date: { gte: startOfDay, lte: endOfDay },
          status: 'PRESENTE',
        },
      }),
      // Frequência por dia desta semana
      prisma.childCheckInOut.groupBy({
        by: ['date'],
        where: {
          schoolId,
          status: 'PRESENTE',
          date: { gte: startOfWeek, lte: endOfDay },
        },
        _count: { id: true },
        orderBy: { date: 'asc' },
      }),
      // Total de presenças no mês (para % mensal)
      prisma.childCheckInOut.count({
        where: { schoolId, status: 'PRESENTE', date: { gte: startOfMonth } },
      }),
    ])

    const activeAlunos = activeChildren + activeStudents
    const totalPaid    = paidAgg._sum.paidAmount ?? 0
    const absentToday  = Math.max(0, activeChildren - presentToday)

    // % frequência mensal
    const diasUteisPassados = (() => {
      let count = 0
      const d = new Date(startOfMonth)
      while (d <= today) {
        if (d.getDay() !== 0 && d.getDay() !== 6) count++
        d.setDate(d.getDate() + 1)
      }
      return count
    })()
    const expected = diasUteisPassados * activeChildren
    const attendanceRate = expected > 0
      ? `${((totalPresencasMes / expected) * 100).toFixed(0)}%`
      : '—'

    // Gráfico semanal: Seg→Sex
    const DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex']
    const weekMap: Record<string, number> = {}
    for (const row of weeklyRaw) {
      const d   = new Date(row.date)
      const idx = d.getDay() - 1 // 1=seg→0
      if (idx >= 0 && idx <= 4) {
        const key = DAYS[idx]
        weekMap[key] = (weekMap[key] ?? 0) + row._count.id
      }
    }
    const weeklyAttendance = DAYS.map((day) => ({ day, val: weekMap[day] ?? 0 }))

    res.json({
      activeAlunos,
      totalGroups,
      pendingInvoices,
      overdueInvoices,
      totalPaid,
      presentToday,
      absentToday,
      attendanceRate,
      weeklyAttendance,
    })
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
})

export default router
