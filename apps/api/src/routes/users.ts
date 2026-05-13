import { Router } from 'express'
import { prisma } from '@mundo-magico/database'
import bcrypt from 'bcryptjs'

const router = Router()

// GET / - List users of school
router.get('/', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const users = await prisma.user.findMany({
      where: { schoolId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatarUrl: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { name: 'asc' }
    })
    res.json(users)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST / - Create user
router.post('/', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const { password, ...rest } = req.body
    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { ...rest, schoolId, password: hashed },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatarUrl: true,
        active: true,
        createdAt: true,
      }
    })
    res.status(201).json(user)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /:id - Get user
router.get('/:id', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const user = await prisma.user.findFirst({
      where: { id: req.params.id, schoolId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatarUrl: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      }
    })
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json(user)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PATCH /:id - Update user
router.patch('/:id', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const { password, ...rest } = req.body
    const data: any = { ...rest }
    if (password) {
      data.password = await bcrypt.hash(password, 10)
    }
    const result = await prisma.user.updateMany({
      where: { id: req.params.id, schoolId },
      data
    })
    if (result.count === 0) return res.status(404).json({ error: 'User not found' })
    const updated = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, name: true, email: true, role: true, phone: true, avatarUrl: true, active: true }
    })
    res.json(updated)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// DELETE /:id - Delete user (soft delete by deactivating)
router.delete('/:id', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const result = await prisma.user.updateMany({
      where: { id: req.params.id, schoolId },
      data: { active: false }
    })
    if (result.count === 0) return res.status(404).json({ error: 'User not found' })
    res.json({ success: true })
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
