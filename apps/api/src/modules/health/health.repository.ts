import { prisma } from '@mundo-magico/database'

export function findChildrenWithActiveMedications(schoolId: string) {
  return prisma.child.findMany({
    where: {
      schoolId,
      medications: { some: { active: true } },
    },
    include: {
      group: { select: { id: true, name: true } },
      medications: {
        where: { active: true },
        include: {
          administrations: {
            orderBy: { administeredAt: 'desc' },
            take: 5,
          },
        },
      },
    },
    orderBy: { fullName: 'asc' },
  })
}

export function findMedications(filters: {
  schoolId: string
  childId?: string
  active?: boolean
}) {
  return prisma.medication.findMany({
    where: {
      schoolId: filters.schoolId,
      ...(filters.childId && { childId: filters.childId }),
      ...(filters.active !== undefined && { active: filters.active }),
    },
    include: {
      child: { select: { id: true, fullName: true } },
      administrations: {
        orderBy: { administeredAt: 'desc' },
        take: 10,
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export function verifyChild(childId: string, schoolId: string) {
  return prisma.child.findFirst({
    where: { id: childId, schoolId },
    select: { id: true },
  })
}

export function createMedication(data: any) {
  return prisma.medication.create({
    data,
  })
}

export function updateMedication(id: string, schoolId: string, data: any) {
  return prisma.medication.updateMany({
    where: { id, schoolId },
    data,
  })
}

export function findMedicationFirst(id: string, schoolId: string) {
  return prisma.medication.findFirst({
    where: { id, schoolId },
  })
}

export function createMedicationAdministration(data: any) {
  return prisma.medicationAdministration.create({
    data,
  })
}
