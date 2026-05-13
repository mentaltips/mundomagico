import { Router } from 'express'
import { prisma } from '@mundo-magico/database'

const router = Router()

// GET / - List guardians (those linked to children or students of this school)
router.get('/', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const guardians = await prisma.guardian.findMany({
      where: {
        OR: [
          { children: { some: { child: { schoolId } } } },
          { students: { some: { student: { schoolId } } } },
        ]
      },
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
    const { childId, studentId, isPrimary, canPickup, receiveNotif, ...guardianData } = req.body
    const guardian = await prisma.guardian.create({
      data: guardianData
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

export default router
