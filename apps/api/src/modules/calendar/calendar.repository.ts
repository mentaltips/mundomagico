import { prisma } from '@mundo-magico/database'

export function findMany(filters: { schoolId: string; startDate?: Date; endDate?: Date }) {
  return prisma.calendarEvent.findMany({
    where: {
      schoolId: filters.schoolId,
      ...(filters.startDate && filters.endDate && {
        date: {
          gte: filters.startDate,
          lte: filters.endDate,
        },
      }),
    },
    orderBy: { date: 'asc' },
  })
}

export function findFirst(id: string, schoolId: string) {
  return prisma.calendarEvent.findFirst({
    where: { id, schoolId },
  })
}

export function create(data: any) {
  return prisma.calendarEvent.create({
    data,
  })
}

export function update(id: string, schoolId: string, data: any) {
  return prisma.calendarEvent.updateMany({
    where: { id, schoolId },
    data,
  })
}

export function deleteById(id: string, schoolId: string) {
  return prisma.calendarEvent.deleteMany({
    where: { id, schoolId },
  })
}

export function verifyGroup(groupId: string, schoolId: string) {
  return prisma.group.findFirst({
    where: { id: groupId, schoolId, active: true },
  })
}
