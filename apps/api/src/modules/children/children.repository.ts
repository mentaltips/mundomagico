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
    where: { schoolId },
    include: childListInclude,
    orderBy: { fullName: 'asc' },
  })
}

export function findChildById(schoolId: string, id: string) {
  return prisma.child.findFirst({
    where: { id, schoolId },
    include: childDetailsInclude,
  })
}

export function findChildRecord(schoolId: string, id: string) {
  return prisma.child.findFirst({
    where: { id, schoolId },
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

export function deleteChildWithHistory(childId: string) {
  return prisma.$transaction([
    prisma.childGuardian.deleteMany({ where: { childId } }),
    prisma.authorizedPickupPerson.deleteMany({ where: { childId } }),
    prisma.childDailyReport.deleteMany({ where: { childId } }),
    prisma.childCheckInOut.deleteMany({ where: { childId } }),
    prisma.medicationAdministration.deleteMany({
      where: { medication: { childId } },
    }),
    prisma.medication.deleteMany({ where: { childId } }),
    prisma.childItemUsage.deleteMany({
      where: { item: { childId } },
    }),
    prisma.childItem.deleteMany({ where: { childId } }),
    prisma.childPhoto.deleteMany({ where: { childId } }),
    prisma.developmentReport.deleteMany({ where: { childId } }),
    prisma.childDocument.deleteMany({ where: { childId } }),
    prisma.invoice.deleteMany({ where: { childId } }),
    prisma.child.delete({ where: { id: childId } }),
  ])
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
