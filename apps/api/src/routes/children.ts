import { Router } from 'express'
import { prisma } from '@mundo-magico/database'
import { validate } from '../middleware/validate'
import { createChildSchema, updateChildSchema, createAuthorizedPickupSchema } from '../schemas'

const router = Router()

// GET / - List all children
router.get('/', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const children = await prisma.child.findMany({
      where: { schoolId },
      include: {
        group: true,
        _count: { select: { guardians: true, medications: true, documents: true } }
      },
      orderBy: { fullName: 'asc' }
    })
    res.json(children)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST / - Create child
router.post('/', validate(createChildSchema), async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const { birthDate, entryDate, exitDate, imageAuthDate, ...rest } = req.body
    const child = await prisma.child.create({
      data: {
        ...rest,
        schoolId,
        birthDate: new Date(birthDate),
        entryDate: entryDate ? new Date(entryDate) : undefined,
        exitDate: exitDate ? new Date(exitDate) : undefined,
        imageAuthDate: imageAuthDate ? new Date(imageAuthDate) : undefined,
      }
    })
    res.status(201).json(child)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /:id - Get child by id
router.get('/:id', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const child = await prisma.child.findFirst({
      where: { id: req.params.id, schoolId },
      include: {
        group: true,
        guardians: { include: { guardian: true } },
        authorizedPickups: true,
        medications: true,
        documents: true,
      }
    })
    if (!child) return res.status(404).json({ error: 'Child not found' })
    res.json(child)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PATCH /:id - Update child
router.patch('/:id', validate(updateChildSchema), async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const { birthDate, entryDate, exitDate, imageAuthDate, ...rest } = req.body
    const child = await prisma.child.updateMany({
      where: { id: req.params.id, schoolId },
      data: {
        ...rest,
        ...(birthDate && { birthDate: new Date(birthDate) }),
        ...(entryDate && { entryDate: new Date(entryDate) }),
        ...(exitDate && { exitDate: new Date(exitDate) }),
        ...(imageAuthDate && { imageAuthDate: new Date(imageAuthDate) }),
      }
    })
    if (child.count === 0) return res.status(404).json({ error: 'Child not found' })
    const updated = await prisma.child.findUnique({ where: { id: req.params.id } })
    res.json(updated)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// DELETE /:id - Delete child
router.delete('/:id', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const result = await prisma.child.deleteMany({ where: { id: req.params.id, schoolId } })
    if (result.count === 0) return res.status(404).json({ error: 'Child not found' })
    res.json({ success: true })
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /:id/guardians
router.get('/:id/guardians', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const child = await prisma.child.findFirst({ where: { id: req.params.id, schoolId } })
    if (!child) return res.status(404).json({ error: 'Child not found' })
    const guardians = await prisma.childGuardian.findMany({
      where: { childId: req.params.id },
      include: { guardian: true }
    })
    res.json(guardians)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /:id/authorized-pickups
router.get('/:id/authorized-pickups', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const child = await prisma.child.findFirst({ where: { id: req.params.id, schoolId } })
    if (!child) return res.status(404).json({ error: 'Child not found' })
    const pickups = await prisma.authorizedPickupPerson.findMany({ where: { childId: req.params.id } })
    res.json(pickups)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /:id/authorized-pickups
router.post('/:id/authorized-pickups', validate(createAuthorizedPickupSchema), async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const child = await prisma.child.findFirst({ where: { id: req.params.id, schoolId } })
    if (!child) return res.status(404).json({ error: 'Child not found' })
    const { validUntil, ...rest } = req.body
    const person = await prisma.authorizedPickupPerson.create({
      data: {
        ...rest,
        childId: req.params.id,
        ...(validUntil && { validUntil: new Date(validUntil) }),
      }
    })
    res.status(201).json(person)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// DELETE /:id/authorized-pickups/:personId
router.delete('/:id/authorized-pickups/:personId', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const child = await prisma.child.findFirst({ where: { id: req.params.id, schoolId } })
    if (!child) return res.status(404).json({ error: 'Child not found' })
    await prisma.authorizedPickupPerson.delete({ where: { id: req.params.personId } })
    res.json({ success: true })
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /:id/documents
router.get('/:id/documents', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const child = await prisma.child.findFirst({ where: { id: req.params.id, schoolId } })
    if (!child) return res.status(404).json({ error: 'Child not found' })
    const documents = await prisma.childDocument.findMany({ where: { childId: req.params.id } })
    res.json(documents)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
