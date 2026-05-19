import { Router } from 'express'
import { prisma } from '@mundo-magico/database'
import { queueWhatsAppMessage } from '../../services/whatsapp-messages'
import { AppError } from '../../shared/errors/AppError'
import { ERROR_CODES } from '../../shared/errors/error-codes'
import { hasPermission } from '../../shared/middlewares/permissions.middleware'

const router = Router()

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

router.post('/', async (req, res, next) => {
  try {
    const schoolId = req.user?.schoolId
    if (!schoolId) {
      throw new AppError('Tenant ID is required', 400, ERROR_CODES.TENANT_REQUIRED)
    }

    const { sentAt, sendWhatsApp, ...rest } = req.body

    if (sendWhatsApp && !hasPermission(req.user?.role, 'canSendWhatsapp')) {
      throw new AppError('Acesso negado para envio de WhatsApp', 403, ERROR_CODES.FORBIDDEN)
    }

    const announcement = await prisma.announcement.create({
      data: {
        ...rest,
        schoolId,
        ...(sentAt && { sentAt: new Date(sentAt) }),
      }
    })

    let queuedWhatsAppMessages = 0

    if (sendWhatsApp) {
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

      const recipients = new Map<string, string | null>()
      const allGuardians = [
        ...children.flatMap((child) => child.guardians.map((guardianLink) => guardianLink.guardian)),
        ...students.flatMap((student) => student.guardians.map((guardianLink) => guardianLink.guardian))
      ]

      allGuardians.forEach((guardian) => {
        if (guardian?.phone && !recipients.has(guardian.phone)) {
          recipients.set(guardian.phone, guardian.fullName)
        }
      })

      const message = `COMUNICADO: ${announcement.title}\n\n${announcement.content}\n\n_Enviado por Mundo Magico_`

      for (const [phone, recipientName] of recipients) {
        await queueWhatsAppMessage({
          schoolId,
          to: phone,
          recipientName,
          type: 'ANNOUNCEMENT',
          content: message,
        })
        queuedWhatsAppMessages++
      }
    }

    res.status(201).json({ ...announcement, queuedWhatsAppMessages })
  } catch (error) {
    next(error)
  }
})

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
