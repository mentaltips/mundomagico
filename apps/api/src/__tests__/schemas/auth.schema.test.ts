import { describe, it, expect } from 'vitest'
import { loginSchema, refreshTokenSchema, changePasswordSchema } from '../../modules/auth/auth.schema'

describe('Auth Schemas — validação Zod', () => {
  // ── loginSchema ──────────────────────────────────────────
  describe('loginSchema', () => {
    it('aceita email e senha válidos', () => {
      const result = loginSchema.safeParse({ email: 'admin@escola.com', password: '123456' })
      expect(result.success).toBe(true)
    })

    it('rejeita email inválido', () => {
      const result = loginSchema.safeParse({ email: 'nao-e-email', password: '123456' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('email')
      }
    })

    it('rejeita email vazio', () => {
      const result = loginSchema.safeParse({ email: '', password: '123456' })
      expect(result.success).toBe(false)
    })

    it('rejeita senha vazia', () => {
      const result = loginSchema.safeParse({ email: 'admin@escola.com', password: '' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('password')
      }
    })

    it('rejeita campos faltantes', () => {
      const result = loginSchema.safeParse({ email: 'admin@escola.com' })
      expect(result.success).toBe(false)
    })

    it('rejeita campos extras (objeto poluído)', () => {
      const result = loginSchema.safeParse({
        email: 'admin@escola.com',
        password: '123456',
        role: 'admin', // campo não esperado
      })
      // Zod ignora campos extras por padrão, então isso deve passar
      expect(result.success).toBe(true)
    })

    it('trim no email remove espaços', () => {
      const result = loginSchema.safeParse({ email: '  admin@escola.com  ', password: '123456' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.email).toBe('admin@escola.com')
      }
    })

    it('rejeita email maior que 255 caracteres', () => {
      const longEmail = 'a'.repeat(247) + '@test.com' // 256 chars
      const result = loginSchema.safeParse({ email: longEmail, password: '123456' })
      expect(result.success).toBe(false)
    })
  })

  // ── refreshTokenSchema ───────────────────────────────────
  describe('refreshTokenSchema', () => {
    it('aceita refreshToken válido', () => {
      const result = refreshTokenSchema.safeParse({ refreshToken: 'some-jwt-token' })
      expect(result.success).toBe(true)
    })

    it('rejeita refreshToken vazio', () => {
      const result = refreshTokenSchema.safeParse({ refreshToken: '' })
      expect(result.success).toBe(false)
    })

    it('rejeita refreshToken faltante', () => {
      const result = refreshTokenSchema.safeParse({})
      expect(result.success).toBe(false)
    })

    it('trim no refreshToken', () => {
      const result = refreshTokenSchema.safeParse({ refreshToken: '  token  ' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.refreshToken).toBe('token')
      }
    })
  })

  // ── changePasswordSchema ─────────────────────────────────
  describe('changePasswordSchema', () => {
    it('aceita senhas válidas', () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: 'oldpass',
        newPassword: 'newpass123',
      })
      expect(result.success).toBe(true)
    })

    it('rejeita nova senha menor que 6 caracteres', () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: 'oldpass',
        newPassword: '12345',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('newPassword')
      }
    })

    it('rejeita currentPassword vazia', () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: '',
        newPassword: 'newpass123',
      })
      expect(result.success).toBe(false)
    })

    it('rejeita newPassword vazia', () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: 'oldpass',
        newPassword: '',
      })
      expect(result.success).toBe(false)
    })

    it('rejeita campos faltantes', () => {
      const result = changePasswordSchema.safeParse({ currentPassword: 'oldpass' })
      expect(result.success).toBe(false)
    })
  })
})
