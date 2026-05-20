import { Router } from 'express'
import { prisma } from '@mundo-magico/database'
import { normalizeUtcDate, toDateKey } from '../../shared/utils/date-key'
import { requirePermission } from '../../shared/middlewares/permissions.middleware'

const router = Router()

router.use(requirePermission('canManageStudents'))

// GET / - List daily reports (simplified view, without nested relations)
router.get('/', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const { childId, groupId, date, isDraft } = req.query

    let childIds: string[] | undefined

    if (groupId) {
      const children = await prisma.child.findMany({
        where: { schoolId, groupId: groupId as string },
        select: { id: true }
      })
      childIds = children.map((c: any) => c.id)
    }

    const reports = await prisma.childDailyReport.findMany({
      where: {
        schoolId,
        ...(childId && { childId: childId as string }),
        ...(childIds && { childId: { in: childIds } }),
        ...(date && {
          date: {
            gte: normalizeUtcDate(date as string),
            lte: new Date(normalizeUtcDate(date as string).getTime() + 86399999),
          }
        }),
        ...(isDraft !== undefined && { isDraft: isDraft === 'true' }),
      },
      include: {
        child: { select: { id: true, fullName: true, photoUrl: true, groupId: true } },
        author: { select: { id: true, name: true } },
        meals: true,
        sleep: true,
        hygiene: true,
        health: true,
        moods: true,
        activities: true,
      },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }]
    })
    res.json(reports)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST / - Create or upsert daily report
router.post('/', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const createdBy = req.user?.sub as string
    const {
      childId,
      date,
      isDraft,
      sentAt,
      sentVia,
      generalNote,
      teamNote,
      messageToParents,
      importantAlert,
      homeRecommendation,
      itemRequests,
      meals,
      sleep,
      hygiene,
      health,
      moods,
      activities,
    } = req.body

    const reportDate = normalizeUtcDate(date)
    const dateKey = toDateKey(reportDate)

    const child = await prisma.child.findFirst({
      where: { id: childId, schoolId },
      select: { id: true }
    })

    if (!child) {
      return res.status(404).json({ error: 'Child not found' })
    }

    const report = await prisma.childDailyReport.upsert({
      where: { childId_dateKey: { childId, dateKey } },
      update: {
        isDraft: isDraft ?? true,
        ...(sentAt && { sentAt: new Date(sentAt) }),
        sentVia,
        generalNote,
        teamNote,
        messageToParents,
        importantAlert,
        homeRecommendation,
        itemRequests,
        date: reportDate,
        dateKey,
      },
      create: {
        schoolId,
        childId,
        createdBy,
        date: reportDate,
        dateKey,
        isDraft: isDraft ?? true,
        ...(sentAt && { sentAt: new Date(sentAt) }),
        sentVia,
        generalNote,
        teamNote,
        messageToParents,
        importantAlert,
        homeRecommendation,
        itemRequests,
      }
    })

    if (meals && Array.isArray(meals)) {
      await prisma.dailyMeal.deleteMany({ where: { reportId: report.id } })
      if (meals.length > 0) {
        await prisma.dailyMeal.createMany({ data: meals.map((m: any) => ({ ...m, reportId: report.id })) })
      }
    }
    if (sleep) {
      await prisma.dailySleep.upsert({ where: { reportId: report.id }, update: sleep, create: { ...sleep, reportId: report.id } })
    }
    if (hygiene) {
      await prisma.dailyHygiene.upsert({ where: { reportId: report.id }, update: hygiene, create: { ...hygiene, reportId: report.id } })
    }
    if (health) {
      await prisma.dailyHealth.upsert({ where: { reportId: report.id }, update: health, create: { ...health, reportId: report.id } })
    }
    if (moods && Array.isArray(moods)) {
      await prisma.dailyMood.deleteMany({ where: { reportId: report.id } })
      if (moods.length > 0) {
        await prisma.dailyMood.createMany({ data: moods.map((m: any) => ({ ...m, reportId: report.id })) })
      }
    }
    if (activities && Array.isArray(activities)) {
      await prisma.dailyActivity.deleteMany({ where: { reportId: report.id } })
      if (activities.length > 0) {
        await prisma.dailyActivity.createMany({ data: activities.map((a: any) => ({ ...a, reportId: report.id })) })
      }
    }

    const full = await prisma.childDailyReport.findUnique({
      where: { id: report.id },
      include: {
        child: { select: { id: true, fullName: true } },
        meals: true,
        sleep: true,
        hygiene: true,
        health: true,
        moods: true,
        activities: true,
        author: { select: { id: true, name: true } }
      }
    })
    res.status(201).json(full)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
