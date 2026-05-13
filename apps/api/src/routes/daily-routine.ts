import { Router } from 'express'
import { prisma } from '@mundo-magico/database'

const router = Router()

// GET / - List daily reports
router.get('/', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const { childId, date, isDraft } = req.query
    const reports = await prisma.childDailyReport.findMany({
      where: {
        schoolId,
        ...(childId && { childId: childId as string }),
        ...(date && {
          date: {
            gte: new Date(new Date(date as string).setHours(0, 0, 0, 0)),
            lte: new Date(new Date(date as string).setHours(23, 59, 59, 999)),
          }
        }),
        ...(isDraft !== undefined && { isDraft: isDraft === 'true' }),
      },
      include: {
        child: { select: { id: true, fullName: true, photoUrl: true } },
        meals: true,
        sleep: true,
        hygiene: true,
        health: true,
        moods: true,
        activities: true,
        author: { select: { id: true, name: true } }
      },
      orderBy: { date: 'desc' }
    })
    res.json(reports)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST / - Create or update daily routine report
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

    const reportDate = new Date(date)

    const report = await prisma.childDailyReport.upsert({
      where: {
        childId_date: { childId, date: reportDate }
      },
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
      },
      create: {
        schoolId,
        childId,
        createdBy,
        date: reportDate,
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

    // Update related records if provided
    if (meals && Array.isArray(meals)) {
      await prisma.dailyMeal.deleteMany({ where: { reportId: report.id } })
      if (meals.length > 0) {
        await prisma.dailyMeal.createMany({
          data: meals.map((m: any) => ({ ...m, reportId: report.id }))
        })
      }
    }

    if (sleep) {
      await prisma.dailySleep.upsert({
        where: { reportId: report.id },
        update: sleep,
        create: { ...sleep, reportId: report.id }
      })
    }

    if (hygiene) {
      await prisma.dailyHygiene.upsert({
        where: { reportId: report.id },
        update: hygiene,
        create: { ...hygiene, reportId: report.id }
      })
    }

    if (health) {
      await prisma.dailyHealth.upsert({
        where: { reportId: report.id },
        update: health,
        create: { ...health, reportId: report.id }
      })
    }

    if (moods && Array.isArray(moods)) {
      await prisma.dailyMood.deleteMany({ where: { reportId: report.id } })
      if (moods.length > 0) {
        await prisma.dailyMood.createMany({
          data: moods.map((m: any) => ({ ...m, reportId: report.id }))
        })
      }
    }

    if (activities && Array.isArray(activities)) {
      await prisma.dailyActivity.deleteMany({ where: { reportId: report.id } })
      if (activities.length > 0) {
        await prisma.dailyActivity.createMany({
          data: activities.map((a: any) => ({ ...a, reportId: report.id }))
        })
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


// GET /child/:childId - Get child with daily report for a specific date
// Used by the admin daily-routine page
router.get('/child/:childId', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const { childId } = req.params
    const { date } = req.query

    const dateObj = date
      ? new Date((date as string) + 'T00:00:00')
      : new Date(new Date().setHours(0, 0, 0, 0))

    const child = await prisma.child.findFirst({
      where: { id: childId, schoolId },
      include: {
        group: true,
        guardians: {
          include: { guardian: true },
          where: { receiveNotif: true },
        },
        dailyReports: {
          where: { date: dateObj },
          include: { meals: true, sleep: true, hygiene: true, health: true, moods: true, activities: true },
        },
      },
    })

    if (!child) return res.status(404).json({ error: 'Child not found' })

    res.json(child)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
