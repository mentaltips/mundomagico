import { AppError } from '../../shared/errors/AppError'
import { ERROR_CODES } from '../../shared/errors/error-codes'
import type { CreateAuthorizedPickupInput, CreateChildInput, UpdateChildInput } from './children.schema'
import * as childrenRepository from './children.repository'

function toDate(value: string | null | undefined) {
  if (!value) return undefined
  return new Date(value)
}

function toNullableDate(value: string | null | undefined) {
  if (value === null) return null
  return toDate(value)
}

async function ensureChild(schoolId: string, id: string) {
  const child = await childrenRepository.findChildRecord(schoolId, id)
  if (!child) {
    throw new AppError('Crianca nao encontrada', 404, ERROR_CODES.NOT_FOUND)
  }
  return child
}

async function ensureGroupBelongsToSchool(schoolId: string, groupId: string | null | undefined) {
  if (!groupId) return

  const group = await childrenRepository.findGroupById(schoolId, groupId)
  if (!group) {
    throw new AppError('Turma nao encontrada para esta escola', 403, ERROR_CODES.FORBIDDEN)
  }
}

function buildChildCreateData(schoolId: string, input: CreateChildInput) {
  const { birthDate, entryDate, exitDate, imageAuthDate, ...rest } = input
  return {
    ...rest,
    schoolId,
    birthDate: new Date(birthDate),
    entryDate: toDate(entryDate),
    exitDate: toDate(exitDate),
    imageAuthDate: toDate(imageAuthDate),
  }
}

function buildChildUpdateData(input: UpdateChildInput) {
  const { birthDate, entryDate, exitDate, imageAuthDate, ...rest } = input
  return {
    ...rest,
    ...(birthDate !== undefined && { birthDate: new Date(birthDate) }),
    ...(entryDate && { entryDate: toDate(entryDate) }),
    ...(exitDate !== undefined && { exitDate: toNullableDate(exitDate) }),
    ...(imageAuthDate !== undefined && { imageAuthDate: toNullableDate(imageAuthDate) }),
  }
}

export function listChildren(schoolId: string) {
  return childrenRepository.listChildren(schoolId)
}

export async function createChild(schoolId: string, input: CreateChildInput) {
  await ensureGroupBelongsToSchool(schoolId, input.groupId)
  return childrenRepository.createChild(buildChildCreateData(schoolId, input))
}

export async function getChild(schoolId: string, id: string) {
  const child = await childrenRepository.findChildById(schoolId, id)
  if (!child) {
    throw new AppError('Crianca nao encontrada', 404, ERROR_CODES.NOT_FOUND)
  }
  return child
}

export async function updateChild(schoolId: string, id: string, input: UpdateChildInput) {
  await ensureGroupBelongsToSchool(schoolId, input.groupId)
  const child = await childrenRepository.updateChild(schoolId, id, buildChildUpdateData(input))
  if (!child) {
    throw new AppError('Crianca nao encontrada', 404, ERROR_CODES.NOT_FOUND)
  }
  return child
}

export async function deleteChild(schoolId: string, id: string) {
  const child = await ensureChild(schoolId, id)
  await childrenRepository.deleteChildWithHistory(child.id)
  return { success: true }
}

export async function listGuardians(schoolId: string, id: string) {
  const child = await ensureChild(schoolId, id)
  return childrenRepository.listGuardians(child.id)
}

export async function listAuthorizedPickups(schoolId: string, id: string) {
  const child = await ensureChild(schoolId, id)
  return childrenRepository.listAuthorizedPickups(child.id)
}

export async function createAuthorizedPickup(schoolId: string, id: string, input: CreateAuthorizedPickupInput) {
  const child = await ensureChild(schoolId, id)
  const { validUntil, ...rest } = input

  return childrenRepository.createAuthorizedPickup({
    ...rest,
    childId: child.id,
    validUntil: toDate(validUntil),
  })
}

export async function deleteAuthorizedPickup(schoolId: string, id: string, personId: string) {
  const child = await ensureChild(schoolId, id)
  const deleted = await childrenRepository.deleteAuthorizedPickup(child.id, personId)
  if (!deleted) {
    throw new AppError('Pessoa autorizada nao encontrada', 404, ERROR_CODES.NOT_FOUND)
  }

  return { success: true }
}

export async function listDocuments(schoolId: string, id: string) {
  const child = await ensureChild(schoolId, id)
  return childrenRepository.listDocuments(child.id)
}
