import { prisma } from '@mundo-magico/database'

// --- Staff CRUD ---
export function findManyStaff(schoolId: string) {
  return prisma.staff.findMany({
    where: { schoolId, deletedAt: null },
    include: {
      user: { select: { id: true, name: true, email: true, active: true } },
      groupAssignments: {
        where: { status: 'ACTIVE' },
        include: { group: { select: { id: true, name: true } } },
      },
    },
    orderBy: { name: 'asc' },
  })
}

export function findStaffFirst(id: string, schoolId: string) {
  return prisma.staff.findFirst({
    where: { id, schoolId, deletedAt: null },
  })
}

export function createStaff(data: any) {
  return prisma.staff.create({
    data,
  })
}

export function updateStaff(id: string, schoolId: string, data: any) {
  return prisma.staff.updateMany({
    where: { id, schoolId, deletedAt: null },
    data,
  })
}

export function softDeleteStaff(id: string, schoolId: string) {
  return prisma.staff.updateMany({
    where: { id, schoolId, deletedAt: null },
    data: { deletedAt: new Date(), status: 'INACTIVE' },
  })
}

export function verifyUser(userId: string, schoolId: string) {
  return prisma.user.findFirst({
    where: { id: userId, schoolId, active: true },
  })
}

export function verifyGroup(groupId: string, schoolId: string) {
  return prisma.group.findFirst({
    where: { id: groupId, schoolId, active: true },
  })
}

// --- Group Assignments ---
export function findAssignment(schoolId: string, staffId: string, groupId: string) {
  return prisma.staffGroupAssignment.findFirst({
    where: { schoolId, staffId, groupId, status: 'ACTIVE' },
  })
}

export function updateAssignment(id: string, schoolId: string, data: any) {
  return prisma.staffGroupAssignment.updateMany({
    where: { id, schoolId },
    data,
  })
}

export function createAssignment(data: any) {
  return prisma.staffGroupAssignment.create({
    data,
  })
}

export function deleteAssignment(id: string, staffId: string, schoolId: string) {
  return prisma.staffGroupAssignment.deleteMany({
    where: { id, staffId, schoolId },
  })
}

// --- Payments ---
export function findPayments(filters: {
  schoolId: string
  referenceMonth?: number
  referenceYear?: number
  staffId?: string
  status?: string
}) {
  return prisma.staffPayment.findMany({
    where: {
      schoolId: filters.schoolId,
      ...(filters.referenceMonth && { referenceMonth: filters.referenceMonth }),
      ...(filters.referenceYear && { referenceYear: filters.referenceYear }),
      ...(filters.staffId && { staffId: filters.staffId }),
      ...(filters.status && { status: filters.status }),
    },
    include: {
      staff: {
        select: {
          id: true,
          name: true,
          roleType: true,
          photoUrl: true,
          pixKey: true,
          bankName: true,
          bankAgency: true,
          bankAccount: true,
        },
      },
      bonuses: true,
      deductions: true,
    },
    orderBy: { staff: { name: 'asc' } },
  })
}

export function findActiveStaffMembers(schoolId: string, staffId?: string) {
  return prisma.staff.findMany({
    where: {
      schoolId,
      status: 'ACTIVE',
      deletedAt: null,
      ...(staffId && { id: staffId }),
    },
  })
}

export function findPaymentUnique(staffId: string, referenceMonth: number, referenceYear: number) {
  return prisma.staffPayment.findUnique({
    where: {
      staffId_referenceMonth_referenceYear: {
        staffId,
        referenceMonth,
        referenceYear,
      },
    },
  })
}

export function createPayment(data: any) {
  return prisma.staffPayment.create({
    data,
    include: { staff: true },
  })
}

export function findPaymentFirst(id: string, schoolId: string) {
  return prisma.staffPayment.findFirst({
    where: { id, schoolId },
  })
}

export function updatePayment(id: string, schoolId: string, data: any) {
  return prisma.staffPayment.updateMany({
    where: { id, schoolId },
    data,
  })
}

// --- Bonuses & Deductions ---
export function createBonus(data: any) {
  return prisma.staffPaymentBonus.create({
    data,
  })
}

export function findBonuses(paymentId: string, schoolId: string) {
  return prisma.staffPaymentBonus.findMany({
    where: { staffPaymentId: paymentId, schoolId },
  })
}

export function createDeduction(data: any) {
  return prisma.staffPaymentDeduction.create({
    data,
  })
}

export function findDeductions(paymentId: string, schoolId: string) {
  return prisma.staffPaymentDeduction.findMany({
    where: { staffPaymentId: paymentId, schoolId },
  })
}
