import { Router } from 'express'
import { prisma } from '@mundo-magico/database'

const router = Router()

// GET / - List daily reports
router.get('/', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const { date } = req.query

    // Define the date range for the specified date (or today)
    const targetDate = date ? new Date(date as string) : new Date()
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0))
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999))

    // Fetch all children and include their daily reports for the target date
    const children = await prisma.child.findMany({
      where: { schoolId },
      include: {
        group: true,
        guardians: {
          include: { guardian: true }
        },
        dailyReports: {
          where: {
            date: {
              gte: startOfDay,
              lte: endOfDay,
            }
          },
          include: {
            meals: true,
            sleep: true,
            hygiene: true,
            health: true,
            moods: true,
            activities: true,
          }
        }
      },
      orderBy: { fullName: 'asc' }
    })

    res.json(children)
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

    // Normalize date to midnight UTC to ensure consistency in upsert/unique constraint
    const d = new Date(date)
    const reportDate = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))

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

    const d = date ? new Date(date as string) : new Date()
    const dateObj = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))

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

// DELETE /:id - Delete a report
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const schoolId = req.user?.schoolId

    // Ensure the report belongs to the school
    const report = await prisma.childDailyReport.findFirst({
      where: { id, schoolId }
    })

    if (!report) return res.status(404).json({ error: 'Report not found' })

    await prisma.childDailyReport.delete({
      where: { id }
    })

    res.json({ success: true })
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
