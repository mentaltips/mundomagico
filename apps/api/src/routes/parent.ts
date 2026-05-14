import { Router } from 'express'
import { prisma } from '@mundo-magico/database'

const router = Router()

// GET /dashboard - Parent dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const userId = req.user?.sub

    // Find guardian linked to this user
    const guardian = await prisma.guardian.findFirst({ where: { userId } })
    if (!guardian) return res.status(404).json({ error: 'Guardian profile not found' })

    // Get children linked to this guardian
    const childGuardians = await prisma.childGuardian.findMany({
      where: { guardianId: guardian.id },
      include: {
        child: {
          include: {
            group: { select: { id: true, name: true, shift: true } },
          }
        }
      }
    })

    const children = childGuardians.map((cg: any) => cg.child)
    const childIds = children.map((c: any) => c.id)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayEnd = new Date(today)
    todayEnd.setHours(23, 59, 59, 999)

    // Today's check-in/out
    const checkIns = await prisma.childCheckInOut.findMany({
      where: { childId: { in: childIds }, date: { gte: today, lte: todayEnd } }
    })

    // Latest daily reports (unpublished not sent to parents)
    const latestReports = await prisma.childDailyReport.findMany({
      where: {
        childId: { in: childIds },
        isDraft: false,
        date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      },
      include: {
        meals: true,
        sleep: true,
        hygiene: true,
        health: true,
        moods: true,
        activities: true,
      },
      orderBy: { date: 'desc' },
      take: 10
    })

    // Pending invoices
    const pendingInvoices = await prisma.invoice.findMany({
      where: { childId: { in: childIds }, status: { in: ['PENDENTE', 'VENCIDO'] } },
      orderBy: { dueDate: 'asc' },
      take: 5
    })

    // Recent photos shared with parents
    const photos = await prisma.childPhoto.findMany({
      where: { childId: { in: childIds }, sharedWithParents: true },
      orderBy: { date: 'desc' },
      take: 10
    })

    // Pinned announcements
    const announcements = await prisma.announcement.findMany({
      where: { schoolId, OR: [{ isPinned: true }, { targetRole: 'GUARDIAN' }] },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      take: 5
    })

    res.json({
      guardian,
      children,
      checkIns,
      latestReports,
      pendingInvoices,
      photos,
      announcements,
    })
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
