import { prisma } from '@mundo-magico/database'

export function findMany(filters: { schoolId: string; childId?: string; startDate?: Date; endDate?: Date }) {
  return prisma.childCheckInOut.findMany({
    where: {
      schoolId: filters.schoolId,
      ...(filters.childId && { childId: filters.childId }),
      ...(filters.startDate && filters.endDate && {
        date: {
          gte: filters.startDate,
          lte: filters.endDate,
        },
      }),
    },
    include: {
      child: true,
      checkedBy: { select: { id: true, name: true } },
    },
    orderBy: { date: 'desc' },
  })
}

export function upsert(
  childId: string,
  dateKey: string,
  updateData: any,
  createData: any
) {
  return prisma.childCheckInOut.upsert({
    where: { childId_dateKey: { childId, dateKey } },
    update: updateData,
    create: createData,
  })
}

export function verifyChild(childId: string, schoolId: string) {
  return prisma.child.findFirst({
    where: { id: childId, schoolId },
    select: { id: true },
  })
}

export function verifyGroup(groupId: string, schoolId: string) {
  return prisma.group.findFirst({
    where: { id: groupId, schoolId, active: true },
    select: { id: true },
  })
}

export function findChildrenWithStatus(filters: {
  schoolId: string
  groupId?: string
  statusList: string[]
  startDate: Date
  endDate: Date
}) {
  return prisma.child.findMany({
    where: {
      schoolId: filters.schoolId,
      status: { in: filters.statusList },
      ...(filters.groupId && { groupId: filters.groupId }),
    },
    include: {
      group: true,
      checkInOuts: {
        where: {
          date: { gte: filters.startDate, lte: filters.endDate },
        },
      },
      guardians: {
        include: { guardian: true },
        where: { canPickup: true },
      },
      authorizedPickups: {
        where: { authorization: { in: ['SIM', 'TEMPORARIO'] } },
      },
    },
    orderBy: { fullName: 'asc' },
  })
}

export function findMonthlyChildren(filters: {
  schoolId: string
  groupId?: string
  startDate: Date
  endDate: Date
}) {
  return prisma.child.findMany({
    where: {
      schoolId: filters.schoolId,
      status: { in: ['ATIVO', 'ADAPTACAO'] },
      ...(filters.groupId && { groupId: filters.groupId }),
    },
    include: {
      group: true,
      checkInOuts: {
        where: {
          date: { gte: filters.startDate, lte: filters.endDate },
        },
        orderBy: { date: 'asc' },
      },
    },
    orderBy: [{ group: { name: 'asc' } }, { fullName: 'asc' }],
  })
}
