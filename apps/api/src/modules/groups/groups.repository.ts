import { Prisma, prisma } from '@mundo-magico/database'
import type { ListGroupsQuery } from './groups.schema'

const groupListInclude = {
  _count: {
    select: {
      children: {
        where: {
          archivedAt: null,
          status: { in: ['ATIVO', 'ADAPTACAO', 'PENDENTE_PAGAMENTO'] },
        },
      },
      students: {
        where: {
          archivedAt: null,
          status: { in: ['ATIVO', 'ADAPTACAO', 'PENDENTE_PAGAMENTO'] },
        },
      },
    },
  },
  children: {
    where: {
      archivedAt: null,
      status: { in: ['ATIVO', 'ADAPTACAO', 'PENDENTE_PAGAMENTO'] },
    },
    take: 3,
    select: { id: true, fullName: true, photoUrl: true },
  },
} satisfies Prisma.GroupInclude

export function listGroups(schoolId: string, query: ListGroupsQuery) {
  return prisma.group.findMany({
    where: {
      schoolId,
      active: query.active !== undefined ? query.active : true,
    },
    include: groupListInclude,
    orderBy: { name: 'asc' },
  })
}

export function createGroup(data: Prisma.GroupUncheckedCreateInput) {
  return prisma.group.create({ data })
}

export function findGroupById(schoolId: string, id: string) {
  return prisma.group.findFirst({
    where: { id, schoolId },
    include: {
      _count: {
        select: {
          children: {
            where: {
              archivedAt: null,
              status: { in: ['ATIVO', 'ADAPTACAO', 'PENDENTE_PAGAMENTO'] },
            },
          },
          students: {
            where: {
              archivedAt: null,
              status: { in: ['ATIVO', 'ADAPTACAO', 'PENDENTE_PAGAMENTO'] },
            },
          },
          staffAssignments: true,
        },
      },
    },
  })
}

export async function updateGroup(schoolId: string, id: string, data: Prisma.GroupUncheckedUpdateInput) {
  const result = await prisma.group.updateMany({
    where: { id, schoolId },
    data,
  })

  if (result.count === 0) return null

  return prisma.group.findFirst({ where: { id, schoolId } })
}

export async function deleteGroup(schoolId: string, id: string) {
  const result = await prisma.group.updateMany({
    where: { id, schoolId },
    data: { active: false },
  })

  return result.count > 0
}
