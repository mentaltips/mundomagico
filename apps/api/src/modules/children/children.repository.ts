import { Prisma, prisma } from '@mundo-magico/database'

const childListInclude = {
  group: true,
  guardians: { include: { guardian: true } },
  _count: { select: { guardians: true, medications: true, documents: true } },
} satisfies Prisma.ChildInclude

const childDetailsInclude = {
  group: true,
  guardians: { include: { guardian: true } },
  authorizedPickups: true,
  medications: true,
  documents: true,
} satisfies Prisma.ChildInclude

export function listChildren(schoolId: string) {
  return prisma.child.findMany({
    where: { schoolId, archivedAt: null },
    include: childListInclude,
    orderBy: { fullName: 'asc' },
  })
}

export function listChildrenForGuardianUser(schoolId: string, userId: string) {
  return prisma.child.findMany({
    where: {
      schoolId,
      archivedAt: null,
      guardians: {
        some: {
          guardian: {
            schoolId,
            userId,
          },
        },
      },
    },
    include: childListInclude,
    orderBy: { fullName: 'asc' },
  })
}

export function findChildById(schoolId: string, id: string) {
  return prisma.child.findFirst({
    where: { id, schoolId, archivedAt: null },
    include: childDetailsInclude,
  })
}

export function findChildByIdForGuardianUser(schoolId: string, id: string, userId: string) {
  return prisma.child.findFirst({
    where: {
      id,
      schoolId,
      archivedAt: null,
      guardians: {
        some: {
          guardian: {
            schoolId,
            userId,
          },
        },
      },
    },
    include: childDetailsInclude,
  })
}

export function findChildRecord(schoolId: string, id: string) {
  return prisma.child.findFirst({
    where: { id, schoolId, archivedAt: null },
  })
}

export function findChildRecordForGuardianUser(schoolId: string, id: string, userId: string) {
  return prisma.child.findFirst({
    where: {
      id,
      schoolId,
      archivedAt: null,
      guardians: {
        some: {
          guardian: {
            schoolId,
            userId,
          },
        },
      },
    },
  })
}

export function findGroupById(schoolId: string, groupId: string) {
  return prisma.group.findFirst({
    where: { id: groupId, schoolId },
    select: { id: true },
  })
}

export function createChild(data: Prisma.ChildUncheckedCreateInput) {
  return prisma.child.create({ data })
}

export async function updateChild(schoolId: string, id: string, data: Prisma.ChildUncheckedUpdateInput) {
  const result = await prisma.child.updateMany({
    where: { id, schoolId },
    data,
  })

  if (result.count === 0) return null

  return prisma.child.findFirst({
    where: { id, schoolId },
  })
}

export async function archiveChild(schoolId: string, childId: string) {
  const result = await prisma.child.updateMany({
    where: { id: childId, schoolId },
    data: {
      status: 'INATIVO',
      archivedAt: new Date(),
    },
  })

  return result.count > 0
}

export function listGuardians(childId: string) {
  return prisma.childGuardian.findMany({
    where: { childId },
    include: { guardian: true },
  })
}

export function listAuthorizedPickups(childId: string) {
  return prisma.authorizedPickupPerson.findMany({
    where: { childId },
  })
}

export function createAuthorizedPickup(data: Prisma.AuthorizedPickupPersonUncheckedCreateInput) {
  return prisma.authorizedPickupPerson.create({ data })
}

export async function deleteAuthorizedPickup(childId: string, personId: string) {
  const result = await prisma.authorizedPickupPerson.deleteMany({
    where: { id: personId, childId },
  })

  return result.count > 0
}

export function listDocuments(childId: string) {
  return prisma.childDocument.findMany({
    where: { childId },
  })
}
