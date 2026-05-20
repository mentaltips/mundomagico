import { Router } from 'express'
import * as parentController from './parent.controller'

const router = Router()

router.get('/dashboard', parentController.getDashboard)
router.get('/feed', parentController.getFeed)

export default router

