import { Router } from 'express'
import { requirePermission } from '../../shared/middlewares/permissions.middleware'
import * as childrenController from './children.controller'

const router = Router()

router.get('/', childrenController.listChildren)
router.post('/', requirePermission('canManageStudents'), childrenController.createChild)
router.get('/:id', childrenController.getChild)
router.patch('/:id', requirePermission('canManageStudents'), childrenController.updateChild)
router.delete('/:id', requirePermission('canManageStudents'), childrenController.deleteChild)
router.get('/:id/guardians', childrenController.listGuardians)
router.get('/:id/authorized-pickups', childrenController.listAuthorizedPickups)
router.post('/:id/authorized-pickups', requirePermission('canManageStudents'), childrenController.createAuthorizedPickup)
router.delete('/:id/authorized-pickups/:personId', requirePermission('canManageStudents'), childrenController.deleteAuthorizedPickup)
router.get('/:id/documents', childrenController.listDocuments)

export default router
