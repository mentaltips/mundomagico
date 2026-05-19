import { prisma } from '@mundo-magico/database'
import type { CreateUserInput, UpdateUserInput } from './users.schema'

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  phone: true,
  avatarUrl: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} as const

export function listUsers(schoolId: string) {
  return prisma.user.findMany({
    where: {
      schoolId,
      role: { notIn: ['GUARDIAN', 'RESPONSAVEL'] },
    },
    select: userSelect,
    orderBy: { name: 'asc' },
  })
}

export function findUserById(schoolId: string, id: string) {
  return prisma.user.findFirst({
    where: { id, schoolId },
    select: {
      ...userSelect,
      password: true,
    },
  })
}

export function createUser(schoolId: string, input: Omit<CreateUserInput, 'password'> & { password: string }) {
  return prisma.user.create({
    data: {
      ...input,
      schoolId,
    },
    select: userSelect,
  })
}

export async function updateUser(schoolId: string, id: string, input: UpdateUserInput) {
  const result = await prisma.user.updateMany({
    where: { id, schoolId },
    data: input,
  })

  if (result.count === 0) return null

  return prisma.user.findFirst({
    where: { id, schoolId },
    select: userSelect,
  })
}

export async function setPasswordAndActivate(schoolId: string, id: string, password: string) {
  const result = await prisma.user.updateMany({
    where: { id, schoolId },
    data: { password, active: true },
  })

  return result.count > 0
}

export async function deactivateUser(schoolId: string, id: string) {
  const result = await prisma.user.updateMany({
    where: { id, schoolId },
    data: { active: false },
  })

  return result.count > 0
}
