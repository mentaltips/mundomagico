import { Router } from 'express'
import { requirePermission } from '../../shared/middlewares/permissions.middleware'
import * as calendarController from './calendar.controller'

const router = Router()

router.use(requirePermission('canManageStudents'))

router.get('/', calendarController.listEvents)
router.post('/', calendarController.createEvent)
router.patch('/:id', calendarController.updateEvent)
router.delete('/:id', calendarController.deleteEvent)

export default router

