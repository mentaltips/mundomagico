import { prisma } from '@mundo-magico/database'

export function findMany(schoolId: string, childId?: string) {
  return prisma.childItem.findMany({
    where: {
      schoolId,
      active: true,
      child: {
        archivedAt: null,
        status: { in: ['ATIVO', 'ADAPTACAO', 'PENDENTE_PAGAMENTO'] },
      },
      ...(childId && { childId }),
    } as any,
    include: {
      child: {
        select: {
          id: true,
          fullName: true,
          photoUrl: true,
          group: { select: { name: true } },
        },
      },
      _count: { select: { usageHistory: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export function findFirst(id: string, schoolId: string) {
  return prisma.childItem.findFirst({
    where: { id, schoolId, active: true } as any,
  })
}

export function create(data: any) {
  return prisma.childItem.create({
    data,
  })
}

export function update(id: string, schoolId: string, data: any) {
  return prisma.childItem.updateMany({
    where: { id, schoolId, active: true } as any,
    data,
  })
}

export function deleteById(id: string, schoolId: string) {
  return prisma.childItem.updateMany({
    where: { id, schoolId, active: true } as any,
    data: { active: false } as any,
  })
}

export function verifyChild(childId: string, schoolId: string) {
  return prisma.child.findFirst({
    where: {
      id: childId,
      schoolId,
      archivedAt: null,
      status: { in: ['ATIVO', 'ADAPTACAO', 'PENDENTE_PAGAMENTO'] },
    },
  })
}

export function createUsageRecord(data: { itemId: string; quantity: number; notes?: string | null }) {
  return prisma.childItemUsage.create({
    data,
  })
}

export function incrementUsage(id: string, schoolId: string, quantity: number) {
  return prisma.childItem.updateMany({
    where: { id, schoolId, active: true } as any,
    data: {
      quantityUsed: { increment: quantity },
    } as any,
  })
}

export function replenishStock(id: string, schoolId: string, quantity: number, notes?: string | null) {
  return prisma.childItem.updateMany({
    where: { id, schoolId, active: true } as any,
    data: {
      quantityReceived: { increment: quantity },
      lastReplenished: new Date(),
      ...(notes !== undefined && { notes }),
    } as any,
  })
}
