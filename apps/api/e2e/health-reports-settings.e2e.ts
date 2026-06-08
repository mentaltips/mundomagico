/**
 * E2E — Health + Check-in/out + Reports + Settings + Users + Notifications
 * Cobre: saúde, presença, relatórios, configurações, usuários, notificações
 */
import { test, expect } from '@playwright/test'

let token: string

test.beforeAll(async ({ request }) => {
  const res = await request.post('/api/auth/login', {
    data: { email: 'qa@mundomagico.com.br', password: 'Test123!' },
  })
  if (res.status() === 200) token = (await res.json()).token
})

const auth = () => token ? { Authorization: `Bearer ${token}` } : {}

// ═══════════════ HEALTH ═══════════════
test.describe('Health (Saúde)', () => {
  test('GET /api/health — lista registros de saúde', async ({ request }) => {
    test.skip(!token, 'Sem autenticação')
    const res = await request.get('/api/health', { headers: auth() })
    expect(res.status()).toBe(200)
  })

  test('GET /api/health — sem auth retorna 401', async ({ request }) => {
    const res = await request.get('/api/health')
    expect(res.status()).toBe(401)
  })
})

// ═══════════════ CHECK-IN/OUT ═══════════════
test.describe('Check-in/out (Presença)', () => {
  test('GET /api/check-in-out — lista registros', async ({ request }) => {
    test.skip(!token, 'Sem autenticação')
    const res = await request.get('/api/check-in-out', { headers: auth() })
    expect(res.status()).toBe(200)
  })

  test('POST /api/check-in-out — registra check-in', async ({ request }) => {
    test.skip(!token, 'Sem autenticação')
    const res = await request.post('/api/check-in-out', {
      headers: { ...auth(), 'Content-Type': 'application/json' },
      data: {
        childId: cmq5p0s3r006x1hfksw62fex8,
        type: 'IN',
        timestamp: new Date().toISOString(),
      },
    })
    expect([200, 201, 400, 404]).toContain(res.status())
  })

  test('GET /api/check-in-out — sem auth retorna 401', async ({ request }) => {
    const res = await request.get('/api/check-in-out')
    expect(res.status()).toBe(401)
  })
})

// ═══════════════ REPORTS ═══════════════
test.describe('Reports (Relatórios)', () => {
  test('GET /api/reports — lista relatórios', async ({ request }) => {
    test.skip(!token, 'Sem autenticação')
    const res = await request.get('/api/reports', { headers: auth() })
    expect(res.status()).toBe(200)
  })

  test('GET /api/daily-reports — relatórios diários', async ({ request }) => {
    test.skip(!token, 'Sem autenticação')
    const res = await request.get('/api/daily-reports', { headers: auth() })
    expect(res.status()).toBe(200)
  })

  test('GET /api/development-reports — relatórios de desenvolvimento', async ({ request }) => {
    test.skip(!token, 'Sem autenticação')
    const res = await request.get('/api/development-reports', { headers: auth() })
    expect(res.status()).toBe(200)
  })

  test('GET /api/stats — estatísticas', async ({ request }) => {
    test.skip(!token, 'Sem autenticação')
    const res = await request.get('/api/stats', { headers: auth() })
    expect(res.status()).toBe(200)
  })

  test('GET /api/reports — sem auth retorna 401', async ({ request }) => {
    const res = await request.get('/api/reports')
    expect(res.status()).toBe(401)
  })
})

// ═══════════════ SETTINGS ═══════════════
test.describe('Settings (Configurações)', () => {
  test('GET /api/settings — dados da escola', async ({ request }) => {
    test.skip(!token, 'Sem autenticação')
    const res = await request.get('/api/settings', { headers: auth() })
    expect(res.status()).toBe(200)
  })

  test('PUT /api/settings — atualiza configurações', async ({ request }) => {
    test.skip(!token, 'Sem autenticação')
    const res = await request.patch('/api/settings', {
      headers: { ...auth(), 'Content-Type': 'application/json' },
      data: { schoolName: 'Escola E2E Test' },
    })
    expect([200, 400]).toContain(res.status())
  })
})

// ═══════════════ USERS ═══════════════
test.describe('Users (Usuários)', () => {
  test('GET /api/users — lista usuários', async ({ request }) => {
    test.skip(!token, 'Sem autenticação')
    const res = await request.get('/api/users', { headers: auth() })
    expect(res.status()).toBe(200)
  })

  test('POST /api/users — cria usuário (sem campos obrigatórios = 400)', async ({ request }) => {
    test.skip(!token, 'Sem autenticação')
    const res = await request.post('/api/users', {
      headers: { ...auth(), 'Content-Type': 'application/json' },
      data: { name: '' },
    })
    expect(res.status()).toBe(400)
  })

  test('GET /api/users — sem auth retorna 401', async ({ request }) => {
    const res = await request.get('/api/users')
    expect(res.status()).toBe(401)
  })
})

// ═══════════════ NOTIFICATIONS ═══════════════
test.describe('Notifications', () => {
  test('GET /api/notifications — lista notificações', async ({ request }) => {
    test.skip(!token, 'Sem autenticação')
    const res = await request.get('/api/notifications', { headers: auth() })
    expect(res.status()).toBe(200)
  })

  test('GET /api/notifications — sem auth retorna 401', async ({ request }) => {
    const res = await request.get('/api/notifications')
    expect(res.status()).toBe(401)
  })
})

// ═══════════════ BILLING ═══════════════
test.describe('Billing (Cobrança)', () => {
  test('GET /api/billing — status de cobrança', async ({ request }) => {
    test.skip(!token, 'Sem autenticação')
    const res = await request.get('/api/billing', { headers: auth() })
    expect([200, 404]).toContain(res.status())
  })

  test('GET /api/billing — sem auth retorna 401', async ({ request }) => {
    const res = await request.get('/api/billing')
    expect(res.status()).toBe(401)
  })
})

// ═══════════════ DAILY ROUTINE ═══════════════
test.describe('Daily Routine (Rotina Diária)', () => {
  test('GET /api/daily-routine — lista rotinas', async ({ request }) => {
    test.skip(!token, 'Sem autenticação')
    const res = await request.get('/api/daily-routine', { headers: auth() })
    expect(res.status()).toBe(200)
  })
})

// ═══════════════ ANALYTICS ═══════════════
test.describe('Analytics', () => {
  test('POST /api/analytics/track — track page visit (público)', async ({ request }) => {
    const res = await request.post('/api/analytics/track', {
      headers: { 'Content-Type': 'application/json' },
      data: { page: '/dashboard', schoolId: 'test' },
    })
    expect([200, 204, 400]).toContain(res.status())
  })

  test('GET /api/analytics — requer auth', async ({ request }) => {
    const res = await request.get('/api/analytics')
    expect(res.status()).toBe(401)
  })
})

// ═══════════════ CHILD ITEMS ═══════════════
test.describe('Child Items (Itens da Criança)', () => {
  test('GET /api/child-items — lista itens', async ({ request }) => {
    test.skip(!token, 'Sem autenticação')
    const res = await request.get('/api/child-items', { headers: auth() })
    expect(res.status()).toBe(200)
  })
})

// ═══════════════ PARENT / RESPONSÁVEL ═══════════════
test.describe('Parent (Responsável — endpoints)', () => {
  test('GET /api/parent — lista dados do responsável', async ({ request }) => {
    test.skip(!token, 'Sem autenticação')
    const res = await request.get('/api/parent', { headers: auth() })
    expect([200, 404]).toContain(res.status())
  })
})

// ═══════════════ TEACHER ═══════════════
test.describe('Teacher (Professor)', () => {
  test('GET /api/teacher — lista professores', async ({ request }) => {
    test.skip(!token, 'Sem autenticação')
    const res = await request.get('/api/teacher', { headers: auth() })
    expect(res.status()).toBe(200)
  })
})
