import { test, expect } from '@playwright/test'
import { getAuth, authHeaders } from './helpers/auth'

test.beforeAll(async ({ request }) => { await getAuth(request) })

test.describe('Staff', () => {
  test('GET /api/staff — lista', async ({ request }) => {
    const { token } = await getAuth(request)
    const res = await request.get('/api/staff', { headers: authHeaders(token) })
    expect(token ? res.status() === 200 : res.status() === 401).toBe(true)
  })
  test('POST /api/staff — cria', async ({ request }) => {
    const { token } = await getAuth(request)
    if (!token) return test.skip()
    const res = await request.post('/api/staff', {
      headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
      data: { name: `Staff E2E ${Date.now()}`, roleType: 'PROFESSOR' },
    })
    expect([200, 201]).toContain(res.status())
  })
})

test.describe('Groups', () => {
  test('POST /api/groups — cria', async ({ request }) => {
    const { token } = await getAuth(request)
    if (!token) return test.skip()
    const res = await request.post('/api/groups', {
      headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
      data: { name: `Turma E2E ${Date.now()}`, shift: 'MANHA', capacity: 20 },
    })
    expect([200, 201]).toContain(res.status())
  })
})

test.describe('Guardians', () => {
  test('POST /api/guardians — cria', async ({ request }) => {
    const { token } = await getAuth(request)
    if (!token) return test.skip()
    const res = await request.post('/api/guardians', {
      headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
      data: { fullName: 'Resp E2E', phone: '11999990001', relationship: 'Pai' },
    })
    expect([200, 201]).toContain(res.status())
  })
})

test.describe('Finance', () => {
  test('POST /api/finance/invoices — cria cobrança', async ({ request }) => {
    const { token } = await getAuth(request)
    if (!token) return test.skip()
    const res = await request.post('/api/finance/invoices', {
      headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
      data: { description: 'Mensalidade E2E', amount: 150, dueDate: new Date(Date.now() + 30*86400000).toISOString(), status: 'PENDENTE', type: 'MENSALIDADE' },
    })
    expect([200, 201]).toContain(res.status())
  })
})

test.describe('Calendar', () => {
  test('POST /api/calendar — cria evento', async ({ request }) => {
    const { token } = await getAuth(request)
    if (!token) return test.skip()
    const res = await request.post('/api/calendar', {
      headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
      data: { title: 'Evento E2E', date: new Date(Date.now()+86400000).toISOString(), description: 'Test' },
    })
    expect([200, 201]).toContain(res.status())
  })
})

test.describe('Announcements', () => {
  test('POST /api/announcements — cria comunicado', async ({ request }) => {
    const { token } = await getAuth(request)
    if (!token) return test.skip()
    const res = await request.post('/api/announcements', {
      headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
      data: { title: 'Comunicado E2E', content: 'Test', priority: 'NORMAL' },
    })
    expect([200, 201]).toContain(res.status())
  })
})

// Testes de segurança (sem auth)
test.describe('Security Gates', () => {
  const routes = ['/api/staff', '/api/groups', '/api/guardians', '/api/finance/invoices',
    '/api/calendar', '/api/announcements', '/api/photos', '/api/documents',
    '/api/health', '/api/check-in-out', '/api/settings', '/api/users',
    '/api/notifications', '/api/billing', '/api/teacher', '/api/parent',
    '/api/reports', '/api/daily-reports', '/api/development-reports',
    '/api/stats', '/api/child-items', '/api/daily-routine', '/api/students']

  for (const route of routes) {
    test(`${route} — 401 sem auth`, async ({ request }) => {
      const res = await request.get(route)
      expect(res.status(), `${route} deve exigir auth`).toBe(401)
    })
  }
})
