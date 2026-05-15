import { Router } from 'express'
import { prisma } from '@mundo-magico/database'

const router = Router()

// GET / - Get notifications for the current user
router.get('/', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const role = req.user?.role
    const notifications: any[] = []

    // Low stock child items
    const allItems = await prisma.childItem.findMany({ where: { schoolId } })
    const lowStockItems = allItems.filter((i: any) => (i.quantityReceived - i.quantityUsed) <= i.alertThreshold)
    lowStockItems.forEach((item: any) => {
      notifications.push({
        id: `low-stock-${item.id}`,
        type: 'alert',
        priority: 'NORMAL',
        title: 'Estoque Baixo',
        body: `Item "${item.itemType}" está com estoque baixo`,
        time: item.updatedAt,
        createdAt: item.updatedAt,
        href: '/admin/child-items'
      })
    })

    // Overdue invoices (admin/director only)
    if (role === 'ADMIN' || role === 'DIRECTOR') {
      const overdueInvoices = await prisma.invoice.findMany({
        where: {
          schoolId,
          status: 'PENDENTE',
          dueDate: { lt: new Date() }
        },
        include: {
          child: { select: { fullName: true } },
          student: { select: { fullName: true } }
        },
        take: 10
      })
      overdueInvoices.forEach((inv: any) => {
        notifications.push({
          id: `overdue-${inv.id}`,
          type: 'payment',
          priority: 'URGENTE',
          title: 'Fatura Vencida',
          body: `A fatura de ${inv.child?.fullName || inv.student?.fullName || 'aluno'} venceu`,
          time: inv.updatedAt,
          createdAt: inv.updatedAt,
          href: '/admin/finance'
        })
      })
    }

    // Recent announcements (pinned or last 3 days)
    const recentDate = new Date()
    recentDate.setDate(recentDate.getDate() - 3)
    const recentAnnouncements = await prisma.announcement.findMany({
      where: {
        schoolId,
        OR: [{ isPinned: true }, { createdAt: { gte: recentDate } }]
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })
    recentAnnouncements.forEach((ann: any) => {
      notifications.push({
        id: `ann-${ann.id}`,
        type: 'announcement',
        priority: ann.isPinned ? 'ALTA' : 'NORMAL',
        title: ann.title,
        body: ann.content?.slice(0, 80) || '',
        time: ann.createdAt,
        createdAt: ann.createdAt,
        href: '/admin/announcements'
      })
    })

    // Sort by date desc
    notifications.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    res.json(notifications.slice(0, 20))
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
