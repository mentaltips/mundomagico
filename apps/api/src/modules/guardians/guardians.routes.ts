import { Router } from 'express'
import { requirePermission } from '../../shared/middlewares/permissions.middleware'
import * as guardiansController from './guardians.controller'

const router = Router()

router.get('/', guardiansController.listGuardians)
router.post('/', requirePermission('canManageStudents'), guardiansController.createGuardian)
router.post('/link', requirePermission('canManageStudents'), guardiansController.linkGuardian)
router.delete('/link', requirePermission('canManageStudents'), guardiansController.unlinkGuardian)
router.get('/:id', guardiansController.getGuardian)
router.patch('/:id', requirePermission('canManageStudents'), guardiansController.updateGuardian)
router.post('/:id/create-user', requirePermission('canManageUsers'), guardiansController.createGuardianUser)
router.delete('/:id', requirePermission('canManageStudents'), guardiansController.deleteGuardian)

export default router
