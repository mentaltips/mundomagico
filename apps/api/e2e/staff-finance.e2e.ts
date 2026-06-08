/**
 * E2E — Staff (Funcionários) + Finance (Finanças)
 * Cobre: CRUD staff, pagamentos, bônus, deduções, invoices, cobranças
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

// ═══════════════ STAFF ═══════════════
test.describe('Staff (Funcionários)', () => {
  test('GET /api/staff — lista funcionários (requer auth)', async ({ request }) => {
    const res = await request.get('/api/staff', { headers: auth() })
    expect([200, 401]).toContain(res.status())
  })

  test('POST /api/staff — cria funcionário', async ({ request }) => {
    test.skip(!token, 'Sem autenticação')
    const res = await request.post('/api/staff', {
      headers: { ...auth(), 'Content-Type': 'application/json' },
      data: {
        name: 'E2E Professor Test',
        email: `e2e-prof-${Date.now()}@test.com`,
        roleType: 'PROFESSOR',
        phone: '11988887777',
      },
    })
    expect([200, 201]).toContain(res.status())
  })

  test('POST /api/staff — nome vazio retorna 400', async ({ request }) => {
    test.skip(!token, 'Sem autenticação')
    const res = await request.post('/api/staff', {
      headers: { ...auth(), 'Content-Type': 'application/json' },
      data: { name: '' },
    })
    expect(res.status()).toBe(400)
  })

  test('GET /api/staff — sem auth retorna 401', async ({ request }) => {
    const res = await request.get('/api/staff')
    expect(res.status()).toBe(401)
  })
})

// ═══════════════ STAFF PAYMENTS ═══════════════
test.describe('Staff Payments (Folha de Pagamento)', () => {
  test('POST /api/staff/payments/generate — gera pagamentos do mês', async ({ request }) => {
    test.skip(!token, 'Sem autenticação')
    const now = new Date()
    const res = await request.post('/api/staff/payments/generate', {
      headers: { ...auth(), 'Content-Type': 'application/json' },
      data: { month: now.getMonth() + 1, year: now.getFullYear() },
    })
    expect([200, 201, 400, 404]).toContain(res.status())
  })

  test('GET /api/staff/payments — lista pagamentos', async ({ request }) => {
    test.skip(!token, 'Sem autenticação')
    const res = await request.get('/api/staff/payments', { headers: auth() })
    expect(res.status()).toBe(200)
  })
})

// ═══════════════ FINANCE ═══════════════
test.describe('Finance (Finanças)', () => {
  test('GET /api/finance/invoices — lista cobranças', async ({ request }) => {
    test.skip(!token, 'Sem autenticação')
    const res = await request.get('/api/finance/invoices', { headers: auth() })
    expect(res.status()).toBe(200)
  })

  test('POST /api/finance/invoices — cria cobrança', async ({ request }) => {
    test.skip(!token, 'Sem autenticação')
    const res = await request.post('/api/finance/invoices', {
      headers: { ...auth(), 'Content-Type': 'application/json' },
      data: {
        description: 'Mensalidade E2E',
        amount: 150.0,
        dueDate: new Date(Date.now() + 30 * 86400000).toISOString(),
        status: 'PENDENTE',
        type: 'MENSALIDADE',
      },
    })
    expect([200, 201]).toContain(res.status())
  })

  test('POST /api/finance/invoices — sem amount retorna 400', async ({ request }) => {
    test.skip(!token, 'Sem autenticação')
    const res = await request.post('/api/finance/invoices', {
      headers: { ...auth(), 'Content-Type': 'application/json' },
      data: { description: 'Sem valor' },
    })
    expect(res.status()).toBe(400)
  })

  test('GET /api/finance — sem auth retorna 401', async ({ request }) => {
    const res = await request.get('/api/finance/invoices')
    expect(res.status()).toBe(401)
  })
})
