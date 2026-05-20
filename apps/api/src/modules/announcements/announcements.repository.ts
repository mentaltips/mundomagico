import { prisma } from '@mundo-magico/database'

export async function findMany(schoolId: string) {
  const list = await prisma.announcement.findMany({
    where: { schoolId } as any,
    orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
  })
  return list.filter((a: any) => a.active !== false)
}

export async function findFirst(id: string, schoolId: string) {
  const list = await prisma.announcement.findMany({
    where: { id, schoolId } as any,
  })
  const item = list[0]
  if (item && (item as any).active === false) return null
  return item || null
}

export function create(data: any) {
  return prisma.announcement.create({
    data,
  })
}

export function update(id: string, schoolId: string, data: any) {
  return prisma.announcement.updateMany({
    where: { id, schoolId } as any,
    data,
  })
}

export async function softDelete(id: string, schoolId: string) {
  const count = await prisma.$executeRawUnsafe(
    'UPDATE "Announcement" SET "active" = $1 WHERE "id" = $2 AND "schoolId" = $3',
    false,
    id,
    schoolId
  )

  return { count }
}

export function verifyGroup(groupId: string, schoolId: string) {
  return prisma.group.findFirst({
    where: { id: groupId, schoolId, active: true } as any,
  })
}

export function findRecipients(schoolId: string, groupId?: string) {
  return Promise.all([
    prisma.child.findMany({
      where: { schoolId, status: 'ATIVO', ...(groupId && { groupId }) },
      include: { guardians: { include: { guardian: true } } },
    }),
    prisma.student.findMany({
      where: { schoolId, status: 'ATIVO', ...(groupId && { groupId }) },
      include: { guardians: { include: { guardian: true } } },
    }),
  ])
}
