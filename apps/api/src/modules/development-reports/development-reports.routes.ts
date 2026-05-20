import { Router } from 'express'
import { requirePermission } from '../../shared/middlewares/permissions.middleware'
import * as reportsController from './development-reports.controller'

const router = Router()

router.use(requirePermission('canManageStudents'))

router.get('/', reportsController.listReports)
router.get('/:id', reportsController.getReport)
router.post('/', reportsController.createReport)
router.patch('/:id', reportsController.updateReport)
router.delete('/:id', reportsController.deleteReport)
router.post('/:id/publish', reportsController.publishReport)

export default router

