import { Router } from 'express'
import { requireApiAuth } from '../../middleware/auth'
import { loginRateLimit } from '../../middlewares/login-rate-limit'
import * as authController from './auth.controller'

const router = Router()

router.post('/login', loginRateLimit, authController.login)
router.post('/refresh', authController.refresh)
router.get('/me', requireApiAuth, authController.me)
router.post('/change-password', requireApiAuth, authController.changePassword)

export default router
