import { prisma } from '@mundo-magico/database'
import { schoolPublicSelect } from '../../shared/security/school-secrets'
import type { CreateInvoiceInput, ListInvoicesQuery, UpdateInvoiceInput } from './finance.schema'

export function listInvoices(schoolId: string, query: ListInvoicesQuery) {
  return prisma.invoice.findMany({
    where: {
      schoolId,
      ...(query.status && { status: query.status }),
      ...(query.childId && { childId: query.childId }),
      ...(query.studentId && { studentId: query.studentId }),
      ...(query.referenceMonth && { referenceMonth: query.referenceMonth }),
    },
    include: {
      child: { select: { id: true, fullName: true } },
      student: { select: { id: true, fullName: true } },
      payments: true,
    },
    orderBy: { dueDate: 'desc' },
  })
}

export function findInvoiceById(schoolId: string, id: string) {
  return prisma.invoice.findFirst({
    where: { id, schoolId },
  })
}

export function getInvoiceDetails(schoolId: string, id: string) {
  return prisma.invoice.findFirst({
    where: { id, schoolId },
    include: {
      child: { include: { guardians: true } },
      student: { select: { id: true, fullName: true } },
      payments: true,
      school: { select: schoolPublicSelect },
    },
  })
}

export function createInvoice(schoolId: string, input: CreateInvoiceInput) {
  const { dueDate, boletoExpiry, pixExpiry, paidAt, childId, studentId, ...invoiceData } = input

  return prisma.invoice.create({
    data: {
      ...invoiceData,
      childId,
      studentId,
      schoolId,
      dueDate: new Date(dueDate),
      ...(boletoExpiry && { boletoExpiry: new Date(boletoExpiry) }),
      ...(pixExpiry && { pixExpiry: new Date(pixExpiry) }),
      ...(paidAt && { paidAt: new Date(paidAt) }),
    },
  })
}

export async function updateInvoice(schoolId: string, id: string, input: UpdateInvoiceInput) {
  const { dueDate, boletoExpiry, pixExpiry, paidAt, childId, studentId, ...invoiceData } = input

  await prisma.invoice.update({
    where: { id },
    data: {
      ...invoiceData,
      ...(childId !== undefined && { childId }),
      ...(studentId !== undefined && { studentId }),
      ...(dueDate && { dueDate: new Date(dueDate) }),
      ...(boletoExpiry && { boletoExpiry: new Date(boletoExpiry) }),
      ...(pixExpiry && { pixExpiry: new Date(pixExpiry) }),
      ...(paidAt && { paidAt: new Date(paidAt) }),
    },
  })

  return findInvoiceById(schoolId, id)
}

export function deleteInvoice(id: string) {
  return prisma.invoice.delete({ where: { id } })
}

export function findChildById(schoolId: string, childId: string) {
  return prisma.child.findFirst({ where: { id: childId, schoolId } })
}

export function findStudentById(schoolId: string, studentId: string) {
  return prisma.student.findFirst({ where: { id: studentId, schoolId } })
}

export function findGuardianById(schoolId: string, guardianId: string) {
  return prisma.guardian.findFirst({ where: { id: guardianId, schoolId } })
}

export function payInvoiceManually(
  schoolId: string,
  invoice: { id: string; amount: any },
  input: { amount?: string; paymentMethod?: string },
) {
  const paidAt = new Date()
  const paidAmount = input.amount ?? invoice.amount
  const manualGatewayPaymentId = `MANUAL:${invoice.id}`

  return prisma.$transaction(async (tx) => {
    const invoiceUpdate = await tx.invoice.updateMany({
      where: {
        id: invoice.id,
        schoolId,
        status: { not: 'PAGO' },
      },
      data: {
        status: 'PAGO',
        paidAt,
        paidAmount,
      },
    })

    if (invoiceUpdate.count === 0) return null

    await tx.payment.upsert({
      where: {
        gateway_gatewayPaymentId: {
          gateway: 'MANUAL',
          gatewayPaymentId: manualGatewayPaymentId,
        },
      },
      update: {
        schoolId,
        invoiceId: invoice.id,
        amount: paidAmount,
        method: input.paymentMethod || 'DINHEIRO',
        paidAt,
      },
      create: {
        schoolId,
        invoiceId: invoice.id,
        amount: paidAmount,
        method: input.paymentMethod || 'DINHEIRO',
        gateway: 'MANUAL',
        gatewayPaymentId: manualGatewayPaymentId,
        paidAt,
      },
    })

    return tx.invoice.findFirst({
      where: { id: invoice.id, schoolId },
      include: { payments: true },
    })
  })
}
