import { prisma } from '@mundo-magico/database'
import type { ListMessagesQuery } from './whatsapp.schema'

export async function listMessages(schoolId: string, query: ListMessagesQuery) {
  const { page, limit, status, type, to } = query
  const skip = (page - 1) * limit
  const where = {
    schoolId,
    ...(status && { status }),
    ...(type && { type }),
    ...(to && { to: { contains: to } }),
  }

  const [total, messages] = await Promise.all([
    prisma.whatsAppMessage.count({ where }),
    prisma.whatsAppMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
  ])

  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    items: messages,
  }
}

export async function findMessageById(schoolId: string, id: string) {
  return prisma.whatsAppMessage.findFirst({
    where: {
      id,
      schoolId,
    },
  })
}

export async function cancelMessage(id: string) {
  return prisma.whatsAppMessage.update({
    where: { id },
    data: {
      status: 'CANCELLED',
      error: 'Cancelada manualmente',
    },
  })
}

export async function findActiveChildrenWithGuardians(schoolId: string, targetStatus?: string) {
  return prisma.child.findMany({
    where: {
      schoolId,
      ...(targetStatus && targetStatus !== 'ALL' && { status: targetStatus }),
    },
    include: {
      guardians: {
        include: {
          guardian: true,
        },
      },
    },
  })
}

