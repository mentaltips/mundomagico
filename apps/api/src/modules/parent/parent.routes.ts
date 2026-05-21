import { Router } from 'express'
import * as parentController from './parent.controller'

const router = Router()

router.get('/dashboard', parentController.getDashboard)
router.get('/feed', parentController.getFeed)
router.get('/invoices', parentController.listMyInvoices)
router.post('/invoices/:id/pay', parentController.payMyInvoice)

export default router
