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

export default router
