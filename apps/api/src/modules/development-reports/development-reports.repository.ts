import { prisma } from '@mundo-magico/database'

export function findMany(filters: { schoolId: string; childId?: string; isDraft?: boolean }) {
  return prisma.developmentReport.findMany({
    where: {
      schoolId: filters.schoolId,
      ...(filters.childId && { childId: filters.childId }),
      ...(filters.isDraft !== undefined && { isDraft: filters.isDraft }),
    },
    include: {
      child: { select: { id: true, fullName: true, photoUrl: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export function findFirst(id: string, schoolId: string) {
  return prisma.developmentReport.findFirst({
    where: { id, schoolId },
    include: {
      child: { select: { id: true, fullName: true, photoUrl: true } },
    },
  })
}

export function create(data: any) {
  return prisma.developmentReport.create({
    data,
  })
}

export function update(id: string, schoolId: string, data: any) {
  return prisma.developmentReport.updateMany({
    where: { id, schoolId },
    data,
  })
}

export function deleteById(id: string, schoolId: string) {
  return prisma.developmentReport.deleteMany({
    where: { id, schoolId },
  })
}

export function verifyChild(childId: string, schoolId: string) {
  return prisma.child.findFirst({
    where: { id: childId, schoolId },
  })
}
