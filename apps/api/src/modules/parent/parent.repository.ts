import { prisma } from '@mundo-magico/database'

export function findGuardianByUserId(userId: string, schoolId: string) {
  return prisma.guardian.findFirst({
    where: { userId, schoolId },
  })
}

export function findChildrenByGuardianId(guardianId: string, schoolId: string) {
  return prisma.childGuardian.findMany({
    where: { guardianId, child: { schoolId } },
    include: {
      child: {
        include: {
          group: { select: { id: true, name: true, shift: true } },
        },
      },
    },
  })
}

export function findCheckInOutsForChildren(schoolId: string, childIds: string[], startDate: Date, endDate: Date) {
  return prisma.childCheckInOut.findMany({
    where: {
      schoolId,
      childId: { in: childIds },
      date: { gte: startDate, lte: endDate },
    },
  })
}

export function findLatestDailyReports(schoolId: string, childIds: string[], minDate: Date) {
  return prisma.childDailyReport.findMany({
    where: {
      schoolId,
      childId: { in: childIds },
      isDraft: false,
      date: { gte: minDate },
    },
    include: {
      meals: true,
      sleep: true,
      hygiene: true,
      health: true,
      moods: true,
      activities: true,
    },
    orderBy: [{ date: 'desc' }, { updatedAt: 'desc' }],
    take: 10,
  })
}

export function findPendingInvoices(schoolId: string, childIds: string[]) {
  return prisma.invoice.findMany({
    where: {
      schoolId,
      childId: { in: childIds },
      status: { in: ['PENDENTE', 'VENCIDO'] },
    },
    orderBy: { dueDate: 'asc' },
    take: 5,
  })
}

export function findSharedPhotos(schoolId: string, childIds: string[]) {
  return prisma.childPhoto.findMany({
    where: {
      schoolId,
      childId: { in: childIds },
      sharedWithParents: true,
    },
    orderBy: { date: 'desc' },
    take: 10,
  })
}

export function findGuardianAnnouncements(schoolId: string) {
  return prisma.announcement.findMany({
    where: {
      schoolId,
      OR: [
        { isPinned: true },
        { targetRole: 'RESPONSAVEL' },
      ],
    },
    orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    take: 5,
  })
}

export function findDailyReportsForFeed(schoolId: string, childIds: string[], limit: number, skip: number) {
  return prisma.childDailyReport.findMany({
    where: { schoolId, childId: { in: childIds }, isDraft: false },
    include: {
      child: { select: { id: true, fullName: true, photoUrl: true } },
      meals: true,
      sleep: true,
      moods: true,
      activities: true,
    },
    orderBy: { date: 'desc' },
    take: limit,
    skip,
  })
}

export function findPhotosForFeed(schoolId: string, childIds: string[], limit: number) {
  return prisma.childPhoto.findMany({
    where: { schoolId, childId: { in: childIds }, sharedWithParents: true },
    include: { child: { select: { id: true, fullName: true } } },
    orderBy: { date: 'desc' },
    take: limit,
  })
}

export function findAnnouncementsForFeed(schoolId: string, limit: number) {
  return prisma.announcement.findMany({
    where: {
      schoolId,
      OR: [
        { targetRole: 'RESPONSAVEL' },
        { targetRole: null },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

export function findDevelopmentReportsForFeed(schoolId: string, childIds: string[]) {
  return prisma.developmentReport.findMany({
    where: { schoolId, childId: { in: childIds }, isDraft: false },
    include: { child: { select: { id: true, fullName: true } } },
    orderBy: { publishedAt: 'desc' },
    take: 10,
  })
}
