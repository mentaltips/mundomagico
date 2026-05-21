import { Router } from 'express'
import { prisma } from '@mundo-magico/database'
import { hasPermission } from '../../shared/middlewares/permissions.middleware'

const router = Router()

// GET / - Get notifications for the current user
router.get('/', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const role = req.user?.role
    const notifications: any[] = []

    if (hasPermission(role, 'canManageStudents')) {
      const allItems = await prisma.childItem.findMany({ where: { schoolId } })
      const lowStockItems = allItems.filter((i: any) => (i.quantityReceived - i.quantityUsed) <= i.alertThreshold)

      lowStockItems.forEach((item: any) => {
        notifications.push({
          id: `low-stock-${item.id}`,
          type: 'alert',
          priority: 'NORMAL',
          title: 'Estoque Baixo',
          body: `Item "${item.itemType}" esta com estoque baixo`,
          time: item.updatedAt,
          createdAt: item.updatedAt,
          href: '/admin/child-items'
        })
      })
    }

    if (hasPermission(role, 'canViewFinance')) {
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

      const paidSince = new Date()
      paidSince.setDate(paidSince.getDate() - 7)

      const recentPaidInvoices = await prisma.invoice.findMany({
        where: {
          schoolId,
          status: 'PAGO',
          paidAt: { gte: paidSince },
        },
        include: {
          child: { select: { fullName: true } },
          student: { select: { fullName: true } },
        },
        orderBy: { paidAt: 'desc' },
        take: 10,
      })

      recentPaidInvoices.forEach((inv: any) => {
        notifications.push({
          id: `paid-${inv.id}`,
          type: 'payment',
          priority: 'NORMAL',
          title: 'Pagamento Confirmado',
          body: `${inv.child?.fullName || inv.student?.fullName || 'Aluno'} pagou "${inv.description}"`,
          time: inv.paidAt || inv.updatedAt,
          createdAt: inv.paidAt || inv.updatedAt,
          href: '/admin/finance?status=PAGO'
        })
      })

      const failedWebhookSince = new Date()
      failedWebhookSince.setDate(failedWebhookSince.getDate() - 3)

      const failedWebhooks = await prisma.paymentWebhookEvent.findMany({
        where: {
          schoolId,
          status: 'FAILED',
          createdAt: { gte: failedWebhookSince },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      })

      failedWebhooks.forEach((event: any) => {
        notifications.push({
          id: `webhook-failed-${event.id}`,
          type: 'alert',
          priority: 'URGENTE',
          title: 'Webhook de Pagamento Falhou',
          body: event.error || 'Falha ao processar retorno do Mercado Pago',
          time: event.createdAt,
          createdAt: event.createdAt,
          href: '/admin/finance'
        })
      })
    }

    const recentDate = new Date()
    recentDate.setDate(recentDate.getDate() - 3)

    const recentAnnouncements = await prisma.announcement.findMany({
      where: {
        schoolId,
        OR: [
          { isPinned: true },
          { createdAt: { gte: recentDate }, targetRole: null },
          { createdAt: { gte: recentDate }, targetRole: role },
        ]
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

    notifications.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    const sliced = notifications.slice(0, 20)
    res.json({ notifications: sliced, unreadCount: sliced.length })
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
