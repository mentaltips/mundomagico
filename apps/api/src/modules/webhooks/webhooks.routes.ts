import { Router } from 'express'
import * as webhooksController from './webhooks.controller'

const router = Router()

router.post('/mercadopago', webhooksController.mercadoPago)

export default router

