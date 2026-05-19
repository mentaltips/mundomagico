import { Router } from 'express'
import { requirePermission } from '../../shared/middlewares/permissions.middleware'
import * as groupsController from './groups.controller'

const router = Router()

router.get('/', groupsController.listGroups)
router.post('/', requirePermission('canManageStudents'), groupsController.createGroup)
router.patch('/:id', requirePermission('canManageStudents'), groupsController.updateGroup)
router.delete('/:id', requirePermission('canManageStudents'), groupsController.deleteGroup)

export default router
