import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'

// ─── Mocks ANTES de importar app ────────────────────────────
vi.mock('../../services/queue', () => ({
  isRedisHealthy: vi.fn(() => true),
}))

// Mock do repository para isolar do banco
vi.mock('../../modules/auth/auth.repository')

// ⚠ NÃO mocka jsonwebtoken — usamos real pra assinar tokens de teste
vi.mock('bcryptjs')

import { app } from '../../app'
import * as authRepository from '../../modules/auth/auth.repository'
import bcrypt from 'bcryptjs'

const JWT_SECRET = 'integr-test-secret-xyz'

function mockUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-int-1',
    name: 'Admin Teste',
    email: 'admin@teste.com',
    password: '$2b$10$hashedpassword...',
    role: 'admin',
    schoolId: 'school-int-1',
    active: true,
    avatarUrl: null,
    ...overrides,
  }
}

function signToken(payload: Record<string, unknown>, expiresIn?: string) {
  return jwt.sign(payload, JWT_SECRET, expiresIn ? { expiresIn } : {})
}

describe('Integration — Auth Flow (HTTP)', () => {
  beforeAll(() => {
    vi.stubEnv('JWT_SECRET', JWT_SECRET)
    vi.stubEnv('NODE_ENV', 'test')
    vi.stubEnv('DISABLE_REDIS', 'true')
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Health ────────────────────────────────────────────────
  describe('GET /health', () => {
    it('200 — responde com status ok', async () => {
      const res = await request(app).get('/health').expect(200)
      expect(res.body.status).toBe('ok')
    })
  })

  // ── POST /api/auth/login ──────────────────────────────────
  describe('POST /api/auth/login', () => {
    it('200 — retorna token + user com credenciais válidas', async () => {
      vi.mocked(authRepository.findUserByEmail).mockResolvedValue(mockUser() as any)
      vi.mocked(authRepository.createRefreshToken).mockResolvedValue({ id: 'rt-1' } as any)
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never)

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@teste.com', password: '123456' })
        .expect(200)

      expect(res.body).toHaveProperty('token')
      expect(res.body).toHaveProperty('refreshToken')
      expect(res.body.user).not.toHaveProperty('password')
      expect(res.body.user.role).toBe('admin')
    })

    it('401 — email não encontrado', async () => {
      vi.mocked(authRepository.findUserByEmail).mockResolvedValue(null)

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'x@x.com', password: '123456' })
        .expect(401)
    })

    it('400 — body inválido (faltando campos)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@teste.com' })
        .expect(400)
    })
  })

  // ── GET /api/auth/me ──────────────────────────────────────
  describe('GET /api/auth/me', () => {
    it('200 — retorna user autenticado', async () => {
      vi.mocked(authRepository.findUserByIdAndSchool).mockResolvedValue(mockUser() as any)

      const token = signToken({ sub: 'user-int-1', role: 'admin', schoolId: 'school-int-1' })

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(res.body.id).toBe('user-int-1')
      expect(res.body).not.toHaveProperty('password')
    })

    it('401 — sem Authorization header', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .expect(401)

      expect(res.body.error.message).toContain('Token de autenticacao')
    })

    it('401 — token com assinatura errada', async () => {
      const token = jwt.sign({ sub: 'u1', schoolId: 's1' }, 'wrong-secret')

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(401)

      expect(res.body.error.message).toContain('Token invalido')
    })

    it('400 — token malformado (não Bearer)', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Basic abc123')
        .expect(401)
    })
  })

  // ── POST /api/auth/refresh ────────────────────────────────
  describe('POST /api/auth/refresh', () => {
    it('401 — refresh token inválido (não encontrado)', async () => {
      vi.mocked(authRepository.findRefreshTokenByHash).mockResolvedValue(null)
      vi.mocked(authRepository.revokeRefreshTokenFamily).mockResolvedValue({} as any)

      const fakeToken = jwt.sign({ sub: 'u1', type: 'refresh', jti: 'x', familyId: 'x' }, JWT_SECRET)

      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: fakeToken })
        .expect(401)
    })

    it('400 — refreshToken vazio', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: '' })
        .expect(400)
    })
  })

  // ── Security → Helmet + CORS ──────────────────────────────
  describe('Security', () => {
    it('inclui headers Helmet', async () => {
      const res = await request(app).get('/health')
      expect(res.headers).toHaveProperty('x-content-type-options')
      expect(res.headers).toHaveProperty('x-frame-options')
      expect(res.headers).toHaveProperty('strict-transport-security')
    })

    it('permite CORS de localhost:3000', async () => {
      const res = await request(app)
        .options('/api/auth/login')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST')
        .expect(204)
    })

    it('bloqueia CORS de origem não permitida', async () => {
      const res = await request(app)
        .options('/api/auth/login')
        .set('Origin', 'https://hacker.com')
        .set('Access-Control-Request-Method', 'POST')
      expect(res.status).toBeGreaterThanOrEqual(400)
    })
  })

  // ── Rate limiting ─────────────────────────────────────────
  describe('Rate Limiting', () => {
    it('inclui headers de rate limit nas respostas', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@teste.com', password: '123456' })

      expect(res.headers).toHaveProperty('ratelimit-limit')
      expect(res.headers).toHaveProperty('ratelimit-remaining')
    })
  })
})
