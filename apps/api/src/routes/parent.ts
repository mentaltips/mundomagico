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
        // Ensure we only get reports with a clean date (UTC midnight) to avoid junk from partial saves
        date: { 
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        }
      },
      include: {
        meals: true,
        sleep: true,
        hygiene: true,
        health: true,
        moods: true,
        activities: true,
      },
      orderBy: [
        { date: 'desc' },
        { updatedAt: 'desc' }
      ],
      take: 10
    })
    
    // Sort to ensure the one with the cleanest date or most recent update comes first
    const sortedReports = [...latestReports].sort((a: any, b: any) => {
      const aIsNormalized = new Date(a.date).toISOString().endsWith('T00:00:00.000Z')
      const bIsNormalized = new Date(b.date).toISOString().endsWith('T00:00:00.000Z')
      if (aIsNormalized && !bIsNormalized) return -1
      if (!aIsNormalized && bIsNormalized) return 1
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })

    // Get today's report (the most recent normalized one)
    const currentReport = sortedReports[0] || null

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

    // Process report data for the summary if we found a valid one
    let report = null

    if (currentReport) {
      report = {
        meals: currentReport.meals.map((m: any) => ({
          id: m.id,
          mealType: m.mealType,
          result: m.result,
          amount: m.amount,
          observation: m.observation,
        })),
        sleep: currentReport.sleep,
        hygiene: currentReport.hygiene,
        moods: currentReport.moods,
        activities: currentReport.activities.map((a: any) => ({
          name: a.activityType,
          description: a.description
        })),
        note: currentReport.messageToParents,
        important: currentReport.importantAlert
      }
    }

    res.json({
      guardian,
      guardianName: guardian.fullName,
      children,
      child: children[0] ? {
        id: children[0].id,
        name: children[0].fullName.split(' ')[0],
        fullName: children[0].fullName,
        group: children[0].group?.name,
        shift: children[0].group?.shift
      } : null,
      checkIns,
      report,
      latestReports,
      pendingInvoices,
      photos,
      announcements: announcements.map((a: any) => ({
        id: a.id,
        title: a.title,
        content: a.content,
        date: a.createdAt
      })),
    })
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /feed - Activity feed for guardian
router.get('/feed', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const userId = req.user?.sub
    const { page = '1', limit = '20' } = req.query
    const skip = (Number(page) - 1) * Number(limit)

    const guardian = await prisma.guardian.findFirst({ where: { userId } })
    if (!guardian) return res.status(404).json({ error: 'Guardian profile not found' })

    const childGuardians = await prisma.childGuardian.findMany({ where: { guardianId: guardian.id } })
    const childIds = childGuardians.map((cg: any) => cg.childId)

    const feed: any[] = []

    // Daily reports published
    const reports = await prisma.childDailyReport.findMany({
      where: { childId: { in: childIds }, isDraft: false },
      include: {
        child: { select: { id: true, fullName: true, photoUrl: true } },
        meals: true,
        sleep: true,
        moods: true,
        activities: true,
      },
      orderBy: { date: 'desc' },
      take: Number(limit),
      skip
    })

    reports.forEach((r: any) => {
      const isNormalized = new Date(r.date).toISOString().endsWith('T00:00:00.000Z')
      if (!isNormalized) return // Skip junk reports in the feed
      
      feed.push({
        id: `report-${r.id}`,
        type: 'DAILY_REPORT',
        title: 'Diário de Rotina',
        description: r.messageToParents || 'Acompanhe as atividades e cuidados de hoje.',
        time: r.sentAt ? new Date(r.sentAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : new Date(r.updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        date: r.date,
        icon: 'Utensils',
        color: 'text-primary',
        data: r
      })
    })

    // Photos shared with parents
    const photos = await prisma.childPhoto.findMany({
      where: { childId: { in: childIds }, sharedWithParents: true },
      include: { child: { select: { id: true, fullName: true } } },
      orderBy: { date: 'desc' },
      take: Number(limit),
    })

    photos.forEach((p: any) => {
      feed.push({
        id: `photo-${p.id}`,
        type: 'PHOTO',
        title: 'Nova Foto',
        description: `${p.child.fullName.split(' ')[0]} apareceu em uma nova foto!`,
        time: new Date(p.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        date: p.date,
        icon: 'Camera',
        color: 'text-amber-500',
        data: p
      })
    })

    // Announcements targeting guardians or all
    const announcements = await prisma.announcement.findMany({
      where: {
        schoolId,
        OR: [{ targetRole: 'GUARDIAN' }, { targetRole: null }]
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
    })

    announcements.forEach((a: any) => {
      feed.push({
        id: `announcement-${a.id}`,
        type: 'ANNOUNCEMENT',
        title: a.title,
        description: a.content,
        time: new Date(a.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        date: a.createdAt,
        icon: 'Megaphone',
        color: 'text-violet-500',
        data: a
      })
    })

    // Development reports published
    const devReports = await prisma.developmentReport.findMany({
      where: { childId: { in: childIds }, isDraft: false },
      include: { child: { select: { id: true, fullName: true } } },
      orderBy: { publishedAt: 'desc' },
      take: 10,
    })

    devReports.forEach((dr: any) => {
      feed.push({
        id: `dev-report-${dr.id}`,
        type: 'DEVELOPMENT_REPORT',
        title: 'Relatório de Desenvolvimento',
        description: `Um novo relatório de desempenho está disponível.`,
        time: new Date(dr.publishedAt || dr.updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        date: dr.publishedAt || dr.updatedAt,
        icon: 'Star',
        color: 'text-emerald-500',
        data: dr
      })
    })

    // Sort all by date desc
    feed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    res.json({
      page: Number(page),
      limit: Number(limit),
      items: feed.slice(0, Number(limit))
    })
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
