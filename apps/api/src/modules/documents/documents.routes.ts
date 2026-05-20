import { Router } from 'express'
import { requirePermission } from '../../shared/middlewares/permissions.middleware'
import * as documentsController from './documents.controller'

const router = Router()

router.use(requirePermission('canManageStudents'))

router.get('/:id', documentsController.getDocument)
router.post('/', documentsController.createDocument)
router.delete('/:id', documentsController.deleteDocument)

export default router

