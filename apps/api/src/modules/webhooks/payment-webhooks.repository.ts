import { prisma } from '@mundo-magico/database'

export function findProcessedEvent(gateway: string, externalId: string) {
  return prisma.paymentWebhookEvent.findFirst({
    where: {
      gateway,
      externalId,
      status: 'PROCESSED',
    },
  })
}

export function createWebhookEvent(input: {
  gateway: string
  eventType?: string
  externalId: string
  rawPayload: unknown
}) {
  return prisma.paymentWebhookEvent.create({
    data: {
      gateway: input.gateway,
      eventType: input.eventType,
      externalId: input.externalId,
      rawPayload: input.rawPayload as any,
    },
  })
}

export function updateWebhookEvent(
  id: string,
  data: {
    schoolId?: string | null
    invoiceId?: string | null
    paymentId?: string | null
    status: string
    error?: string | null
    processedAt?: Date
  },
) {
  return prisma.paymentWebhookEvent.update({
    where: { id },
    data,
  })
}

export function findInvoiceForMercadoPagoPayment(externalId: string) {
  return prisma.invoice.findFirst({
    where: {
      OR: [
        { mpPaymentId: externalId },
        { mpPreferenceId: externalId },
        { payments: { some: { gateway: 'MERCADO_PAGO', gatewayPaymentId: externalId } } },
      ],
    },
    include: {
      school: {
        select: {
          mpAccessToken: true,
        },
      },
    },
  })
}

export function updateInvoiceMercadoPagoStatus(invoiceId: string, mpPaymentStatus?: string | null) {
  return prisma.invoice.update({
    where: { id: invoiceId },
    data: { mpPaymentStatus },
  })
}

export function findPaymentByGatewayId(gateway: string, gatewayPaymentId: string) {
  return prisma.payment.findUnique({
    where: {
      gateway_gatewayPaymentId: {
        gateway,
        gatewayPaymentId,
      },
    },
  })
}

export function applyApprovedMercadoPagoPayment(input: {
  invoice: {
    id: string
    schoolId: string
  }
  externalId: string
  mpStatus?: string | null
  paymentMethod?: string | null
  amount: unknown
  webhookData: unknown
  webhookEventId: string
}) {
  const paidAt = new Date()

  return prisma.$transaction(async (tx) => {
    await tx.invoice.update({
      where: { id: input.invoice.id },
      data: {
        status: 'PAGO',
        mpPaymentId: input.externalId,
        mpPaymentStatus: input.mpStatus,
        paidAt,
        paidAmount: input.amount as any,
      },
    })

    const payment = await tx.payment.upsert({
      where: {
        gateway_gatewayPaymentId: {
          gateway: 'MERCADO_PAGO',
          gatewayPaymentId: input.externalId,
        },
      },
      update: {
        schoolId: input.invoice.schoolId,
        invoiceId: input.invoice.id,
        method: input.paymentMethod?.toUpperCase() || 'PIX',
        mpPaymentId: input.externalId,
        mpStatus: input.mpStatus,
        amount: input.amount as any,
        paidAt,
        webhookData: input.webhookData as any,
      },
      create: {
        schoolId: input.invoice.schoolId,
        invoiceId: input.invoice.id,
        method: input.paymentMethod?.toUpperCase() || 'PIX',
        gateway: 'MERCADO_PAGO',
        gatewayPaymentId: input.externalId,
        mpPaymentId: input.externalId,
        mpStatus: input.mpStatus,
        amount: input.amount as any,
        paidAt,
        webhookData: input.webhookData as any,
      },
    })

    await tx.paymentWebhookEvent.update({
      where: { id: input.webhookEventId },
      data: {
        schoolId: input.invoice.schoolId,
        invoiceId: input.invoice.id,
        paymentId: payment.id,
        status: 'PROCESSED',
        processedAt: new Date(),
      },
    })
  })
}

