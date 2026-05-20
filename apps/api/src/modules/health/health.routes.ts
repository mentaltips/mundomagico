import { Router } from 'express'
import { requirePermission } from '../../shared/middlewares/permissions.middleware'
import * as healthController from './health.controller'

const router = Router()

router.use(requirePermission('canManageStudents'))

router.get('/', healthController.getActiveMedications)
router.get('/medications', healthController.getMedications)
router.post('/medications', healthController.createMedication)
router.patch('/medications/:id', healthController.updateMedication)
router.post('/medications/:id/administer', healthController.administerMedication)

export default router

