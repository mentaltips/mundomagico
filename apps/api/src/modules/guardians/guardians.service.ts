import { randomInt } from 'crypto'
import bcrypt from 'bcryptjs'
import { AppError } from '../../shared/errors/AppError'
import { ERROR_CODES } from '../../shared/errors/error-codes'
import type { CreateGuardianInput, LinkGuardianInput, UnlinkGuardianInput, UpdateGuardianInput } from './guardians.schema'
import * as guardiansRepository from './guardians.repository'

function normalizeOptionalText(value: string | null | undefined) {
  if (value === undefined) return undefined
  if (value === null) return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

async function ensureGuardian(schoolId: string, id: string) {
  const guardian = await guardiansRepository.findGuardianRecord(schoolId, id)
  if (!guardian) {
    throw new AppError('Responsavel nao encontrado', 404, ERROR_CODES.NOT_FOUND)
  }
  return guardian
}

async function ensureChild(schoolId: string, id: string) {
  const child = await guardiansRepository.findChildRecord(schoolId, id)
  if (!child) {
    throw new AppError('Crianca nao encontrada para esta escola', 403, ERROR_CODES.FORBIDDEN)
  }
  return child
}

async function ensureStudent(schoolId: string, id: string) {
  const student = await guardiansRepository.findStudentRecord(schoolId, id)
  if (!student) {
    throw new AppError('Aluno nao encontrado para esta escola', 403, ERROR_CODES.FORBIDDEN)
  }
  return student
}

function buildGuardianCreateData(schoolId: string, input: CreateGuardianInput) {
  return {
    fullName: input.fullName,
    cpf: normalizeOptionalText(input.cpf),
    rg: normalizeOptionalText(input.rg),
    phone: input.phone,
    phone2: normalizeOptionalText(input.phone2),
    email: normalizeOptionalText(input.email),
    relationship: input.relationship,
    photoUrl: normalizeOptionalText(input.photoUrl),
    address: normalizeOptionalText(input.address),
    occupation: normalizeOptionalText(input.occupation),
    status: input.status,
    schoolId,
  }
}

function buildGuardianUpdateData(input: UpdateGuardianInput) {
  return {
    ...(input.fullName !== undefined && { fullName: input.fullName }),
    ...(input.cpf !== undefined && { cpf: normalizeOptionalText(input.cpf) }),
    ...(input.rg !== undefined && { rg: normalizeOptionalText(input.rg) }),
    ...(input.phone !== undefined && { phone: input.phone }),
    ...(input.phone2 !== undefined && { phone2: normalizeOptionalText(input.phone2) }),
    ...(input.email !== undefined && { email: normalizeOptionalText(input.email) }),
    ...(input.relationship !== undefined && { relationship: input.relationship }),
    ...(input.photoUrl !== undefined && { photoUrl: normalizeOptionalText(input.photoUrl) }),
    ...(input.address !== undefined && { address: normalizeOptionalText(input.address) }),
    ...(input.occupation !== undefined && { occupation: normalizeOptionalText(input.occupation) }),
    ...(input.status !== undefined && { status: input.status }),
  }
}

function generateTemporaryPassword() {
  return randomInt(100000, 1000000).toString()
}

export function listGuardians(schoolId: string) {
  return guardiansRepository.listGuardians(schoolId)
}

export async function createGuardian(schoolId: string, input: CreateGuardianInput) {
  const links: Parameters<typeof guardiansRepository.createGuardian>[1] = {}

  if (input.childId) {
    await ensureChild(schoolId, input.childId)
    links.child = {
      childId: input.childId,
      isPrimary: input.isPrimary ?? false,
      canPickup: input.canPickup ?? true,
      receiveNotif: input.receiveNotif ?? true,
    }
  }

  if (input.studentId) {
    await ensureStudent(schoolId, input.studentId)
    links.student = {
      studentId: input.studentId,
      isPrimary: input.isPrimary ?? false,
    }
  }

  return guardiansRepository.createGuardian(buildGuardianCreateData(schoolId, input), links)
}

export async function linkGuardian(schoolId: string, input: LinkGuardianInput) {
  await Promise.all([
    ensureChild(schoolId, input.childId),
    ensureGuardian(schoolId, input.guardianId),
  ])

  return guardiansRepository.linkGuardianToChild({
    childId: input.childId,
    guardianId: input.guardianId,
    isPrimary: input.isPrimary ?? false,
    canPickup: input.canPickup ?? true,
    receiveNotif: input.receiveNotif ?? true,
  })
}

export async function getGuardian(schoolId: string, id: string) {
  const guardian = await guardiansRepository.findGuardianById(schoolId, id)
  if (!guardian) {
    throw new AppError('Responsavel nao encontrado', 404, ERROR_CODES.NOT_FOUND)
  }
  return guardian
}

export async function updateGuardian(schoolId: string, id: string, input: UpdateGuardianInput) {
  const guardian = await guardiansRepository.updateGuardian(schoolId, id, buildGuardianUpdateData(input))
  if (!guardian) {
    throw new AppError('Responsavel nao encontrado', 404, ERROR_CODES.NOT_FOUND)
  }
  return guardian
}

export async function unlinkGuardian(schoolId: string, input: UnlinkGuardianInput) {
  await Promise.all([
    ensureChild(schoolId, input.childId),
    ensureGuardian(schoolId, input.guardianId),
  ])

  await guardiansRepository.unlinkGuardianFromChild(input.childId, input.guardianId)
  return { success: true }
}

export async function createGuardianUser(schoolId: string, guardianId: string) {
  const guardian = await ensureGuardian(schoolId, guardianId)
  if (!guardian.email) {
    throw new AppError('Responsavel nao possui e-mail cadastrado', 400, ERROR_CODES.VALIDATION_ERROR)
  }

  const existingUser = await guardiansRepository.findUserByEmail(guardian.email)
  if (existingUser && existingUser.schoolId !== schoolId) {
    throw new AppError('Ja existe usuario com este e-mail em outra escola', 403, ERROR_CODES.FORBIDDEN)
  }

  const plainPassword = generateTemporaryPassword()
  const hashedPassword = await bcrypt.hash(plainPassword, 10)
  const user = await guardiansRepository.upsertGuardianUser(
    { id: guardian.id, schoolId: guardian.schoolId, fullName: guardian.fullName, email: guardian.email },
    existingUser?.id ?? null,
    hashedPassword,
  )

  return { email: user.email, password: plainPassword }
}

export async function deleteGuardian(schoolId: string, id: string) {
  const guardian = await guardiansRepository.deleteGuardian(schoolId, id)
  if (!guardian) {
    throw new AppError('Responsavel nao encontrado', 404, ERROR_CODES.NOT_FOUND)
  }

  return { success: true }
}
