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
