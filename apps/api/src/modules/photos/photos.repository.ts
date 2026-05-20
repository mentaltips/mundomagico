import { prisma } from '@mundo-magico/database'

export function findMany(filters: {
  schoolId: string
  childId?: string
  groupId?: string
  sharedWithParents?: boolean
}) {
  return prisma.childPhoto.findMany({
    where: {
      schoolId: filters.schoolId,
      ...(filters.childId && { childId: filters.childId }),
      ...(filters.groupId && { groupId: filters.groupId }),
      ...(filters.sharedWithParents !== undefined && { sharedWithParents: filters.sharedWithParents }),
    },
    include: {
      child: { select: { id: true, fullName: true } },
    },
    orderBy: { date: 'desc' },
  })
}

export function create(data: any) {
  return prisma.childPhoto.create({
    data,
  })
}

export function verifyChild(childId: string, schoolId: string) {
  return prisma.child.findFirst({
    where: { id: childId, schoolId },
  })
}

export function verifyGroup(groupId: string, schoolId: string) {
  return prisma.group.findFirst({
    where: { id: groupId, schoolId, active: true },
  })
}

export function deleteById(id: string, schoolId: string) {
  return prisma.childPhoto.deleteMany({
    where: { id, schoolId },
  })
}
