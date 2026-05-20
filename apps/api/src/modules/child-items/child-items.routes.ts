import { Router } from 'express'
import { requirePermission } from '../../shared/middlewares/permissions.middleware'
import * as childItemsController from './child-items.controller'

const router = Router()

router.use(requirePermission('canManageStudents'))

router.get('/', childItemsController.listItems)
router.post('/', childItemsController.createItem)
router.patch('/:id', childItemsController.updateItem)
router.delete('/:id', childItemsController.deleteItem)
router.post('/:id/use', childItemsController.registerUsage)
router.post('/:id/replenish', childItemsController.replenishStock)

export default router

