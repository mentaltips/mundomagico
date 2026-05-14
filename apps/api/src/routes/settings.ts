import { Router } from 'express'
import { prisma } from '@mundo-magico/database'

const router = Router()

// GET / - Get school settings
router.get('/', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        name: true,
        cnpj: true,
        phone: true,
        email: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        logoUrl: true,
        institutionType: true,
        activeModules: true,
        terminology: true,
        whatsappPhone: true,
        smtpHost: true,
        smtpPort: true,
        smtpUser: true,
        smtpFrom: true,
        createdAt: true,
        updatedAt: true,
      }
    })
    if (!school) return res.status(404).json({ error: 'School not found' })
    res.json(school)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PATCH / - Update school settings
router.patch('/', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    // Remove sensitive tokens from direct update; use specific endpoints for those
    const {
      whatsappToken,
      mpAccessToken,
      mpPublicKey,
      smtpPass,
      ...safeData
    } = req.body

    const school = await prisma.school.update({
      where: { id: schoolId },
      data: {
        ...safeData,
        ...(whatsappToken && { whatsappToken }),
        ...(mpAccessToken && { mpAccessToken }),
        ...(mpPublicKey && { mpPublicKey }),
        ...(smtpPass && { smtpPass }),
      },
    })
    res.json(school)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /institution-type - Get institution type and modules
router.get('/institution-type', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { institutionType: true, activeModules: true, terminology: true }
    })
    if (!school) return res.status(404).json({ error: 'School not found' })
    res.json(school)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PATCH /institution-type - Update institution type and modules
router.patch('/institution-type', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const { institutionType, activeModules, terminology } = req.body
    const school = await prisma.school.update({
      where: { id: schoolId },
      data: {
        ...(institutionType && { institutionType }),
        ...(activeModules !== undefined && { activeModules }),
        ...(terminology !== undefined && { terminology }),
      }
    })
    res.json({ institutionType: school.institutionType, activeModules: school.activeModules, terminology: school.terminology })
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
