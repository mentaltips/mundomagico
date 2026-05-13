import { Router } from 'express'
import { prisma } from '@mundo-magico/database'

const router = Router()

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
    const childIds = childGuardians.map(cg => cg.childId)

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

    reports.forEach(r => {
      feed.push({ type: 'DAILY_REPORT', date: r.date, data: r })
    })

    // Photos shared with parents
    const photos = await prisma.childPhoto.findMany({
      where: { childId: { in: childIds }, sharedWithParents: true },
      include: { child: { select: { id: true, fullName: true } } },
      orderBy: { date: 'desc' },
      take: Number(limit),
    })

    photos.forEach(p => {
      feed.push({ type: 'PHOTO', date: p.date, data: p })
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

    announcements.forEach(a => {
      feed.push({ type: 'ANNOUNCEMENT', date: a.createdAt, data: a })
    })

    // Development reports published
    const devReports = await prisma.developmentReport.findMany({
      where: { childId: { in: childIds }, isDraft: false },
      include: { child: { select: { id: true, fullName: true } } },
      orderBy: { publishedAt: 'desc' },
      take: 10,
    })

    devReports.forEach(dr => {
      feed.push({ type: 'DEVELOPMENT_REPORT', date: dr.publishedAt || dr.updatedAt, data: dr })
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
