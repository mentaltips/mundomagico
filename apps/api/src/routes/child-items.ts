import { Router } from 'express'
import { prisma } from '@mundo-magico/database'

const router = Router()

// GET / - List child items
router.get('/', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const { childId } = req.query
    const items = await prisma.childItem.findMany({
      where: { schoolId, ...(childId && { childId: childId as string }) },
      include: {
        child: { 
          select: { 
            id: true, 
            fullName: true, 
            photoUrl: true,
            group: { select: { name: true } }
          } 
        },
        _count: { select: { usageHistory: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json(items)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST / - Create child item
router.post('/', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    if (!schoolId) return res.status(401).json({ error: 'School ID not found' })

    const { childId, itemType, quantityReceived, alertThreshold, notes, lastReplenished } = req.body
    
    const item = await prisma.childItem.create({
      data: {
        childId,
        itemType,
        quantityReceived: Number(quantityReceived) || 0,
        alertThreshold: Number(alertThreshold) || 5,
        notes,
        schoolId,
        ...(lastReplenished && { lastReplenished: new Date(lastReplenished) }),
      }
    })
    res.status(201).json(item)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PATCH /:id - Update child item
router.patch('/:id', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const { lastReplenished, ...rest } = req.body
    const result = await prisma.childItem.updateMany({
      where: { id: req.params.id, schoolId },
      data: {
        ...rest,
        ...(lastReplenished && { lastReplenished: new Date(lastReplenished) }),
      }
    })
    if (result.count === 0) return res.status(404).json({ error: 'Item not found' })
    const updated = await prisma.childItem.findUnique({ where: { id: req.params.id } })
    res.json(updated)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// DELETE /:id - Delete child item
router.delete('/:id', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const result = await prisma.childItem.deleteMany({ where: { id: req.params.id, schoolId } })
    if (result.count === 0) return res.status(404).json({ error: 'Item not found' })
    res.json({ success: true })
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /:id/use - Register usage
router.post('/:id/use', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const item = await prisma.childItem.findFirst({ where: { id: req.params.id, schoolId } })
    if (!item) return res.status(404).json({ error: 'Item not found' })
    const { quantity = 1, notes } = req.body
    const [usage] = await prisma.$transaction([
      prisma.childItemUsage.create({
        data: { itemId: req.params.id, quantity, notes }
      }),
      prisma.childItem.update({
        where: { id: req.params.id },
        data: { quantityUsed: { increment: quantity } }
      })
    ])
    res.status(201).json(usage)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /:id/replenish - Replenish stock
router.post('/:id/replenish', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const item = await prisma.childItem.findFirst({ where: { id: req.params.id, schoolId } })
    if (!item) return res.status(404).json({ error: 'Item not found' })
    const { quantity = 0, notes } = req.body
    const updated = await prisma.childItem.update({
      where: { id: req.params.id },
      data: {
        quantityReceived: { increment: quantity },
        lastReplenished: new Date(),
        ...(notes !== undefined && { notes }),
      }
    })
    res.json(updated)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
