import { Router } from 'express'
import { prisma } from '@mundo-magico/database'
import { createWhatsAppService } from '../services/whatsapp'

const router = Router()

// GET / - List announcements
router.get('/', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const announcements = await prisma.announcement.findMany({
      where: { schoolId },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }]
    })
    res.json(announcements)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST / - Create announcement
router.post('/', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const { sentAt, sendWhatsApp, ...rest } = req.body
    
    const announcement = await prisma.announcement.create({
      data: {
        ...rest,
        schoolId,
        ...(sentAt && { sentAt: new Date(sentAt) }),
      }
    })

    // Se marcado para enviar via WhatsApp
    if (sendWhatsApp) {
      const school = await prisma.school.findUnique({ where: { id: schoolId } })
      // @ts-ignore
      const whatsapp = createWhatsAppService({ token: school?.whatsappToken, phoneNumberId: school?.whatsappPhone })
      
      if (whatsapp) {
        // Buscar todos os responsáveis da escola
        const [children, students] = await Promise.all([
          prisma.child.findMany({ 
            where: { schoolId, status: 'ATIVO' },
            include: { guardians: { include: { guardian: true } } }
          }),
          prisma.student.findMany({ 
            where: { schoolId, status: 'ATIVO' },
            include: { guardians: { include: { guardian: true } } }
          })
        ])

        const phones = new Set<string>()
        const allGuardians = [
          ...children.flatMap(c => c.guardians.map(g => g.guardian)),
          ...students.flatMap(s => s.guardians.map(g => g.guardian))
        ]

        allGuardians.forEach(g => {
          if (g?.phone) phones.add(g.phone)
        })

        const message = `📢 *COMUNICADO: ${announcement.title}*\n\n${announcement.content}\n\n_Enviado por Mundo Mágico_`
        
        // Enviar para todos (idealmente via fila/worker, mas vamos direto para teste)
        for (const phone of Array.from(phones)) {
          await whatsapp.sendTextMessage(phone, message)
        }
      }
    }

    res.status(201).json(announcement)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PATCH /:id - Update announcement
router.patch('/:id', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const { sentAt, ...rest } = req.body
    const result = await prisma.announcement.updateMany({
      where: { id: req.params.id, schoolId },
      data: {
        ...rest,
        ...(sentAt && { sentAt: new Date(sentAt) }),
      }
    })
    if (result.count === 0) return res.status(404).json({ error: 'Announcement not found' })
    const updated = await prisma.announcement.findUnique({ where: { id: req.params.id } })
    res.json(updated)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// DELETE /:id - Delete announcement
router.delete('/:id', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const result = await prisma.announcement.deleteMany({ where: { id: req.params.id, schoolId } })
    if (result.count === 0) return res.status(404).json({ error: 'Announcement not found' })
    res.json({ success: true })
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
