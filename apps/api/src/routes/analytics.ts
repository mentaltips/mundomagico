import { Router } from 'express'
import { prisma } from '@mundo-magico/database'

const router = Router()

// POST /track - Record a page visit from frontend
router.post('/track', async (req, res) => {
  try {
    const { path } = req.body
    const schoolId = req.user?.schoolId

    // @ts-ignore
    await prisma.pageVisit.create({
      data: {
        path: path || '/',
        ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
        schoolId: schoolId || null
      }
    })

    res.status(204).end()
  } catch (e) {
    res.status(200).end() // Falha silenciosa
  }
})

// GET / - Get analytics summary
router.get('/', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    
    // Filtros: últimos 30 dias
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)

    const [
      totalVisits,
      recentVisits,
      topPaths,
      visitsByDay
    ] = await Promise.all([
      // @ts-ignore
      prisma.pageVisit.count({ where: { schoolId } }),
      // @ts-ignore
      prisma.pageVisit.findMany({
        where: { schoolId, createdAt: { gte: startDate } },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      // @ts-ignore
      prisma.pageVisit.groupBy({
        by: ['path'],
        where: { schoolId },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5
      }),
      // @ts-ignore
      prisma.pageVisit.groupBy({
        by: ['createdAt'],
        where: { schoolId, createdAt: { gte: startDate } },
        _count: { id: true },
        orderBy: { createdAt: 'asc' }
      })
    ])

    const dailyMap: Record<string, number> = {}
    visitsByDay.forEach((v: any) => {
      const day = v.createdAt.toISOString().split('T')[0]
      dailyMap[day] = (dailyMap[day] || 0) + v._count.id
    })

    const chartData = Object.keys(dailyMap).map(day => ({
      day: day.split('-').reverse().slice(0, 2).join('/'), // DD/MM
      visits: dailyMap[day]
    }))

    res.json({
      totalVisits,
      topPaths: topPaths.map((p: any) => ({ path: p.path, count: p._count.id })),
      recentVisits,
      chartData: chartData.slice(-7) // Últimos 7 dias para o gráfico
    })
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Erro ao carregar analytics' })
  }
})

export default router
