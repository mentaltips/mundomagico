import { Router } from 'express'
import { prisma } from '@mundo-magico/database'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const [totalStudents, totalChildren, totalGroups] = await Promise.all([
      prisma.student.count(),
      prisma.child.count(),
      prisma.group.count()
    ])

    res.json({
      totalStudents: totalStudents + totalChildren,
      totalGroups,
      activeAlunos: totalStudents + totalChildren, // for now
      pendingInvoices: 12, // mocked for now
      attendanceRate: '94%' // mocked for now
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
})

export default router
