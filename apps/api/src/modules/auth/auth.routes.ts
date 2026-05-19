import { Router } from 'express'
import { requireApiAuth } from '../../middleware/auth'
import * as authController from './auth.controller'

const router = Router()

router.post('/login', authController.login)
router.post('/refresh', authController.refresh)
router.get('/me', requireApiAuth, authController.me)
router.post('/change-password', requireApiAuth, authController.changePassword)

export default router
