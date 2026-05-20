import { Router } from 'express'
import { requirePermission } from '../../shared/middlewares/permissions.middleware'
import * as checkInOutController from './check-in-out.controller'

const router = Router()

router.use(requirePermission('canManageStudents'))

router.get('/', checkInOutController.listRecords)
router.post('/', checkInOutController.registerCheckInOut)
router.get('/children', checkInOutController.listChildrenStatus)
router.get('/report/monthly', checkInOutController.getMonthlyReport)

export default router
