import { Router } from 'express'
import { prisma } from '@mundo-magico/database'

const router = Router()

// GET / - List announcements
router.get('/', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const announcements = await prisma.announcement.findMany({
      where: { schoolId },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }]
    })
    res.json(announcements)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST / - Create announcement
router.post('/', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const { sentAt, ...rest } = req.body
    const announcement = await prisma.announcement.create({
      data: {
        ...rest,
        schoolId,
        ...(sentAt && { sentAt: new Date(sentAt) }),
      }
    })
    res.status(201).json(announcement)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PATCH /:id - Update announcement
router.patch('/:id', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const { sentAt, ...rest } = req.body
    const result = await prisma.announcement.updateMany({
      where: { id: req.params.id, schoolId },
      data: {
        ...rest,
        ...(sentAt && { sentAt: new Date(sentAt) }),
      }
    })
    if (result.count === 0) return res.status(404).json({ error: 'Announcement not found' })
    const updated = await prisma.announcement.findUnique({ where: { id: req.params.id } })
    res.json(updated)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// DELETE /:id - Delete announcement
router.delete('/:id', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const result = await prisma.announcement.deleteMany({ where: { id: req.params.id, schoolId } })
    if (result.count === 0) return res.status(404).json({ error: 'Announcement not found' })
    res.json({ success: true })
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
