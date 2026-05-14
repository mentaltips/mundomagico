import { Router } from 'express'
import { prisma } from '@mundo-magico/database'

const router = Router()

// GET / - Get notifications for the current user
// Aggregates: low child items, overdue invoices, pinned announcements
router.get('/', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const userId = req.user?.sub
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
          child: { select: { id: true, fullName: true } },
          student: { select: { id: true, fullName: true } }
        },
        take: 20
      })

      overdueInvoices.forEach((inv: any) => {
        notifications.push({
          id: `invoice-${inv.id}`,
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

    // Recent announcements (Pinned or last 3 days)
    const recentDate = new Date()
    recentDate.setDate(recentDate.getDate() - 3)

    const recentAnnouncements = await prisma.announcement.findMany({
      where: {
        schoolId,
        OR: [
          { isPinned: true },
          { createdAt: { gte: recentDate } }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    recentAnnouncements.forEach((ann: any) => {
      notifications.push({
        id: `announcement-${ann.id}`,
        type: 'announcement',
        priority: ann.priority === 'URGENTE' ? 'URGENTE' : 'NORMAL',
        title: ann.priority === 'URGENTE' ? 'Aviso Urgente' : 'Novo Comunicado',
        body: ann.title,
        time: ann.createdAt,
        createdAt: ann.createdAt,
        href: '/admin/announcements'
      })
    })

    // Sort: Priority first (URGENTE), then Type (announcements first), then Date
    notifications.sort((a, b) => {
      // 1. Urgency
      if (a.priority === 'URGENTE' && b.priority !== 'URGENTE') return -1
      if (a.priority !== 'URGENTE' && b.priority === 'URGENTE') return 1
      
      // 2. Type (Announcements first)
      if (a.type === 'announcement' && b.type !== 'announcement') return -1
      if (a.type !== 'announcement' && b.type === 'announcement') return 1

      // 3. Date
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    res.json({
      notifications: notifications.slice(0, 15), // Show more items
      unreadCount: notifications.length
    })
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
