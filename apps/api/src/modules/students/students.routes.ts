import { Router } from 'express'
import { requirePermission } from '../../shared/middlewares/permissions.middleware'
import * as studentsController from './students.controller'

const router = Router()

router.get('/', studentsController.listStudents)
router.get('/:id', studentsController.getStudent)
router.post('/', requirePermission('canManageStudents'), studentsController.createStudent)

export default router
