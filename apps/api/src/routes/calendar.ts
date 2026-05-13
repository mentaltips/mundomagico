import { Router } from 'express'
import { prisma } from '@mundo-magico/database'

const router = Router()

// GET / - List calendar events
router.get('/', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const { startDate, endDate } = req.query
    const events = await prisma.calendarEvent.findMany({
      where: {
        schoolId,
        ...(startDate && endDate && {
          date: {
            gte: new Date(startDate as string),
            lte: new Date(endDate as string),
          }
        })
      },
      orderBy: { date: 'asc' }
    })
    res.json(events)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST / - Create calendar event
router.post('/', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const { date, ...rest } = req.body
    const event = await prisma.calendarEvent.create({
      data: { ...rest, schoolId, date: new Date(date) }
    })
    res.status(201).json(event)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PATCH /:id - Update calendar event
router.patch('/:id', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const { date, ...rest } = req.body
    const result = await prisma.calendarEvent.updateMany({
      where: { id: req.params.id, schoolId },
      data: { ...rest, ...(date && { date: new Date(date) }) }
    })
    if (result.count === 0) return res.status(404).json({ error: 'Event not found' })
    const updated = await prisma.calendarEvent.findUnique({ where: { id: req.params.id } })
    res.json(updated)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// DELETE /:id - Delete calendar event
router.delete('/:id', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const result = await prisma.calendarEvent.deleteMany({ where: { id: req.params.id, schoolId } })
    if (result.count === 0) return res.status(404).json({ error: 'Event not found' })
    res.json({ success: true })
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
