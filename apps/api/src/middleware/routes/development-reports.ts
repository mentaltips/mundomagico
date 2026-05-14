import { Router } from 'express'
import { prisma } from '@mundo-magico/database'

const router = Router()

// GET / - List development reports
router.get('/', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const { childId, isDraft } = req.query
    const reports = await prisma.developmentReport.findMany({
      where: {
        schoolId,
        ...(childId && { childId: childId as string }),
        ...(isDraft !== undefined && { isDraft: isDraft === 'true' }),
      },
      include: {
        child: { select: { id: true, fullName: true, photoUrl: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json(reports)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST / - Create development report
router.post('/', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const createdBy = req.user?.sub as string
    const { startDate, endDate, publishedAt, ...rest } = req.body
    const report = await prisma.developmentReport.create({
      data: {
        ...rest,
        schoolId,
        createdBy,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        ...(publishedAt && { publishedAt: new Date(publishedAt) }),
      }
    })
    res.status(201).json(report)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /:id - Get development report
router.get('/:id', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const report = await prisma.developmentReport.findFirst({
      where: { id: req.params.id, schoolId },
      include: {
        child: { select: { id: true, fullName: true, photoUrl: true } }
      }
    })
    if (!report) return res.status(404).json({ error: 'Report not found' })
    res.json(report)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PATCH /:id - Update development report
router.patch('/:id', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const { startDate, endDate, publishedAt, ...rest } = req.body
    const result = await prisma.developmentReport.updateMany({
      where: { id: req.params.id, schoolId },
      data: {
        ...rest,
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(publishedAt && { publishedAt: new Date(publishedAt) }),
      }
    })
    if (result.count === 0) return res.status(404).json({ error: 'Report not found' })
    const updated = await prisma.developmentReport.findUnique({ where: { id: req.params.id } })
    res.json(updated)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// DELETE /:id - Delete development report
router.delete('/:id', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const result = await prisma.developmentReport.deleteMany({ where: { id: req.params.id, schoolId } })
    if (result.count === 0) return res.status(404).json({ error: 'Report not found' })
    res.json({ success: true })
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /:id/publish - Publish report
router.post('/:id/publish', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const result = await prisma.developmentReport.updateMany({
      where: { id: req.params.id, schoolId },
      data: { isDraft: false, publishedAt: new Date() }
    })
    if (result.count === 0) return res.status(404).json({ error: 'Report not found' })
    const updated = await prisma.developmentReport.findUnique({ where: { id: req.params.id } })
    res.json(updated)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
