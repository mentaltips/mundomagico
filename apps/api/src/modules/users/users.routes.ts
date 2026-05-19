import { Router } from 'express'
import { requirePermission } from '../../shared/middlewares/permissions.middleware'
import * as usersController from './users.controller'

const router = Router()

router.get('/', usersController.listUsers)
router.post('/', requirePermission('canManageUsers'), usersController.createUser)
router.get('/:id', usersController.getUser)
router.patch('/:id', requirePermission('canManageUsers'), usersController.updateUser)
router.post('/:id/reset-password', requirePermission('canManageUsers'), usersController.resetPassword)
router.delete('/:id', requirePermission('canManageUsers'), usersController.deactivateUser)

export default router
