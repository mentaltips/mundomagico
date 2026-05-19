import { AppError } from '../../shared/errors/AppError'
import { ERROR_CODES } from '../../shared/errors/error-codes'
import type { CreateGroupInput, ListGroupsQuery, UpdateGroupInput } from './groups.schema'
import * as groupsRepository from './groups.repository'

function cleanNullableText(value: string | null | undefined) {
  if (value === undefined) return undefined
  if (value === null) return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function buildCreateGroupData(schoolId: string, input: CreateGroupInput) {
  return {
    name: input.name,
    capacity: input.capacity,
    shift: input.shift,
    room: cleanNullableText(input.room),
    minAge: input.minAge,
    maxAge: input.maxAge,
    active: input.active,
    schoolId,
  }
}

function buildUpdateGroupData(input: UpdateGroupInput) {
  return {
    ...(input.name !== undefined && { name: input.name }),
    ...(input.capacity !== undefined && { capacity: input.capacity }),
    ...(input.shift !== undefined && { shift: input.shift }),
    ...(input.room !== undefined && { room: cleanNullableText(input.room) }),
    ...(input.minAge !== undefined && { minAge: input.minAge }),
    ...(input.maxAge !== undefined && { maxAge: input.maxAge }),
    ...(input.active !== undefined && { active: input.active }),
  }
}

export function listGroups(schoolId: string, query: ListGroupsQuery) {
  return groupsRepository.listGroups(schoolId, query)
}

export function createGroup(schoolId: string, input: CreateGroupInput) {
  return groupsRepository.createGroup(buildCreateGroupData(schoolId, input))
}

export async function updateGroup(schoolId: string, id: string, input: UpdateGroupInput) {
  const group = await groupsRepository.updateGroup(schoolId, id, buildUpdateGroupData(input))
  if (!group) {
    throw new AppError('Turma nao encontrada', 404, ERROR_CODES.NOT_FOUND)
  }
  return group
}

export async function deleteGroup(schoolId: string, id: string) {
  const group = await groupsRepository.findGroupById(schoolId, id)
  if (!group) {
    throw new AppError('Turma nao encontrada', 404, ERROR_CODES.NOT_FOUND)
  }

  if (group._count.children > 0 || group._count.students > 0 || group._count.staffAssignments > 0) {
    throw new AppError('Nao e possivel excluir turma com vinculos ativos', 400, ERROR_CODES.VALIDATION_ERROR)
  }

  await groupsRepository.deleteGroup(schoolId, id)
}
