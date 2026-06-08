import { describe, it, expect, vi, beforeEach } from 'vitest'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import * as authRepository from '../../modules/auth/auth.repository'
import { login, refresh, changePassword, getMe } from '../../modules/auth/auth.service'
import { AppError } from '../../shared/errors/AppError'
import { ERROR_CODES } from '../../shared/errors/error-codes'
import type { AuthUserWithPassword } from '../../modules/auth/auth.types'

// ─── Mocks ──────────────────────────────────────────────────
vi.mock('../../modules/auth/auth.repository')
vi.mock('bcryptjs')
vi.mock('jsonwebtoken')

const JWT_SECRET = 'test-jwt-secret-123'

function mockUser(overrides: Partial<AuthUserWithPassword> = {}): AuthUserWithPassword {
  return {
    id: 'user-1',
    name: 'Admin Escola',
    email: 'admin@escola.com',
    password: '$2b$10$hashedpassword1234567890abcdef',
    role: 'admin',
    schoolId: 'school-1',
    active: true,
    avatarUrl: null,
    ...overrides,
  }
}

function mockRefreshToken(overrides: Record<string, unknown> = {}) {
  return {
    id: 'rt-1',
    userId: 'user-1',
    tokenHash: expect.any(String) as unknown as string,
    familyId: 'family-1',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    revokedAt: null,
    replacedByTokenId: null,
    ...overrides,
  }
}

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('JWT_SECRET', JWT_SECRET)
  })

  // ── LOGIN ─────────────────────────────────────────────────
  describe('login', () => {
    it('faz login com credenciais válidas e retorna tokens + user', async () => {
      const user = mockUser()
      vi.mocked(authRepository.findUserByEmail).mockResolvedValue(user)
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never)

      // mockReturnValueOnce: 1ª chamada = refreshToken (signRefreshToken), 2ª = accessToken (signAccessToken)
      vi.mocked(jwt.sign).mockReturnValueOnce('refresh-token-456')
      vi.mocked(jwt.sign).mockReturnValueOnce('access-token-123')
      vi.mocked(jwt.decode).mockReturnValueOnce({
        sub: 'user-1',
        type: 'refresh',
        jti: 'jti-1',
        familyId: 'family-1',
      })
      vi.mocked(authRepository.createRefreshToken).mockResolvedValue(mockRefreshToken() as any)

      const result = await login({ email: 'admin@escola.com', password: '123456' })

      expect(result.token).toBe('access-token-123')
      expect(result.refreshToken).toBe('refresh-token-456')
      expect(result.expiresIn).toBe(15 * 60) // 15 min em segundos
      expect(result.user.id).toBe('user-1')
      expect(result.user.role).toBe('admin')
      expect(result.user).not.toHaveProperty('password')
    })

    it('lança erro 401 quando email não é encontrado', async () => {
      vi.mocked(authRepository.findUserByEmail).mockResolvedValue(null)

      await expect(login({ email: 'naoexiste@test.com', password: '123456' })).rejects.toThrow(AppError)
      await expect(login({ email: 'naoexiste@test.com', password: '123456' })).rejects.toMatchObject({
        statusCode: 401,
        message: 'Credenciais invalidas',
      })
    })

    it('lança erro 401 quando senha está incorreta', async () => {
      vi.mocked(authRepository.findUserByEmail).mockResolvedValue(mockUser())
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never)

      await expect(login({ email: 'admin@escola.com', password: 'wrongpass' })).rejects.toMatchObject({
        statusCode: 401,
        message: 'Credenciais invalidas',
      })
    })

    it('lança erro 401 quando usuário está inativo', async () => {
      vi.mocked(authRepository.findUserByEmail).mockResolvedValue(mockUser({ active: false }))

      await expect(login({ email: 'admin@escola.com', password: '123456' })).rejects.toMatchObject({
        statusCode: 401,
        message: 'Credenciais invalidas',
      })
    })

    it('lança erro 401 quando usuário não tem senha definida', async () => {
      vi.mocked(authRepository.findUserByEmail).mockResolvedValue(
        mockUser({ password: '' } as any),
      )

      await expect(login({ email: 'admin@escola.com', password: '123456' })).rejects.toMatchObject({
        statusCode: 401,
      })
    })
  })

  // ── REFRESH ───────────────────────────────────────────────
  describe('refresh', () => {
    it('faz refresh com token válido e retorna novos tokens', async () => {
      const storedToken = mockRefreshToken({ id: 'rt-old' })
      const newToken = mockRefreshToken({ id: 'rt-new' })
      const user = mockUser()

      vi.mocked(jwt.verify).mockReturnValueOnce({
        sub: 'user-1',
        type: 'refresh',
        jti: 'jti-1',
        familyId: 'family-1',
      })
      vi.mocked(authRepository.findRefreshTokenByHash).mockResolvedValue(storedToken as any)
      vi.mocked(authRepository.findUserById).mockResolvedValue(user)
      // 1ª chamada = refresh (signRefreshTokenInFamily), 2ª = access (signAccessToken)
      vi.mocked(jwt.sign).mockReturnValueOnce('new-refresh-token')
      vi.mocked(jwt.sign).mockReturnValueOnce('new-access-token')
      vi.mocked(authRepository.createRefreshToken).mockResolvedValue(newToken as any)
      vi.mocked(authRepository.revokeRefreshToken).mockResolvedValue({} as any)

      const result = await refresh({ refreshToken: 'valid-refresh-token' })

      expect(result.token).toBe('new-access-token')
      expect(result.refreshToken).toBe('new-refresh-token')
      expect(result.expiresIn).toBe(15 * 60)
    })

    it('lança erro 401 quando token está expirado', async () => {
      const expiredError = new Error('jwt expired')
      expiredError.name = 'TokenExpiredError'
      vi.mocked(jwt.verify).mockImplementationOnce(() => {
        throw expiredError
      })

      await expect(refresh({ refreshToken: 'expired-token' })).rejects.toMatchObject({
        statusCode: 401,
        message: 'Refresh token expirado. Faca login novamente.',
      })
    })

    it('lança erro 401 quando token tem assinatura inválida', async () => {
      vi.mocked(jwt.verify).mockImplementationOnce(() => {
        throw new jwt.JsonWebTokenError('invalid signature')
      })

      await expect(refresh({ refreshToken: 'invalid-token' })).rejects.toMatchObject({
        statusCode: 401,
        message: 'Token invalido',
      })
    })

    it('lança erro 401 quando payload não tem type "refresh"', async () => {
      vi.mocked(jwt.verify).mockReturnValueOnce({
        sub: 'user-1',
        type: 'access',
        jti: 'jti-1',
        familyId: 'family-1',
      })

      await expect(refresh({ refreshToken: 'wrong-type-token' })).rejects.toMatchObject({
        statusCode: 401,
        message: 'Token invalido',
      })
    })

    it('lança erro 401 quando token não é encontrado no banco', async () => {
      vi.mocked(jwt.verify).mockReturnValueOnce({
        sub: 'user-1',
        type: 'refresh',
        jti: 'jti-1',
        familyId: 'family-1',
      })
      vi.mocked(authRepository.findRefreshTokenByHash).mockResolvedValue(null)

      await expect(refresh({ refreshToken: 'unknown-token' })).rejects.toMatchObject({
        statusCode: 401,
        message: 'Token invalido',
      })
    })

    it('lança erro 401 e revoga família quando token armazenado está revogado', async () => {
      vi.mocked(jwt.verify).mockReturnValueOnce({
        sub: 'user-1',
        type: 'refresh',
        jti: 'jti-1',
        familyId: 'family-1',
      })
      vi.mocked(authRepository.findRefreshTokenByHash).mockResolvedValue(
        mockRefreshToken({ revokedAt: new Date() }) as any,
      )
      vi.mocked(authRepository.revokeRefreshTokenFamily).mockResolvedValue({} as any)

      await expect(refresh({ refreshToken: 'revoked-token' })).rejects.toMatchObject({
        statusCode: 401,
        message: 'Token invalido',
      })
      expect(authRepository.revokeRefreshTokenFamily).toHaveBeenCalledWith('family-1')
    })

    it('lança erro 401 quando token armazenado está expirado', async () => {
      vi.mocked(jwt.verify).mockReturnValueOnce({
        sub: 'user-1',
        type: 'refresh',
        jti: 'jti-1',
        familyId: 'family-1',
      })
      vi.mocked(authRepository.findRefreshTokenByHash).mockResolvedValue(
        mockRefreshToken({ expiresAt: new Date('2020-01-01') }) as any,
      )
      vi.mocked(authRepository.revokeRefreshToken).mockResolvedValue({} as any)

      await expect(refresh({ refreshToken: 'expired-db-token' })).rejects.toMatchObject({
        statusCode: 401,
        message: 'Refresh token expirado. Faca login novamente.',
      })
    })

    it('lança erro 401 quando userId armazenado não bate com payload', async () => {
      vi.mocked(jwt.verify).mockReturnValueOnce({
        sub: 'user-1',
        type: 'refresh',
        jti: 'jti-1',
        familyId: 'family-1',
      })
      vi.mocked(authRepository.findRefreshTokenByHash).mockResolvedValue(
        mockRefreshToken({ userId: 'other-user' }) as any,
      )
      vi.mocked(authRepository.revokeRefreshTokenFamily).mockResolvedValue({} as any)

      await expect(refresh({ refreshToken: 'wrong-user-token' })).rejects.toMatchObject({
        statusCode: 401,
      })
    })
  })

  // ── CHANGE PASSWORD ───────────────────────────────────────
  describe('changePassword', () => {
    const userId = 'user-1'
    const schoolId = 'school-1'

    it('altera senha com sucesso', async () => {
      const user = mockUser()
      vi.mocked(authRepository.findUserByIdAndSchool).mockResolvedValue(user)
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never)
      vi.mocked(bcrypt.hash).mockResolvedValue('$2b$10$newhashedpassword' as never)
      vi.mocked(authRepository.updatePassword).mockResolvedValue({} as any)
      vi.mocked(authRepository.revokeUserRefreshTokens).mockResolvedValue({} as any)

      const result = await changePassword(userId, schoolId, {
        currentPassword: 'oldpass',
        newPassword: 'newpass123',
      })

      expect(result.success).toBe(true)
      expect(result.message).toContain('Senha alterada')
      expect(authRepository.updatePassword).toHaveBeenCalledWith(
        userId,
        '$2b$10$newhashedpassword',
      )
      expect(authRepository.revokeUserRefreshTokens).toHaveBeenCalledWith(userId)
    })

    it('lança erro 401 quando senha atual está incorreta', async () => {
      vi.mocked(authRepository.findUserByIdAndSchool).mockResolvedValue(mockUser())
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never)

      await expect(
        changePassword(userId, schoolId, {
          currentPassword: 'wrongpass',
          newPassword: 'newpass123',
        }),
      ).rejects.toMatchObject({
        statusCode: 401,
        message: 'Senha atual incorreta',
      })
    })

    it('lança erro 404 quando usuário não é encontrado', async () => {
      vi.mocked(authRepository.findUserByIdAndSchool).mockResolvedValue(null)

      await expect(
        changePassword('ghost-user', schoolId, {
          currentPassword: 'oldpass',
          newPassword: 'newpass123',
        }),
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Usuario nao encontrado',
      })
    })

    it('lança erro 401 quando usuário está inativo', async () => {
      vi.mocked(authRepository.findUserByIdAndSchool).mockResolvedValue(
        mockUser({ active: false }),
      )

      await expect(
        changePassword(userId, schoolId, {
          currentPassword: 'oldpass',
          newPassword: 'newpass123',
        }),
      ).rejects.toMatchObject({
        statusCode: 404,
      })
    })
  })

  // ── GET ME ─────────────────────────────────────────────────
  describe('getMe', () => {
    it('retorna usuário sanitizado', async () => {
      const user = mockUser()
      vi.mocked(authRepository.findUserByIdAndSchool).mockResolvedValue(user)

      const result = await getMe('user-1', 'school-1')

      expect(result.id).toBe('user-1')
      expect(result.role).toBe('admin')
      expect(result).not.toHaveProperty('password')
    })

    it('lança erro 401 quando usuário não encontrado ou inativo', async () => {
      vi.mocked(authRepository.findUserByIdAndSchool).mockResolvedValue(null)

      await expect(getMe('ghost', 'school-1')).rejects.toMatchObject({
        statusCode: 401,
      })
    })
  })
})
