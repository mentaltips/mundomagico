import { Router } from 'express'
import { requirePermission } from '../../shared/middlewares/permissions.middleware'
import * as whatsappController from './whatsapp.controller'

const router = Router()

router.use(requirePermission('canSendWhatsapp'))

router.get('/status', whatsappController.getStatus)
router.post('/logout', whatsappController.logout)
router.get('/messages', whatsappController.listMessages)
router.get('/messages/:id', whatsappController.getMessage)
router.post('/messages/:id/retry', whatsappController.retryMessage)
router.post('/messages/:id/cancel', whatsappController.cancelMessage)
router.post('/broadcast', whatsappController.broadcast)

export default router

