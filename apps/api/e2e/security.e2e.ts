/**
 * E2E Tests — Segurança e Infraestrutura
 *
 * Valida: health check, CORS, rate limiting, headers de segurança,
 * proteção de rotas autenticadas.
 */

import { test, expect } from '@playwright/test'

test.describe('E2E — Segurança & Infra', () => {

  // ── Health ──────────────────────────────────────────────
  test('GET /health — responde 200 com status ok', async ({ request }) => {
    const res = await request.get('/health')
    expect(res.status()).toBe(200)

    const body = await res.json()
    expect(body.status).toBe('ok')
    expect(body.services.api).toBe('ok')
    expect(body).toHaveProperty('timestamp')
  })

  // ── Helmet Headers ──────────────────────────────────────
  test('Respostas incluem headers de segurança (Helmet)', async ({ request }) => {
    const res = await request.get('/health')

    const headers = res.headers()
    expect(headers).toHaveProperty('x-content-type-options')
    expect(headers).toHaveProperty('x-frame-options')
    expect(headers['strict-transport-security']).toBeDefined()
    expect(headers['x-xss-protection']).toBeDefined()
  })

  // ── Rate Limiting ───────────────────────────────────────
  test('Rate limit headers presentes na resposta', async ({ request }) => {
    const res = await request.post('/api/auth/login', {
      data: { email: 'test@test.com', password: '123456' },
    })

    const headers = res.headers()
    expect(headers).toHaveProperty('ratelimit-limit')
    expect(headers).toHaveProperty('ratelimit-remaining')
  })

  // ── CORS ────────────────────────────────────────────────
  test('CORS — permite origem autorizada (localhost)', async ({ request }) => {
    const res = await request.fetch('/api/auth/login', {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST',
      },
    })
    // Deve ser 204 ou 200 para preflight válido
    expect([200, 204]).toContain(res.status())
  })

  test('CORS — bloqueia origem não autorizada', async ({ request }) => {
    const res = await request.fetch('/api/auth/login', {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://hacker.com',
        'Access-Control-Request-Method': 'POST',
      },
    })
    // Deve falhar (4xx ou 5xx)
    expect(res.status()).toBeGreaterThanOrEqual(400)
  })

  // ── Proteção de Rotas ───────────────────────────────────
  test('Rotas protegidas exigem autenticação', async ({ request }) => {
    const protectedRoutes = [
      '/api/children',
      '/api/guardians',
      '/api/finance',
      '/api/staff',
      '/api/users',
    ]

    for (const route of protectedRoutes) {
      const res = await request.get(route)
      expect(res.status(), `${route} deve exigir auth`).toBe(401)
    }
  })

  // ── Schema Validation (400) ─────────────────────────────
  test('POST /api/auth/login — body inválido retorna 400', async ({ request }) => {
    const res = await request.post('/api/auth/login', {
      data: { email: 'test@test.com' }, // sem password
    })
    expect([400, 429]).toContain(res.status())
  })

  test('POST /api/auth/refresh — body vazio retorna 400', async ({ request }) => {
    const res = await request.post('/api/auth/refresh', {
      data: {},
    })
    expect([400, 429]).toContain(res.status())
  })

  // ── Método não permitido ────────────────────────────────
  test('GET em endpoint POST-only retorna 404 ou 405', async ({ request }) => {
    const res = await request.get('/api/auth/login')
    // Express retorna 404 pra método não tratado
    expect([404, 405, 429]).toContain(res.status())
  })
})
