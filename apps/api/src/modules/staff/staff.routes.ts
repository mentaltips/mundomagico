import { Router } from 'express'
import { requirePermission } from '../../shared/middlewares/permissions.middleware'
import * as staffController from './staff.controller'

const router = Router()

// --- Payments ---
router.get('/payments', requirePermission('canViewPayroll'), staffController.getPayments)
router.post('/payments/generate', requirePermission('canManagePayroll'), staffController.generatePayments)
router.patch('/payments/:paymentId', requirePermission('canManagePayroll'), staffController.updatePayment)
router.post('/payments/:paymentId/bonus', requirePermission('canManagePayroll'), staffController.addBonus)
router.post('/payments/:paymentId/deduction', requirePermission('canManagePayroll'), staffController.addDeduction)

// --- Staff CRUD ---
router.get('/', requirePermission('canManageStaff'), staffController.listStaff)
router.post('/', requirePermission('canManageStaff'), staffController.createStaff)
router.patch('/:id', requirePermission('canManageStaff'), staffController.updateStaff)
router.delete('/:id', requirePermission('canManageStaff'), staffController.deleteStaff)

// --- Group Assignments ---
router.post('/:id/assignments', requirePermission('canManageStaff'), staffController.assignGroup)
router.delete('/:id/assignments/:assignmentId', requirePermission('canManageStaff'), staffController.removeGroupAssignment)

export default router

