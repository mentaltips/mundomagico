import { Router } from 'express'
import { requirePermission } from '../../shared/middlewares/permissions.middleware'
import * as announcementsController from './announcements.controller'

const router = Router()

router.use(requirePermission('canManageStudents'))

router.get('/', announcementsController.listAnnouncements)
router.post('/', announcementsController.createAnnouncement)
router.patch('/:id', announcementsController.updateAnnouncement)
router.delete('/:id', announcementsController.deleteAnnouncement)

export default router

