import { Router } from 'express'
import { prisma } from '@mundo-magico/database'
import bcrypt from 'bcryptjs'

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

// POST / - Create guardian and optionally link to child/student
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

// POST /link - Link existing guardian to a child
router.post('/link', async (req, res) => {
  try {
    const { childId, guardianId, isPrimary, canPickup, receiveNotif } = req.body
    if (!childId || !guardianId) {
      return res.status(400).json({ error: 'childId and guardianId are required' })
    }
    const link = await prisma.childGuardian.create({
      data: {
        childId,
        guardianId,
        isPrimary: isPrimary ?? false,
        canPickup: canPickup ?? true,
        receiveNotif: receiveNotif ?? true,
      }
    })
    res.status(201).json(link)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /:id - Get guardian by id
router.get('/:id', async (req, res) => {
  try {
    const guardian = await prisma.guardian.findUnique({
      where: { id: req.params.id },
      include: {
        children: { include: { child: true } },
        students: { include: { student: true } }
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
      where: { childId, guardianId }
    })
    res.json({ success: true })
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /:id/create-user - Generate User access for a guardian
router.post('/:id/create-user', async (req, res) => {
  try {
    const guardianId = req.params.id
    const guardian = await prisma.guardian.findUnique({ where: { id: guardianId } })

    if (!guardian) {
      return res.status(404).json({ error: 'Responsável não encontrado' })
    }
    if (!guardian.email) {
      return res.status(400).json({ error: 'Responsável não possui e-mail cadastrado' })
    }
    
    let user = await prisma.user.findUnique({ where: { email: guardian.email } })
    const passwordStr = Math.floor(100000 + Math.random() * 900000).toString() // 6 digit password
    const hashedPassword = await bcrypt.hash(passwordStr, 10)

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword, role: 'GUARDIAN' }
      })
    } else {
      user = await prisma.user.create({
        data: {
          name: guardian.fullName,
          email: guardian.email,
          password: hashedPassword,
          role: 'GUARDIAN',
          schoolId: guardian.schoolId,
          active: true,
        }
      })
    }

    await prisma.guardian.update({
      where: { id: guardian.id },
      data: { userId: user.id }
    })

    res.json({ email: user.email, password: passwordStr })
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// DELETE /:id - Delete guardian
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const schoolId = req.user?.schoolId
    
    if (!schoolId) return res.status(401).json({ error: 'Not authorized' })

    const guardian = await prisma.guardian.findFirst({
      where: { id, schoolId }
    })

    if (!guardian) return res.status(404).json({ error: 'Responsável não encontrado' })

    // Delete associations first to avoid foreign key errors
    await prisma.childGuardian.deleteMany({ where: { guardianId: id } })
    await prisma.studentGuardian.deleteMany({ where: { guardianId: id } })

    // Delete the guardian
    await prisma.guardian.delete({ where: { id } })

    // Optionally delete the user if it's not used elsewhere (linked only to this guardian)
    if (guardian.userId) {
      // Check if user is only linked here (Guardian relation is 1-1 in schema)
      await prisma.user.delete({ where: { id: guardian.userId } }).catch(() => {
        // Ignore if user deletion fails (might be a staff member too)
      })
    }

    res.json({ success: true })
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
