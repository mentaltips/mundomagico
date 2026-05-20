import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { AppError } from '../../shared/errors/AppError'
import { ERROR_CODES } from '../../shared/errors/error-codes'
import type { ChangePasswordInput, LoginInput, RefreshTokenInput } from './auth.schema'
import * as authRepository from './auth.repository'
import type { AuthTokenPayload, AuthUserWithPassword, RefreshTokenPayload } from './auth.types'

const ACCESS_TOKEN_EXPIRES_IN = '15m'
const REFRESH_TOKEN_EXPIRES_IN = '30d'
const RESPONSE_EXPIRES_IN_SECONDS = 15 * 60
const REFRESH_TOKEN_EXPIRES_IN_MS = 30 * 24 * 60 * 60 * 1000

function getJwtSecret() {
  const secret = process.env.JWT_SECRET
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
  const payload: RefreshTokenPayload = {
    sub: userId,
    type: 'refresh',
    jti: crypto.randomUUID(),
    familyId: crypto.randomUUID(),
  }

  return jwt.sign(payload, getJwtSecret(), { expiresIn: REFRESH_TOKEN_EXPIRES_IN })
}

function signRefreshTokenInFamily(userId: string, familyId: string) {
  const payload: RefreshTokenPayload = {
    sub: userId,
    type: 'refresh',
    jti: crypto.randomUUID(),
    familyId,
  }

  return jwt.sign(payload, getJwtSecret(), { expiresIn: REFRESH_TOKEN_EXPIRES_IN })
}

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function getRefreshTokenExpiresAt() {
  return new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN_MS)
}

async function persistRefreshToken(userId: string, token: string, familyId: string) {
  return authRepository.createRefreshToken({
    userId,
    tokenHash: hashToken(token),
    familyId,
    expiresAt: getRefreshTokenExpiresAt(),
  })
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

  const refreshToken = signRefreshToken(user.id)
  const refreshPayload = jwt.decode(refreshToken) as RefreshTokenPayload
  await persistRefreshToken(user.id, refreshToken, refreshPayload.familyId)

  return {
    token: signAccessToken(user),
    refreshToken,
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

  if (payload.type !== 'refresh' || !payload.jti || !payload.familyId) {
    throw new AppError('Token invalido', 401, ERROR_CODES.UNAUTHORIZED)
  }

  const storedRefreshToken = await authRepository.findRefreshTokenByHash(hashToken(input.refreshToken))
  if (!storedRefreshToken || storedRefreshToken.userId !== payload.sub) {
    await authRepository.revokeRefreshTokenFamily(payload.familyId)
    throw new AppError('Token invalido', 401, ERROR_CODES.UNAUTHORIZED)
  }

  if (storedRefreshToken.revokedAt) {
    await authRepository.revokeRefreshTokenFamily(storedRefreshToken.familyId)
    throw new AppError('Token invalido', 401, ERROR_CODES.UNAUTHORIZED)
  }

  if (storedRefreshToken.expiresAt <= new Date()) {
    await authRepository.revokeRefreshToken(storedRefreshToken.id)
    throw new AppError('Refresh token expirado. Faca login novamente.', 401, ERROR_CODES.UNAUTHORIZED)
  }

  const user = await authRepository.findUserById(payload.sub)
  if (!user || !user.active) {
    throw new AppError('Usuario inativo ou nao encontrado', 401, ERROR_CODES.UNAUTHORIZED)
  }

  const refreshToken = signRefreshTokenInFamily(user.id, storedRefreshToken.familyId)
  const newRefreshToken = await persistRefreshToken(user.id, refreshToken, storedRefreshToken.familyId)
  await authRepository.revokeRefreshToken(storedRefreshToken.id, newRefreshToken.id)

  return {
    token: signAccessToken(user),
    refreshToken,
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
  await authRepository.revokeUserRefreshTokens(user.id)

  return { success: true, message: 'Senha alterada com sucesso' }
}
