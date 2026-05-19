import type { Request } from 'express'
import crypto from 'crypto'

export function verifyMercadoPagoSignature(req: Request): boolean {
  const webhookSecret = process.env.MP_WEBHOOK_SECRET
  if (!webhookSecret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[Webhook MP] MP_WEBHOOK_SECRET nao configurado')
      return false
    }
    console.warn('[Webhook MP] MP_WEBHOOK_SECRET nao configurado. Pulando verificacao em dev.')
    return true
  }

  try {
    const xSignature = req.headers['x-signature'] as string
    const xRequestId = req.headers['x-request-id'] as string

    if (!xSignature || !xRequestId) return false

    const parts = xSignature.split(',')
    const tsPart = parts.find((part) => part.startsWith('ts='))
    const v1Part = parts.find((part) => part.startsWith('v1='))

    if (!tsPart || !v1Part) return false

    const ts = tsPart.split('=')[1]
    const v1 = v1Part.split('=')[1]
    const dataId = (req.query['data.id'] || req.query.id) as string | undefined

    let signatureTemplate = `ts:${ts}`
    if (dataId) signatureTemplate = `id:${dataId};request-id:${xRequestId};ts:${ts}`

    const expectedHash = crypto
      .createHmac('sha256', webhookSecret)
      .update(signatureTemplate)
      .digest('hex')

    return crypto.timingSafeEqual(
      Buffer.from(expectedHash, 'hex'),
      Buffer.from(v1, 'hex'),
    )
  } catch {
    return false
  }
}

