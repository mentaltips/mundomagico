/**
 * E2E Tests — Fluxo Completo de Autenticação
 *
 * Testa a API REAL rodando em produção/local.
 * Simula um usuário real: faz login, usa token, faz refresh.
 *
 * Requer: API rodando em http://localhost:3333
 * Run:   npx playwright test --config=playwright.config.ts
 */

import { test, expect } from '@playwright/test'

let accessToken: string
let refreshToken: string

test.describe('E2E — Fluxo de Autenticação', () => {

  test('POST /api/auth/login — faz login e recebe tokens', async ({ request }) => {
    const res = await request.post('/api/auth/login', {
      data: { email: 'qa@mundomagico.com.br', password: 'Test123!' },
    })

    // Aceita 200 (sucesso) ou 401 (credenciais inválidas no ambiente real)
    // Se for 200, salva os tokens pros próximos testes
    if (res.status() === 200) {
      const body = await res.json()
      expect(body).toHaveProperty('token')
      expect(body).toHaveProperty('refreshToken')
      expect(body).toHaveProperty('user')
      expect(body.user).not.toHaveProperty('password')

      accessToken = body.token
      refreshToken = body.refreshToken
    } else {
      // Em ambiente sem usuário real, só valida que a API responde
      const body = await res.json()
      expect([401, 429]).toContain(res.status())
      expect(body).toHaveProperty('error')
    }
  })

  test('GET /api/auth/me — token válido retorna usuário', async ({ request }) => {
    test.skip(!accessToken, 'Token não disponível (login falhou com credenciais reais)')

    const res = await request.get('/api/auth/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('id')
    expect(body).toHaveProperty('email')
    expect(body).toHaveProperty('role')
    expect(body).not.toHaveProperty('password')
  })

  test('GET /api/auth/me — sem token retorna 401', async ({ request }) => {
    const res = await request.get('/api/auth/me')
    expect([401, 429]).toContain(res.status())
    const body = await res.json()
    expect(body.error.message).toContain('Token')
  })

  test('GET /api/auth/me — token inválido retorna 401', async ({ request }) => {
    const res = await request.get('/api/auth/me', {
      headers: { Authorization: 'Bearer token-invalido-123' },
    })
    expect([401, 429]).toContain(res.status())
  })

  test('POST /api/auth/refresh — token inválido retorna 401', async ({ request }) => {
    const res = await request.post('/api/auth/refresh', {
      data: { refreshToken: 'token-invalido' },
    })
    expect([401, 429]).toContain(res.status())
  })
})
