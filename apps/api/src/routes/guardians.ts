import { Router } from 'express'
import { prisma } from '@mundo-magico/database'

const router = Router()

// GET / - List guardians of this school
router.get('/', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId!
    const guardians = await prisma.guardian.findMany({
      where: { schoolId },
      include: {
        children: { include: { child: { select: { id: true, fullName: true } } } },
        students: { include: { student: { select: { id: true, fullName: true } } } }
      },
      orderBy: { fullName: 'asc' }
    })
    res.json(guardians)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST / - Create guardian
router.post('/', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId!
    const { childId, studentId, isPrimary, canPickup, receiveNotif, ...guardianData } = req.body
    const guardian = await prisma.guardian.create({
      data: { ...guardianData, schoolId }
    })

    if (childId) {
      await prisma.childGuardian.create({
        data: {
          childId,
          guardianId: guardian.id,
          isPrimary: isPrimary ?? false,
          canPickup: canPickup ?? true,
          receiveNotif: receiveNotif ?? true,
        }
      })
    }

    if (studentId) {
      await prisma.studentGuardian.create({
        data: {
          studentId,
          guardianId: guardian.id,
          isPrimary: isPrimary ?? false,
        }
      })
    }

    res.status(201).json(guardian)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /:id - Get guardian
router.get('/:id', async (req, res) => {
  try {
    const guardian = await prisma.guardian.findUnique({
      where: { id: req.params.id },
      include: {
        children: { include: { child: { select: { id: true, fullName: true } } } },
        students: { include: { student: { select: { id: true, fullName: true } } } }
      }
    })
    if (!guardian) return res.status(404).json({ error: 'Guardian not found' })
    res.json(guardian)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PATCH /:id - Update guardian
router.patch('/:id', async (req, res) => {
  try {
    const { childId, studentId, isPrimary, canPickup, receiveNotif, ...guardianData } = req.body
    const guardian = await prisma.guardian.update({
      where: { id: req.params.id },
      data: guardianData
    })
    res.json(guardian)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// DELETE /link - Unlink a guardian from a child
router.delete('/link', async (req, res) => {
  try {
    const childId = (req.query.childId || req.body.childId) as string
    const guardianId = (req.query.guardianId || req.body.guardianId) as string
    
    if (!childId || !guardianId) {
      return res.status(400).json({ error: 'childId and guardianId are required' })
    }

    await prisma.childGuardian.deleteMany({
      where: {
        childId,
        guardianId
      }
    })

    res.json({ success: true })
  } catch (error: any) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error', detail: error.message })
  }
})

// DELETE /:id - Delete guardian
router.delete('/:id', async (req, res) => {
  try {
    await prisma.guardian.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

import bcrypt from 'bcryptjs'

// POST /:id/create-user - Generate access for a guardian
router.post('/:id/create-user', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    if (!schoolId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    const guardianId = req.params.id

    const guardian = await prisma.guardian.findUnique({
      where: { id: guardianId }
    })

    if (!guardian) {
      return res.status(404).json({ error: 'Guardian not found' })
    }
    if (guardian.userId) {
      return res.status(400).json({ error: 'Guardian already has a user account' })
    }
    if (!guardian.email) {
      return res.status(400).json({ error: 'Guardian must have an email address to create an account' })
    }

    // Check if user with email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: guardian.email }
    })
    
    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email already exists' })
    }

    // Generate random 6-digit numeric password
    const tempPassword = Math.floor(100000 + Math.random() * 900000).toString()
    const hashedPassword = await bcrypt.hash(tempPassword, 10)

    // Create User
    const user = await prisma.user.create({
      data: {
        email: guardian.email,
        password: hashedPassword,
        name: guardian.fullName,
        role: 'GUARDIAN',
        phone: guardian.phone || undefined,
        schoolId: schoolId,
      }
    })

    // Update Guardian with userId
    await prisma.guardian.update({
      where: { id: guardian.id },
      data: { userId: user.id }
    })

    res.status(201).json({
      success: true,
      email: user.email,
      password: tempPassword,
      message: 'Access generated successfully'
    })
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /link - Link an existing guardian to a child
router.post('/link', async (req, res) => {
  try {
    const { childId, guardianId, isPrimary } = req.body
    
    if (!childId || !guardianId) {
      return res.status(400).json({ error: 'childId and guardianId are required' })
    }

    const link = await prisma.childGuardian.upsert({
      where: {
        childId_guardianId: { childId, guardianId }
      },
      update: {
        isPrimary: isPrimary ?? false
      },
      create: {
        childId,
        guardianId,
        isPrimary: isPrimary ?? false
      }
    })

    res.json(link)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})


export default router
