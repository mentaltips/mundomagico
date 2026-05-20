import { prisma } from '@mundo-magico/database'

export function findStaffByUserId(userId: string, schoolId: string) {
  return prisma.staff.findFirst({
    where: { userId, schoolId, status: 'ACTIVE' },
  })
}

export function findStaffGroupAssignments(staffId: string) {
  return prisma.staffGroupAssignment.findMany({
    where: { staffId, status: 'ACTIVE' },
    include: {
      group: {
        include: {
          _count: { select: { children: true, students: true } },
        },
      },
    },
  })
}

export function findActiveGroups(schoolId: string) {
  return prisma.group.findMany({
    where: { schoolId, active: true },
    include: {
      _count: { select: { children: true, students: true } },
    },
  })
}

export function findCheckInOutsForGroups(schoolId: string, groupIds: string[], startDate: Date, endDate: Date) {
  return prisma.childCheckInOut.findMany({
    where: {
      schoolId,
      date: { gte: startDate, lte: endDate },
      child: { groupId: { in: groupIds } },
    },
    include: { child: { select: { id: true, fullName: true } } },
  })
}

export function countPendingReportsForGroups(schoolId: string, groupIds: string[], startDate: Date, endDate: Date) {
  return prisma.childDailyReport.count({
    where: {
      schoolId,
      isDraft: true,
      date: { gte: startDate, lte: endDate },
      child: { groupId: { in: groupIds } },
    },
  })
}

export function findTeacherAnnouncements(schoolId: string) {
  return prisma.announcement.findMany({
    where: {
      schoolId,
      OR: [
        { targetRole: 'TEACHER' },
        { targetRole: 'PROFESSOR' },
        { targetRole: 'CAREGIVER' },
        { targetRole: 'CUIDADOR' },
        { targetRole: null },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })
}

export function findStaffGroupAssignmentsWithDetails(staffId: string) {
  return prisma.staffGroupAssignment.findMany({
    where: { staffId, status: 'ACTIVE' },
    include: {
      group: {
        include: {
          children: {
            select: { id: true, fullName: true, photoUrl: true, status: true },
          },
          students: {
            select: { id: true, fullName: true, photoUrl: true, status: true },
          },
          _count: { select: { children: true, students: true } },
        },
      },
    },
  })
}

export function findActiveGroupsWithDetails(schoolId: string) {
  return prisma.group.findMany({
    where: { schoolId, active: true },
    include: {
      children: {
        select: { id: true, fullName: true, photoUrl: true, status: true },
      },
      students: {
        select: { id: true, fullName: true, photoUrl: true, status: true },
      },
      _count: { select: { children: true, students: true } },
    },
    orderBy: { name: 'asc' },
  })
}

export function findStaffGroupAssignment(staffId: string, groupId: string) {
  return prisma.staffGroupAssignment.findFirst({
    where: { staffId, groupId, status: 'ACTIVE' },
  })
}

export function findGroupFirst(id: string, schoolId: string) {
  return prisma.group.findFirst({
    where: { id, schoolId },
    include: {
      children: {
        where: { status: 'ATIVO' },
        include: {
          medications: { where: { active: true } },
        },
      },
      students: { where: { status: 'ATIVO' } },
    },
  })
}

export function findChildrenForAttendance(schoolId: string, groupIds?: string[], groupId?: string) {
  return prisma.child.findMany({
    where: {
      schoolId,
      status: 'ATIVO',
      ...(groupIds && groupIds.length > 0
        ? { groupId: { in: groupIds } }
        : groupId
        ? { groupId }
        : {}),
    },
    include: {
      group: { select: { id: true, name: true } },
    },
    orderBy: { fullName: 'asc' },
  })
}

export function findCheckInOutsForDateRange(childIds: string[], startDate: Date, endDate: Date) {
  return prisma.childCheckInOut.findMany({
    where: {
      childId: { in: childIds },
      date: { gte: startDate, lte: endDate },
    },
  })
}

export function findChildrenByIdsAndSchool(ids: string[], schoolId: string) {
  return prisma.child.findMany({
    where: { id: { in: ids }, schoolId },
    select: { id: true, groupId: true },
  })
}

export function upsertCheckInOut(where: any, update: any, create: any) {
  return prisma.childCheckInOut.upsert({
    where,
    update,
    create,
  })
}
