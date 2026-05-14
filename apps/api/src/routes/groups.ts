import { Router } from 'express'
import { prisma } from '@mundo-magico/database'

const router = Router()

// GET /groups
router.get('/', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const active = req.query.active === 'true' ? true : undefined

    const groups = await prisma.group.findMany({
      where: { schoolId, ...(active !== undefined && { active }) },
      include: {
        _count: { select: { children: true } },
        children: {
          take: 3,
          select: { id: true, fullName: true, photoUrl: true }
        }
      },
      orderBy: { name: 'asc' }
    })
    res.json(groups)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch groups' })
  }
})

// POST /groups
router.post('/', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const { name, description, capacity, shift, room, minAge, maxAge } = req.body
    const group = await prisma.group.create({
      data: { name, capacity, shift: shift || 'MANHA', room, minAge, maxAge, schoolId }
    })
    res.status(201).json(group)
  } catch (error) {
    res.status(500).json({ error: 'Failed to create group' })
  }
})

// PATCH /groups/:id
router.patch('/:id', async (req, res) => {
  try {
    const { name, description, capacity, shift, room, active } = req.body
    const group = await prisma.group.update({
      where: { id: req.params.id },
      data: { name, capacity, shift, room, active }
    })
    res.json(group)
  } catch (error) {
    res.status(500).json({ error: 'Failed to update group' })
  }
})

// DELETE /groups/:id
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id
    await prisma.group.delete({ where: { id } })
    res.status(204).end()
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete group' })
  }
})

export default router
