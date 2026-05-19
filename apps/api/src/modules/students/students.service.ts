import { AppError } from '../../shared/errors/AppError'
import { ERROR_CODES } from '../../shared/errors/error-codes'
import type { CreateStudentInput } from './students.schema'
import * as studentsRepository from './students.repository'

function toDate(value: string | null | undefined) {
  if (!value) return undefined
  return new Date(value)
}

async function ensureGroupBelongsToSchool(schoolId: string, groupId: string | null | undefined) {
  if (!groupId) return

  const group = await studentsRepository.findGroupById(schoolId, groupId)
  if (!group) {
    throw new AppError('Turma nao encontrada para esta escola', 403, ERROR_CODES.FORBIDDEN)
  }
}

export function listStudents(schoolId: string) {
  return studentsRepository.listStudents(schoolId)
}

export async function getStudent(schoolId: string, id: string) {
  const student = await studentsRepository.findStudentById(schoolId, id)
  if (!student) {
    throw new AppError('Aluno nao encontrado', 404, ERROR_CODES.NOT_FOUND)
  }
  return student
}

export async function createStudent(schoolId: string, input: CreateStudentInput) {
  await ensureGroupBelongsToSchool(schoolId, input.groupId)

  const { birthDate, entryDate, ...rest } = input
  return studentsRepository.createStudent({
    ...rest,
    schoolId,
    birthDate: new Date(birthDate),
    entryDate: toDate(entryDate),
  })
}
