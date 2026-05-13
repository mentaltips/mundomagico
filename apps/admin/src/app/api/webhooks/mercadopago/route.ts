import { NextResponse } from 'next/server'
import { prisma } from '@mundo-magico/database'
import { MercadoPagoConfig, Payment } from 'mercadopago'

const ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN || ''

// POST /api/webhooks/mercadopago
// Mercado Pago envia notificações de pagamento aqui
export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log('[MP_WEBHOOK]', JSON.stringify(body))

    // O MP envia: { type: "payment", action: "payment.updated", data: { id: "123" } }
    if (body.type !== 'payment' || !body.data?.id) {
      return NextResponse.json({ ok: true }) // Ignorar outros eventos
    }

    const mpPaymentId = String(body.data.id)

    // Buscar detalhes do pagamento no MP
    const client = new MercadoPagoConfig({ accessToken: ACCESS_TOKEN })
    const paymentApi = new Payment(client)
    const paymentData = await paymentApi.get({ id: mpPaymentId })

    const invoiceId = paymentData.external_reference
    const mpStatus = paymentData.status // approved | pending | rejected | cancelled
    const paidAt = paymentData.date_approved ? new Date(paymentData.date_approved) : null

    if (!invoiceId) {
      console.warn('[MP_WEBHOOK] external_reference vazio — ignorando')
      return NextResponse.json({ ok: true })
    }

    // Mapear status do MP para status interno
    const invoiceStatus =
      mpStatus === 'approved' ? 'PAGO'
      : mpStatus === 'rejected' || mpStatus === 'cancelled' ? 'CANCELADO'
      : 'PENDENTE'

    // Atualizar fatura
    await prisma.invoice.updateMany({
      where: { id: invoiceId },
      data: {
        mpPaymentId,
        mpPaymentStatus: mpStatus,
        status: invoiceStatus,
        paidAt: invoiceStatus === 'PAGO' ? paidAt : undefined,
        paidAmount: invoiceStatus === 'PAGO' ? paymentData.transaction_amount : undefined,
      },
    })

    // Criar ou atualizar registro de Payment
    await prisma.payment.upsert({
      where: { id: `mp-${mpPaymentId}` },
      create: {
        id: `mp-${mpPaymentId}`,
        invoiceId,
        method: mapPaymentMethod(paymentData.payment_method_id || ''),
        mpPaymentId,
        mpStatus,
        amount: paymentData.transaction_amount || 0,
        paidAt,
        webhookData: JSON.stringify(body),
      },
      update: {
        mpStatus,
        paidAt,
        webhookData: JSON.stringify(body),
      },
    })

    console.log(`[MP_WEBHOOK] Fatura ${invoiceId} → ${invoiceStatus}`)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[MP_WEBHOOK_ERROR]', error)
    // Retornar 200 para evitar reenvios infinitos do MP
    return NextResponse.json({ ok: true })
  }
}

function mapPaymentMethod(mpMethod: string): string {
  if (mpMethod === 'pix') return 'PIX'
  if (mpMethod.includes('bolbradesco') || mpMethod.includes('pec')) return 'BOLETO'
  if (['visa', 'master', 'amex', 'elo', 'hipercard'].includes(mpMethod)) return 'CARTAO'
  return 'OUTRO'
}
