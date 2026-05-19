import type { Request, Response } from 'express'
import { verifyMercadoPagoSignature } from './mercado-pago-signature'
import { processMercadoPagoWebhook } from './payment-webhooks.service'
import { mercadoPagoWebhookSchema } from './webhooks.schema'

export async function mercadoPago(req: Request, res: Response) {
  if (!verifyMercadoPagoSignature(req)) {
    console.warn('[Webhook MP] Assinatura invalida')
    return res.status(401).json({ error: 'Assinatura invalida' })
  }

  const payload = mercadoPagoWebhookSchema.parse(req.body)
  res.status(200).json({ received: true })

  try {
    await processMercadoPagoWebhook(payload, req.query.id)
  } catch (err) {
    console.error('[Webhook MP] Erro ao processar evento:', err)
  }
}

