import { prisma } from '@mundo-magico/database'

export function findById(id: string, schoolId: string) {
  return prisma.childDocument.findFirst({
    where: {
      id,
      child: { schoolId },
    },
    include: {
      child: { select: { id: true, fullName: true, schoolId: true } },
    },
  })
}

export function create(data: { childId: string; name: string; docType: string; url: string }) {
  return prisma.childDocument.create({
    data,
  })
}

export function verifyChild(childId: string, schoolId: string) {
  return prisma.child.findFirst({
    where: { id: childId, schoolId },
  })
}

export async function deleteById(id: string, schoolId: string) {
  const doc = await prisma.childDocument.findFirst({
    where: {
      id,
      child: { schoolId },
    },
    select: { id: true },
  })
  if (!doc) {
    return { count: 0 }
  }
  await prisma.childDocument.delete({
    where: { id },
  })
  return { count: 1 }
}
