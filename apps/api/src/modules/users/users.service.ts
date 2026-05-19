import { randomInt } from 'crypto'
import bcrypt from 'bcryptjs'
import { AppError } from '../../shared/errors/AppError'
import { ERROR_CODES } from '../../shared/errors/error-codes'
import type { CreateUserInput, UpdateUserInput } from './users.schema'
import * as usersRepository from './users.repository'

function normalizeOptionalText(value: string | null | undefined) {
  if (value === undefined) return undefined
  if (value === null) return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

async function hashPassword(password: string) {
  return bcrypt.hash(password, 10)
}

function generateTemporaryPassword() {
  return randomInt(100000, 1000000).toString()
}

export function listUsers(schoolId: string) {
  return usersRepository.listUsers(schoolId)
}

export async function createUser(schoolId: string, input: CreateUserInput) {
  const password = await hashPassword(input.password)

  return usersRepository.createUser(schoolId, {
    ...input,
    phone: normalizeOptionalText(input.phone),
    avatarUrl: normalizeOptionalText(input.avatarUrl),
    password,
  })
}

export async function getUser(schoolId: string, id: string) {
  const user = await usersRepository.findUserById(schoolId, id)
  if (!user) {
    throw new AppError('Usuario nao encontrado', 404, ERROR_CODES.NOT_FOUND)
  }

  const { password: _password, ...safeUser } = user
  return safeUser
}

export async function updateUser(schoolId: string, id: string, input: UpdateUserInput) {
  const data = {
    ...input,
    phone: normalizeOptionalText(input.phone),
    avatarUrl: normalizeOptionalText(input.avatarUrl),
    ...(input.password ? { password: await hashPassword(input.password) } : {}),
  }

  const user = await usersRepository.updateUser(schoolId, id, data)
  if (!user) {
    throw new AppError('Usuario nao encontrado', 404, ERROR_CODES.NOT_FOUND)
  }

  return user
}

export async function resetPassword(schoolId: string, id: string) {
  const user = await usersRepository.findUserById(schoolId, id)
  if (!user) {
    throw new AppError('Usuario nao encontrado', 404, ERROR_CODES.NOT_FOUND)
  }

  if (!user.email) {
    throw new AppError('Usuario nao possui e-mail cadastrado', 400, ERROR_CODES.VALIDATION_ERROR)
  }

  const plainPassword = generateTemporaryPassword()
  const updated = await usersRepository.setPasswordAndActivate(schoolId, user.id, await hashPassword(plainPassword))
  if (!updated) {
    throw new AppError('Usuario nao encontrado', 404, ERROR_CODES.NOT_FOUND)
  }

  return { email: user.email, password: plainPassword, name: user.name }
}

export async function deactivateUser(schoolId: string, id: string) {
  const deactivated = await usersRepository.deactivateUser(schoolId, id)
  if (!deactivated) {
    throw new AppError('Usuario nao encontrado', 404, ERROR_CODES.NOT_FOUND)
  }

  return { success: true }
}
