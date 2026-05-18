import { Router } from 'express'
import { prisma } from '@mundo-magico/database'
import bcrypt from 'bcryptjs'
import { requireRole } from '../middleware/requireRole'

const router = Router()

// Roles que podem gerenciar usuários
const MANAGERS = ['ADMIN', 'DIRECTOR']

// GET / - List users of school
router.get('/', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const users = await prisma.user.findMany({
      where: { 
        schoolId,
        role: { not: 'GUARDIAN' }
      },
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

// POST / - Create user (apenas ADMIN e DIRECTOR)
router.post('/', requireRole(...MANAGERS), async (req, res) => {
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

// PATCH /:id - Update user (apenas ADMIN e DIRECTOR)
router.patch('/:id', requireRole(...MANAGERS), async (req, res) => {
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

// POST /:id/reset-password - Gera nova senha de acesso (igual ao create-user dos responsáveis)
router.post('/:id/reset-password', requireRole(...MANAGERS), async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const user = await prisma.user.findFirst({
      where: { id: req.params.id, schoolId },
      select: { id: true, name: true, email: true, role: true, active: true }
    })
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' })
    if (!user.email) return res.status(400).json({ error: 'Usuário não possui e-mail cadastrado' })

    // Gerar senha aleatória de 6 dígitos (mesmo padrão dos responsáveis)
    const plainPassword = Math.floor(100000 + Math.random() * 900000).toString()
    const hashed = await bcrypt.hash(plainPassword, 10)

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed, active: true }
    })

    res.json({ email: user.email, password: plainPassword, name: user.name })
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// DELETE /:id - Desativa usuário (apenas ADMIN e DIRECTOR)
router.delete('/:id', requireRole(...MANAGERS), async (req, res) => {
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
