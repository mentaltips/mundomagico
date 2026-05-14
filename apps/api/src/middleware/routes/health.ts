import { Router } from 'express'
import { prisma } from '@mundo-magico/database'

const router = Router()

// GET / - List children with active medications
router.get('/', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const children = await prisma.child.findMany({
      where: {
        schoolId,
        medications: { some: { active: true } }
      },
      include: {
        group: { select: { id: true, name: true } },
        medications: {
          where: { active: true },
          include: {
            administrations: {
              orderBy: { administeredAt: 'desc' },
              take: 5
            }
          }
        }
      },
      orderBy: { fullName: 'asc' }
    })
    res.json(children)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /medications - List all medications
router.get('/medications', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const { childId, active } = req.query
    const medications = await prisma.medication.findMany({
      where: {
        schoolId,
        ...(childId && { childId: childId as string }),
        ...(active !== undefined && { active: active === 'true' }),
      },
      include: {
        child: { select: { id: true, fullName: true } },
        administrations: {
          orderBy: { administeredAt: 'desc' },
          take: 10
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json(medications)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /medications - Create medication
router.post('/medications', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const { startDate, endDate, guardianAuthDate, ...rest } = req.body
    const medication = await prisma.medication.create({
      data: {
        ...rest,
        schoolId,
        startDate: new Date(startDate),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(guardianAuthDate && { guardianAuthDate: new Date(guardianAuthDate) }),
      }
    })
    res.status(201).json(medication)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PATCH /medications/:id - Update medication
router.patch('/medications/:id', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const { startDate, endDate, guardianAuthDate, ...rest } = req.body
    const result = await prisma.medication.updateMany({
      where: { id: req.params.id, schoolId },
      data: {
        ...rest,
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(guardianAuthDate && { guardianAuthDate: new Date(guardianAuthDate) }),
      }
    })
    if (result.count === 0) return res.status(404).json({ error: 'Medication not found' })
    const updated = await prisma.medication.findUnique({ where: { id: req.params.id } })
    res.json(updated)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /medications/:id/administer - Register administration
router.post('/medications/:id/administer', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const administeredBy = req.user?.sub as string
    const medication = await prisma.medication.findFirst({ where: { id: req.params.id, schoolId } })
    if (!medication) return res.status(404).json({ error: 'Medication not found' })

    const { administeredAt, dosage, notes } = req.body
    const admin = await prisma.medicationAdministration.create({
      data: {
        medicationId: req.params.id,
        administeredBy,
        administeredAt: administeredAt ? new Date(administeredAt) : new Date(),
        dosage: dosage || medication.dosage,
        notes,
      }
    })
    res.status(201).json(admin)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
