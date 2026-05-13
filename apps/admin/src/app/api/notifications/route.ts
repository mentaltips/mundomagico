import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@mundo-magico/database'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id: userId, role, schoolId } = session.user
    const notifications: {
      id: string
      type: 'announcement' | 'alert' | 'report' | 'payment'
      title: string
      body: string
      time: Date | string
      priority: string
      href?: string
    }[] = []

    // ── Announcements (all roles) ──────────────────────────────────────────
    const announcements = await prisma.announcement.findMany({
      where: { schoolId },
      orderBy: { createdAt: 'desc' },
      take: 8,
    })
    announcements.forEach((ann: any) => {
      notifications.push({
        id: `ann-${ann.id}`,
        type: 'announcement',
        title: ann.title,
        body: (ann.content as string).substring(0, 120),
        time: ann.createdAt,
        priority: ann.priority ?? 'NORMAL',
        href:
          role === 'GUARDIAN'
            ? '/parent/messages'
            : '/admin/announcements',
      })
    })

    // ── Admin / Director specific ──────────────────────────────────────────
    if (role === 'ADMIN' || role === 'DIRECTOR') {
      // Overdue invoices
      const overdueCount = await prisma.invoice
        .count({ where: { schoolId, status: 'VENCIDO' } })
        .catch(() => 0)
      if (overdueCount > 0) {
        notifications.push({
          id: 'overdue-invoices',
          type: 'alert',
          title: `${overdueCount} fatura${overdueCount > 1 ? 's' : ''} vencida${overdueCount > 1 ? 's' : ''}`,
          body: 'Clique para ver as cobranças em atraso',
          time: new Date(),
          priority: 'URGENTE',
          href: '/admin/finance',
        })
      }

      // Draft dev reports waiting to be published
      const draftCount = await prisma.developmentReport
        .count({ where: { child: { schoolId }, isDraft: true } })
        .catch(() => 0)
      if (draftCount > 0) {
        notifications.push({
          id: 'draft-reports',
          type: 'report',
          title: `${draftCount} relatório${draftCount > 1 ? 's' : ''} rascunho`,
          body: 'Relatórios de desenvolvimento aguardando publicação',
          time: new Date(),
          priority: 'NORMAL',
          href: '/admin/development-reports',
        })
      }
    }

    // ── Guardian specific ──────────────────────────────────────────────────
    if (role === 'GUARDIAN') {
      const guardian = await prisma.guardian
        .findFirst({
          where: { userId },
          include: { children: { include: { child: true } } },
        })
        .catch(() => null)

      if (guardian?.children?.[0]) {
        const childId = guardian.children[0].childId

        // Pending invoices
        const pendingInvoices = await prisma.invoice
          .findMany({
            where: { childId, status: { in: ['PENDENTE', 'VENCIDO'] } },
            orderBy: { dueDate: 'asc' },
            take: 3,
          })
          .catch(() => [])

        pendingInvoices.forEach((inv: any) => {
          const overdue = inv.status === 'VENCIDO'
          notifications.push({
            id: `inv-${inv.id}`,
            type: 'payment',
            title: overdue ? `Fatura vencida: ${inv.description}` : `Fatura pendente: ${inv.description}`,
            body: `R$ ${Number(inv.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} — vence ${new Date(inv.dueDate).toLocaleDateString('pt-BR')}`,
            time: inv.dueDate,
            priority: overdue ? 'URGENTE' : 'NORMAL',
            href: '/parent/payments',
          })
        })

        // New development reports published
        const recentReports = await prisma.developmentReport
          .findMany({
            where: { childId, isDraft: false },
            orderBy: { publishedAt: 'desc' },
            take: 3,
          })
          .catch(() => [])

        recentReports.forEach((r: any) => {
          notifications.push({
            id: `devreport-${r.id}`,
            type: 'report',
            title: 'Novo relatório de desenvolvimento',
            body: (r.title as string | null) ?? 'Relatório publicado pela escola',
            time: r.publishedAt ?? r.createdAt,
            priority: 'NORMAL',
            href: '/parent/history',
          })
        })
      }
    }

    // ── Teacher / Caregiver ────────────────────────────────────────────────
    if (role === 'TEACHER' || role === 'CAREGIVER') {
      // Children without daily report today
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(today.getDate() + 1)

      const missingReports = await prisma.child
        .count({
          where: {
            schoolId,
            status: 'ATIVO',
            dailyReports: { none: { date: { gte: today, lt: tomorrow } } },
          },
        })
        .catch(() => 0)

      if (missingReports > 0) {
        notifications.push({
          id: 'missing-reports',
          type: 'alert',
          title: `${missingReports} criança${missingReports > 1 ? 's' : ''} sem diário hoje`,
          body: 'Registre o diário de rotina das crianças',
          time: new Date(),
          priority: 'NORMAL',
          href: '/teacher/dashboard',
        })
      }
    }

    // Sort by time descending, urgente first
    notifications.sort((a, b) => {
      if (a.priority === 'URGENTE' && b.priority !== 'URGENTE') return -1
      if (b.priority === 'URGENTE' && a.priority !== 'URGENTE') return 1
      return new Date(b.time).getTime() - new Date(a.time).getTime()
    })

    return NextResponse.json({
      notifications: notifications.slice(0, 15),
      unreadCount: notifications.length,
    })
  } catch (error) {
    console.error('[NOTIFICATIONS_GET]', error)
    return NextResponse.json({ notifications: [], unreadCount: 0 })
  }
}
