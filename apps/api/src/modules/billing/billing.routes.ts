import { Router } from 'express'
import { requirePermission } from '../../shared/middlewares/permissions.middleware'
import * as billingController from './billing.controller'

const router = Router()

router.post('/generate-monthly', requirePermission('canManageFinance'), billingController.generateMonthly)
router.get('/preview-monthly', requirePermission('canViewFinance'), billingController.previewMonthly)
router.post('/invoices/:id/payment-link', requirePermission('canManageFinance'), billingController.generatePaymentLink)

export default router
