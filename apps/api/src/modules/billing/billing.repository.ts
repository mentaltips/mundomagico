import { Prisma, prisma } from '@mundo-magico/database'

export function findBillableChildren(schoolId: string, referenceMonth: string) {
  return prisma.child.findMany({
    where: { schoolId, status: { in: ['ATIVO', 'ADAPTACAO'] }, monthlyFee: { gt: 0 } },
    include: { invoices: { where: { referenceMonth } } },
  })
}

export function findBillableStudents(schoolId: string, referenceMonth: string) {
  return prisma.student.findMany({
    where: { schoolId, status: 'ATIVO', monthlyFee: { gt: 0 } },
    include: { invoices: { where: { referenceMonth } } },
  })
}

export function countChildrenWithoutFee(schoolId: string) {
  return prisma.child.count({
    where: {
      schoolId,
      status: { in: ['ATIVO', 'ADAPTACAO'] },
      OR: [{ monthlyFee: null }, { monthlyFee: 0 }],
    },
  })
}

export function countStudentsWithoutFee(schoolId: string) {
  return prisma.student.count({
    where: {
      schoolId,
      status: 'ATIVO',
      OR: [{ monthlyFee: null }, { monthlyFee: 0 }],
    },
  })
}

export function createInvoice(data: Prisma.InvoiceUncheckedCreateInput) {
  return prisma.invoice.create({ data })
}

export function findMonthlyChildInvoice(schoolId: string, childId: string, referenceMonth: string) {
  return prisma.invoice.findFirst({
    where: { schoolId, childId, referenceMonth },
    select: { id: true },
  })
}

export function findMonthlyStudentInvoice(schoolId: string, studentId: string, referenceMonth: string) {
  return prisma.invoice.findFirst({
    where: { schoolId, studentId, referenceMonth },
    select: { id: true },
  })
}

export function findInvoiceForPaymentLink(schoolId: string, invoiceId: string) {
  return prisma.invoice.findFirst({
    where: { id: invoiceId, schoolId },
    include: {
      child: { select: { fullName: true } },
      student: { select: { fullName: true } },
      school: {
        select: {
          name: true,
          integrationSecret: { select: { mpAccessToken: true, mpPublicKey: true } },
        },
      },
    },
  })
}

export function updateInvoiceCheckoutData(
  schoolId: string,
  invoiceId: string,
  data: { mpPreferenceId?: string; checkoutUrl?: string | null; mpPaymentStatus?: string | null },
) {
  return prisma.invoice.updateMany({
    where: { id: invoiceId, schoolId },
    data,
  })
}

export function savePixPaymentData(input: {
  schoolId: string
  invoiceId: string
  paymentId: string
  amount: unknown
  mpStatus?: string | null
  qrCodeBase64: string
  copyPaste: string
  expiresAt?: Date
  raw: unknown
}) {
  return prisma.$transaction(async (tx) => {
    await tx.invoice.updateMany({
      where: { id: input.invoiceId, schoolId: input.schoolId },
      data: {
        mpPaymentId: input.paymentId,
        mpPaymentStatus: input.mpStatus,
        pixQrCode: input.qrCodeBase64,
        pixCopyPaste: input.copyPaste,
        pixExpiry: input.expiresAt,
      },
    })

    return tx.payment.upsert({
      where: {
        gateway_gatewayPaymentId: {
          gateway: 'MERCADO_PAGO',
          gatewayPaymentId: input.paymentId,
        },
      },
      update: {
        schoolId: input.schoolId,
        invoiceId: input.invoiceId,
        method: 'PIX',
        mpPaymentId: input.paymentId,
        mpStatus: input.mpStatus,
        amount: input.amount as any,
        webhookData: input.raw as any,
      },
      create: {
        schoolId: input.schoolId,
        invoiceId: input.invoiceId,
        method: 'PIX',
        gateway: 'MERCADO_PAGO',
        gatewayPaymentId: input.paymentId,
        mpPaymentId: input.paymentId,
        mpStatus: input.mpStatus,
        amount: input.amount as any,
        webhookData: input.raw as any,
      },
    })
  })
}

export function applyApprovedMercadoPagoPayment(input: {
  schoolId: string
  invoiceId: string
  paymentId: string
  paymentMethod?: string | null
  amount: unknown
  mpStatus?: string | null
  raw: unknown
}) {
  const paidAt = new Date()

  return prisma.$transaction(async (tx) => {
    await tx.invoice.updateMany({
      where: { id: input.invoiceId, schoolId: input.schoolId },
      data: {
        status: 'PAGO',
        mpPaymentId: input.paymentId,
        mpPaymentStatus: input.mpStatus,
        paidAt,
        paidAmount: input.amount as any,
      },
    })

    return tx.payment.upsert({
      where: {
        gateway_gatewayPaymentId: {
          gateway: 'MERCADO_PAGO',
          gatewayPaymentId: input.paymentId,
        },
      },
      update: {
        schoolId: input.schoolId,
        invoiceId: input.invoiceId,
        method: input.paymentMethod?.toUpperCase() || 'PIX',
        mpPaymentId: input.paymentId,
        mpStatus: input.mpStatus,
        amount: input.amount as any,
        paidAt,
        webhookData: input.raw as any,
      },
      create: {
        schoolId: input.schoolId,
        invoiceId: input.invoiceId,
        method: input.paymentMethod?.toUpperCase() || 'PIX',
        gateway: 'MERCADO_PAGO',
        gatewayPaymentId: input.paymentId,
        mpPaymentId: input.paymentId,
        mpStatus: input.mpStatus,
        amount: input.amount as any,
        paidAt,
        webhookData: input.raw as any,
      },
    })
  })
}
