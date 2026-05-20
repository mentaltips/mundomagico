import { prisma } from '@mundo-magico/database'

const authUserSelect = {
  id: true,
  name: true,
  email: true,
  password: true,
  role: true,
  schoolId: true,
  active: true,
  avatarUrl: true,
} as const

export function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: authUserSelect,
  })
}

export function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: authUserSelect,
  })
}

export function findUserByIdAndSchool(id: string, schoolId: string) {
  return prisma.user.findFirst({
    where: { id, schoolId },
    select: authUserSelect,
  })
}

export function updatePassword(id: string, password: string) {
  return prisma.user.update({
    where: { id },
    data: { password },
  })
}

export function createRefreshToken(input: {
  userId: string
  tokenHash: string
  familyId: string
  expiresAt: Date
}) {
  return prisma.refreshToken.create({
    data: input,
  })
}

export function findRefreshTokenByHash(tokenHash: string) {
  return prisma.refreshToken.findUnique({
    where: { tokenHash },
  })
}

export function revokeRefreshToken(id: string, replacedByTokenId?: string) {
  return prisma.refreshToken.update({
    where: { id },
    data: {
      revokedAt: new Date(),
      replacedByTokenId,
    },
  })
}

export function revokeRefreshTokenFamily(familyId: string) {
  return prisma.refreshToken.updateMany({
    where: {
      familyId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  })
}

export function revokeUserRefreshTokens(userId: string) {
  return prisma.refreshToken.updateMany({
    where: {
      userId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  })
}
