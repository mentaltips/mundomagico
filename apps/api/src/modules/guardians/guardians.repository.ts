import { Prisma, prisma } from '@mundo-magico/database'

const guardianListInclude = {
  children: { include: { child: { select: { id: true, fullName: true } } } },
  students: { include: { student: { select: { id: true, fullName: true } } } },
} satisfies Prisma.GuardianInclude

const guardianDetailsInclude = {
  children: { include: { child: true } },
  students: { include: { student: true } },
} satisfies Prisma.GuardianInclude

export function listGuardians(schoolId: string) {
  return prisma.guardian.findMany({
    where: { schoolId },
    include: guardianListInclude,
    orderBy: { fullName: 'asc' },
  })
}

export function findGuardianById(schoolId: string, id: string) {
  return prisma.guardian.findFirst({
    where: { id, schoolId },
    include: guardianDetailsInclude,
  })
}

export function findGuardianRecord(schoolId: string, id: string) {
  return prisma.guardian.findFirst({
    where: { id, schoolId },
  })
}

export function findChildRecord(schoolId: string, id: string) {
  return prisma.child.findFirst({
    where: { id, schoolId },
    select: { id: true },
  })
}

export function findStudentRecord(schoolId: string, id: string) {
  return prisma.student.findFirst({
    where: { id, schoolId },
    select: { id: true },
  })
}

export function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, schoolId: true },
  })
}

export function createGuardian(
  data: Prisma.GuardianUncheckedCreateInput,
  links: {
    child?: Prisma.ChildGuardianUncheckedCreateWithoutGuardianInput
    student?: Prisma.StudentGuardianUncheckedCreateWithoutGuardianInput
  },
) {
  return prisma.$transaction(async (tx) => {
    const guardian = await tx.guardian.create({ data })

    if (links.child) {
      await tx.childGuardian.create({
        data: { ...links.child, guardianId: guardian.id },
      })
    }

    if (links.student) {
      await tx.studentGuardian.create({
        data: { ...links.student, guardianId: guardian.id },
      })
    }

    return guardian
  })
}

export async function updateGuardian(schoolId: string, id: string, data: Prisma.GuardianUncheckedUpdateInput) {
  const result = await prisma.guardian.updateMany({
    where: { id, schoolId },
    data,
  })

  if (result.count === 0) return null

  return prisma.guardian.findFirst({
    where: { id, schoolId },
  })
}

export function linkGuardianToChild(data: Prisma.ChildGuardianUncheckedCreateInput) {
  return prisma.childGuardian.create({ data })
}

export async function unlinkGuardianFromChild(childId: string, guardianId: string) {
  const result = await prisma.childGuardian.deleteMany({
    where: { childId, guardianId },
  })

  return result.count > 0
}

export async function upsertGuardianUser(
  guardian: { id: string; schoolId: string; fullName: string; email: string },
  existingUserId: string | null,
  password: string,
) {
  return prisma.$transaction(async (tx) => {
    const user = existingUserId
      ? await tx.user.update({
          where: { id: existingUserId },
          data: { password, role: 'RESPONSAVEL', active: true },
        })
      : await tx.user.create({
          data: {
            name: guardian.fullName,
            email: guardian.email,
            password,
            role: 'RESPONSAVEL',
            schoolId: guardian.schoolId,
            active: true,
          },
        })

    await tx.guardian.update({
      where: { id: guardian.id },
      data: { userId: user.id },
    })

    return user
  })
}

export async function deleteGuardian(schoolId: string, id: string) {
  return prisma.$transaction(async (tx) => {
    const guardian = await tx.guardian.findFirst({
      where: { id, schoolId },
    })

    if (!guardian) return null

    await tx.childGuardian.deleteMany({ where: { guardianId: id } })
    await tx.studentGuardian.deleteMany({ where: { guardianId: id } })
    await tx.guardian.delete({ where: { id } })

    if (guardian.userId) {
      const [otherGuardians, staff] = await Promise.all([
        tx.guardian.count({ where: { userId: guardian.userId } }),
        tx.staff.count({ where: { userId: guardian.userId } }),
      ])

      if (otherGuardians === 0 && staff === 0) {
        await tx.user.delete({ where: { id: guardian.userId } }).catch(() => undefined)
      }
    }

    return guardian
  })
}
