import { Router } from 'express'
import { requirePermission } from '../../shared/middlewares/permissions.middleware'
import * as financeController from './finance.controller'

const router = Router()

router.get('/invoices', requirePermission('canViewFinance'), financeController.listInvoices)
router.post('/invoices', requirePermission('canManageFinance'), financeController.createInvoices)
router.delete('/invoices/:id', requirePermission('canManageFinance'), financeController.deleteInvoice)
router.get('/invoices/:id', requirePermission('canViewFinance'), financeController.getInvoiceDetails)
router.patch('/invoices/:id', requirePermission('canManageFinance'), financeController.updateInvoice)
router.post('/invoices/:id/pay', requirePermission('canManageFinance'), financeController.payInvoiceManually)

export default router

