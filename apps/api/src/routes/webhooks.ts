import { Router, Request, Response } from 'express'
import crypto from 'crypto'
import { prisma } from '@mundo-magico/database'

const router = Router()

// ─── Verificação de assinatura do Mercado Pago ────────────────────────────────
// Docs: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
function verifyMercadoPagoSignature(req: Request): boolean {
  const webhookSecret = process.env.MP_WEBHOOK_SECRET
  if (!webhookSecret) {
    // Se o secret não estiver configurado, loga aviso e bloqueia em produção
    if (process.env.NODE_ENV === 'production') {
      console.error('[Webhook MP] MP_WEBHOOK_SECRET não configurado! Configure no .env.prod')
      return false
    }
    console.warn('[Webhook MP] MP_WEBHOOK_SECRET não configurado. Pulando verificação em dev.')
    return true
  }

  try {
    const xSignature = req.headers['x-signature'] as string
    const xRequestId = req.headers['x-request-id'] as string

    if (!xSignature || !xRequestId) return false

    // Extrai ts e v1 do header x-signature
    // Formato: ts=<timestamp>,v1=<hash>
    const parts = xSignature.split(',')
    const tsPart = parts.find((p) => p.startsWith('ts='))
    const v1Part = parts.find((p) => p.startsWith('v1='))

    if (!tsPart || !v1Part) return false

    const ts = tsPart.split('=')[1]
    const v1 = v1Part.split('=')[1]

    // O data-id vem na query string
    const dataId = (req.query['data.id'] || req.query.id) as string | undefined

    // Monta a string de assinatura conforme documentação MP
    let signatureTemplate = `ts:${ts}`
    if (dataId) signatureTemplate = `id:${dataId};request-id:${xRequestId};ts:${ts}`

    const expectedHash = crypto
      .createHmac('sha256', webhookSecret)
      .update(signatureTemplate)
      .digest('hex')

    return crypto.timingSafeEqual(
      Buffer.from(expectedHash, 'hex'),
      Buffer.from(v1, 'hex')
    )
  } catch {
    return false
  }
}

// ─── POST /webhooks/mercadopago ───────────────────────────────────────────────
// Rota pública (sem requireApiAuth) — chamada diretamente pelo Mercado Pago
router.post('/mercadopago', async (req, res) => {
  // 1. Verifica assinatura
  if (!verifyMercadoPagoSignature(req)) {
    console.warn('[Webhook MP] Assinatura inválida — requisição rejeitada.')
    return res.status(401).json({ error: 'Assinatura inválida' })
  }

  const { type, data } = req.body

  // MP sempre espera 200 rápido, processamos de forma assíncrona
  res.status(200).json({ received: true })

  // 2. Processa o evento de forma assíncrona
  try {
    if (type === 'payment') {
      const paymentId = data?.id
      if (!paymentId) return

      console.log(`[Webhook MP] Evento de pagamento recebido: ${paymentId}`)

      // Busca a fatura vinculada ao ID de pagamento do MP
      const invoice = await prisma.invoice.findFirst({
        where: {
          OR: [
            { mpPaymentId: String(paymentId) },
            { mpPreferenceId: String(paymentId) },
          ],
        },
      })

      if (!invoice) {
        console.warn(`[Webhook MP] Fatura não encontrada para paymentId=${paymentId}`)
        return
      }

      // Atualiza status da fatura com base no status MP
      const mpStatus = req.body.status || 'approved'

      if (mpStatus === 'approved') {
        await prisma.$transaction([
          prisma.invoice.update({
            where: { id: invoice.id },
            data: {
              status: 'PAGO',
              mpPaymentId: String(paymentId),
              mpPaymentStatus: mpStatus,
              paidAt: new Date(),
              paidAmount: invoice.amount,
            },
          }),
          prisma.payment.create({
            data: {
              invoiceId: invoice.id,
              method: 'PIX',
              mpPaymentId: String(paymentId),
              mpStatus,
              amount: invoice.amount,
              paidAt: new Date(),
              webhookData: JSON.stringify(req.body),
            },
          }),
        ])
        console.log(`[Webhook MP] ✅ Fatura ${invoice.id} marcada como PAGA via MP.`)
      } else if (mpStatus === 'rejected' || mpStatus === 'cancelled') {
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: { mpPaymentStatus: mpStatus },
        })
        console.log(`[Webhook MP] Pagamento ${paymentId} com status: ${mpStatus}`)
      }
    }
  } catch (err) {
    console.error('[Webhook MP] Erro ao processar evento:', err)
  }
})

export default router
