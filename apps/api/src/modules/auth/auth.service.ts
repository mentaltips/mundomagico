import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { AppError } from '../../shared/errors/AppError'
import { ERROR_CODES } from '../../shared/errors/error-codes'
import type { ChangePasswordInput, LoginInput, RefreshTokenInput } from './auth.schema'
import * as authRepository from './auth.repository'
import type { AuthTokenPayload, AuthUserWithPassword, RefreshTokenPayload } from './auth.types'

const ACCESS_TOKEN_EXPIRES_IN = '30d'
const REFRESH_TOKEN_EXPIRES_IN = '7d'
const RESPONSE_EXPIRES_IN_SECONDS = 8 * 60 * 60

function getJwtSecret() {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) {
    throw new AppError('Erro de configuracao do servidor', 500, ERROR_CODES.INTERNAL_SERVER_ERROR)
  }
  return secret
}

function buildPayload(user: AuthUserWithPassword): AuthTokenPayload {
  return {
    sub: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    schoolId: user.schoolId,
  }
}

function signAccessToken(user: AuthUserWithPassword) {
  return jwt.sign(buildPayload(user), getJwtSecret(), { expiresIn: ACCESS_TOKEN_EXPIRES_IN })
}

function signRefreshToken(userId: string) {
  const payload: RefreshTokenPayload = { sub: userId, type: 'refresh' }
  return jwt.sign(payload, getJwtSecret(), { expiresIn: REFRESH_TOKEN_EXPIRES_IN })
}

function sanitizeUser(user: AuthUserWithPassword) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    schoolId: user.schoolId,
    active: user.active,
    avatarUrl: user.avatarUrl,
  }
}

function ensureActiveUser(user: AuthUserWithPassword | null | undefined) {
  if (!user || !user.password || !user.active) {
    throw new AppError('Credenciais invalidas', 401, ERROR_CODES.UNAUTHORIZED)
  }
  return user
}

export async function login(input: LoginInput) {
  const user = ensureActiveUser(await authRepository.findUserByEmail(input.email))
  const isValidPassword = await bcrypt.compare(input.password, user.password)
  if (!isValidPassword) {
    throw new AppError('Credenciais invalidas', 401, ERROR_CODES.UNAUTHORIZED)
  }

  return {
    token: signAccessToken(user),
    refreshToken: signRefreshToken(user.id),
    expiresIn: RESPONSE_EXPIRES_IN_SECONDS,
    user: sanitizeUser(user),
  }
}

export async function refresh(input: RefreshTokenInput) {
  let payload: RefreshTokenPayload

  try {
    payload = jwt.verify(input.refreshToken, getJwtSecret()) as RefreshTokenPayload
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new AppError('Refresh token expirado. Faca login novamente.', 401, ERROR_CODES.UNAUTHORIZED)
    }
    throw new AppError('Token invalido', 401, ERROR_CODES.UNAUTHORIZED)
  }

  if (payload.type !== 'refresh') {
    throw new AppError('Token invalido', 401, ERROR_CODES.UNAUTHORIZED)
  }

  const user = await authRepository.findUserById(payload.sub)
  if (!user || !user.active) {
    throw new AppError('Usuario inativo ou nao encontrado', 401, ERROR_CODES.UNAUTHORIZED)
  }

  return {
    token: signAccessToken(user),
    expiresIn: RESPONSE_EXPIRES_IN_SECONDS,
  }
}

export async function getMe(userId: string, schoolId: string) {
  const user = await authRepository.findUserByIdAndSchool(userId, schoolId)
  if (!user || !user.active) {
    throw new AppError('Usuario nao encontrado', 401, ERROR_CODES.UNAUTHORIZED)
  }
  return sanitizeUser(user)
}

export async function changePassword(userId: string, schoolId: string, input: ChangePasswordInput) {
  const user = await authRepository.findUserByIdAndSchool(userId, schoolId)
  if (!user || !user.active) {
    throw new AppError('Usuario nao encontrado', 404, ERROR_CODES.NOT_FOUND)
  }

  const isValidPassword = await bcrypt.compare(input.currentPassword, user.password)
  if (!isValidPassword) {
    throw new AppError('Senha atual incorreta', 401, ERROR_CODES.UNAUTHORIZED)
  }

  const hashedPassword = await bcrypt.hash(input.newPassword, 10)
  await authRepository.updatePassword(user.id, hashedPassword)

  return { success: true, message: 'Senha alterada com sucesso' }
}
