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
        whatsappToken: true,
        whatsappPhone: true,
        smtpHost: true,
        smtpPort: true,
        smtpUser: true,
        smtpFrom: true,
        mpPublicKey: true,
        // @ts-ignore - Prisma client refresh delay
        autoGenerateInvoices: true,
        // @ts-ignore
        billingGenerationDay: true,
        // @ts-ignore
        invoiceDescription: true,
        createdAt: true,
        updatedAt: true,
      }
    })
    if (!school) return res.status(404).json({ error: 'School not found' })

    const formatted = {
      ...school,
      activeModules: school.activeModules ? JSON.parse(school.activeModules) : [],
      terminology: school.terminology ? JSON.parse(school.terminology) : {},
    }

    res.json(formatted)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PATCH / - Update school settings
router.patch('/', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const {
      name, cnpj, phone, email, address, city, state, zipCode, logoUrl,
      whatsappToken, whatsappPhone, smtpHost, smtpPort, smtpUser, smtpPass, smtpFrom,
      mpAccessToken, mpPublicKey,
      autoGenerateInvoices, billingGenerationDay, invoiceDescription
    } = req.body

    const school = await prisma.school.update({
      where: { id: schoolId },
      data: {
        name, cnpj, phone, email, address, city, state, zipCode, logoUrl,
        whatsappToken, whatsappPhone, smtpHost, 
        smtpPort: smtpPort ? parseInt(smtpPort) : undefined, 
        smtpUser, smtpFrom,
        ...(smtpPass && { smtpPass }),
        ...(mpAccessToken && { mpAccessToken }),
        mpPublicKey,
        autoGenerateInvoices,
        billingGenerationDay: billingGenerationDay ? parseInt(billingGenerationDay) : undefined,
        invoiceDescription
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

    const formatted = {
      institutionType: school.institutionType,
      activeModules: school.activeModules ? JSON.parse(school.activeModules) : [],
      terminology: school.terminology ? JSON.parse(school.terminology) : {},
    }

    res.json(formatted)
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
        ...(activeModules !== undefined && { 
          activeModules: Array.isArray(activeModules) ? JSON.stringify(activeModules) : (activeModules || "[]") 
        }),
        ...(terminology !== undefined && { 
          terminology: typeof terminology === 'object' ? JSON.stringify(terminology) : (terminology || "{}") 
        }),
      }
    })
    res.json({ 
      institutionType: school.institutionType, 
      activeModules: school.activeModules ? JSON.parse(school.activeModules) : [], 
      terminology: school.terminology ? JSON.parse(school.terminology) : {} 
    })
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
