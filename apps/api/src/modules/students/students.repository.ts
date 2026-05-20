import { Prisma, prisma } from '@mundo-magico/database'

const studentListInclude = {
  group: true,
  guardians: { include: { guardian: true } },
} satisfies Prisma.StudentInclude

export function listStudents(schoolId: string) {
  return prisma.student.findMany({
    where: { schoolId, archivedAt: null },
    include: studentListInclude,
    orderBy: { fullName: 'asc' },
  })
}

export function findStudentById(schoolId: string, id: string) {
  return prisma.student.findFirst({
    where: { id, schoolId, archivedAt: null },
    include: studentListInclude,
  })
}

export function findGroupById(schoolId: string, groupId: string) {
  return prisma.group.findFirst({
    where: { id: groupId, schoolId },
    select: { id: true },
  })
}

export function createStudent(data: Prisma.StudentUncheckedCreateInput) {
  return prisma.student.create({ data })
}
