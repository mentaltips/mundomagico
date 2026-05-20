import { MercadoPagoConfig, Payment } from 'mercadopago'
import { isSameMoneyValue } from '../../shared/security/payment-webhook-policy'
import { decrypt } from '../../shared/utils/crypto'
import type { MercadoPagoWebhookPayload } from './webhooks.schema'
import * as paymentWebhookRepository from './payment-webhooks.repository'

const MERCADO_PAGO_GATEWAY = 'MERCADO_PAGO'

export async function processMercadoPagoWebhook(payload: MercadoPagoWebhookPayload, queryPaymentId?: unknown) {
  const paymentId = payload.data?.id || queryPaymentId
  const externalId = paymentId ? String(paymentId) : null

  const webhookEvent = await paymentWebhookRepository.createWebhookEvent({
    gateway: MERCADO_PAGO_GATEWAY,
    eventType: payload.type,
    externalId,
    rawPayload: payload,
  })

  if (payload.type !== 'payment') {
    await paymentWebhookRepository.updateWebhookEvent(webhookEvent.id, {
      status: 'IGNORED',
      error: 'Unsupported Mercado Pago event type',
      processedAt: new Date(),
    })
    return
  }

  if (!externalId) {
    await paymentWebhookRepository.updateWebhookEvent(webhookEvent.id, {
      status: 'FAILED',
      error: 'Missing Mercado Pago payment id',
      processedAt: new Date(),
    })
    return
  }

  console.log(`[Webhook MP] Evento de pagamento recebido: ${externalId}`)

  const existingEvent = await paymentWebhookRepository.findProcessedEvent(MERCADO_PAGO_GATEWAY, externalId)
  if (existingEvent) {
    console.log(`[Webhook MP] Evento ${externalId} ja processado anteriormente. Pulando redundancia (Idempotencia).`)
    await paymentWebhookRepository.updateWebhookEvent(webhookEvent.id, {
      schoolId: existingEvent.schoolId,
      invoiceId: existingEvent.invoiceId,
      paymentId: existingEvent.paymentId,
      status: 'IGNORED',
      error: 'Duplicate processed webhook event',
      processedAt: new Date(),
    })
    return
  }

  const invoice = await paymentWebhookRepository.findInvoiceForMercadoPagoPayment(externalId)
  if (!invoice) {
    console.warn(`[Webhook MP] Fatura nao encontrada para paymentId=${externalId}`)
    await paymentWebhookRepository.updateWebhookEvent(webhookEvent.id, {
      status: 'IGNORED',
      error: 'Invoice not found for Mercado Pago payment',
      processedAt: new Date(),
    })
    return
  }

  const encryptedAccessToken = invoice.school.integrationSecret?.mpAccessToken
  const accessToken = encryptedAccessToken ? decrypt(encryptedAccessToken) : process.env.MP_ACCESS_TOKEN
  if (!accessToken) {
    await paymentWebhookRepository.updateWebhookEvent(webhookEvent.id, {
      schoolId: invoice.schoolId,
      invoiceId: invoice.id,
      status: 'FAILED',
      error: 'Mercado Pago access token not configured',
      processedAt: new Date(),
    })
    return
  }

  const client = new MercadoPagoConfig({ accessToken })
  const mpPayment = new Payment(client)
  const mpData = await mpPayment.get({ id: externalId })
  const mpStatus = mpData.status

  console.log(`[Webhook MP] Status consultado no MP para ${externalId}: ${mpStatus}`)

  if (mpStatus !== 'approved') {
    await paymentWebhookRepository.updateInvoiceMercadoPagoStatusForSchool(invoice.id, invoice.schoolId, mpStatus)
    await paymentWebhookRepository.updateWebhookEvent(webhookEvent.id, {
      schoolId: invoice.schoolId,
      invoiceId: invoice.id,
      status: 'IGNORED',
      processedAt: new Date(),
    })
    return
  }

  const amount = mpData.transaction_amount || invoice.amount
  if (!isSameMoneyValue(amount, invoice.amount)) {
    await paymentWebhookRepository.updateWebhookEvent(webhookEvent.id, {
      schoolId: invoice.schoolId,
      invoiceId: invoice.id,
      status: 'FAILED',
      error: `Amount mismatch. invoice=${invoice.amount} gateway=${amount}`,
      processedAt: new Date(),
    })
    console.warn(`[Webhook MP] Valor divergente para invoice=${invoice.id}: invoice=${invoice.amount} gateway=${amount}`)
    return
  }

  const existingPayment = await paymentWebhookRepository.findPaymentByGatewayId(MERCADO_PAGO_GATEWAY, externalId)
  if (invoice.status === 'PAGO' && !existingPayment) {
    await paymentWebhookRepository.updateWebhookEvent(webhookEvent.id, {
      schoolId: invoice.schoolId,
      invoiceId: invoice.id,
      status: 'FAILED',
      error: 'Invoice already paid by another payment',
      processedAt: new Date(),
    })
    console.warn(`[Webhook MP] Fatura ${invoice.id} ja estava paga por outro pagamento.`)
    return
  }

  const webhookData = JSON.parse(JSON.stringify(mpData))

  await paymentWebhookRepository.applyApprovedMercadoPagoPayment({
    invoice,
    externalId,
    mpStatus,
    paymentMethod: mpData.payment_method_id,
    amount,
    webhookData,
    webhookEventId: webhookEvent.id,
  })

  console.log(`[Webhook MP] Fatura ${invoice.id} marcada como PAGA apos consulta ao MP.`)
}
