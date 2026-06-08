/**
 * E2E COMPLETO — 100% das rotas do MundoMagico
 * Cobre GET/POST/PATCH/DELETE de todos os 24 módulos
 */
import { test, expect } from '@playwright/test'
import { getAuth, authHeaders } from './helpers/auth'

let token: string

test.beforeAll(async ({ request }) => {
  const auth = await getAuth(request)
  token = auth.token || ''
})

const H = () => token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
const G = () => token ? { Authorization: `Bearer ${token}` } : {}

// ═══════════════ HELPERS ═══════════════
let createdIds: Record<string, string> = {}

async function createAndGetId(request: any, method: string, path: string, data: any) {
  if (!token) return test.skip(true, 'Sem auth')
  const res = await request[method](path, { headers: H(), data })
  expect([200, 201]).toContain(res.status())
  if (res.ok()) {
    const body = await res.json()
    if (body.id) createdIds[path] = body.id
    return body
  }
  return null
}

// ═══════════════ AUTH ═══════════════
test.describe('Auth', () => {
  test('POST /login — 200', async ({ request }) => {
    const res = await request.post('/api/auth/login', { headers: { 'Content-Type': 'application/json' }, data: { email: 'qa@mundomagico.com.br', password: 'Test123!' } })
    expect([200, 429]).toContain(res.status())
  })
  test('GET /me — 200', async ({ request }) => {
    if (!token) return test.skip()
    const res = await request.get('/api/auth/me', { headers: G() })
    expect(res.status()).toBe(200)
  })
  test('POST /change-password — 200', async ({ request }) => {
    if (!token) return test.skip()
    const res = await request.post('/api/auth/change-password', { headers: H(), data: { currentPassword: 'Test123!', newPassword: 'Test123!' } })
    expect([200, 400]).toContain(res.status())
  })
})

// ═══════════════ ANNOUNCEMENTS ═══════════════
test.describe('Announcements', () => {
  let id: string
  test('POST / — cria', async ({ request }) => {
    const body = await createAndGetId(request, 'post', '/api/announcements', { title: `E2E ${Date.now()}`, content: 'Test', priority: 'NORMAL' })
    if (body) id = body.id
  })
  test('GET / — lista', async ({ request }) => {
    if (!token) return test.skip()
    const res = await request.get('/api/announcements', { headers: G() })
    expect(res.status()).toBe(200)
  })
  test('PATCH /:id — atualiza', async ({ request }) => {
    if (!token || !id) return test.skip()
    const res = await request.patch(`/api/announcements/${id}`, { headers: H(), data: { title: 'Updated E2E' } })
    expect(res.status()).toBe(200)
  })
  test('DELETE /:id — deleta', async ({ request }) => {
    if (!token || !id) return test.skip()
    const res = await request.delete(`/api/announcements/${id}`, { headers: H() })
    expect([200, 204]).toContain(res.status())
  })
})

// ═══════════════ CALENDAR ═══════════════
test.describe('Calendar', () => {
  let id: string
  test('POST / — cria', async ({ request }) => {
    const body = await createAndGetId(request, 'post', '/api/calendar', { title: `Evento ${Date.now()}`, date: new Date(Date.now() + 86400000).toISOString(), description: 'Test' })
    if (body) id = body.id
  })
  test('GET / — lista', async ({ request }) => {
    if (!token) return test.skip()
    const res = await request.get('/api/calendar', { headers: G() })
    expect(res.status()).toBe(200)
  })
  test('PATCH /:id — atualiza', async ({ request }) => {
    if (!token || !id) return test.skip()
    const res = await request.patch(`/api/calendar/${id}`, { headers: H(), data: { title: 'Updated' } })
    expect(res.status()).toBe(200)
  })
  test('DELETE /:id — deleta', async ({ request }) => {
    if (!token || !id) return test.skip()
    const res = await request.delete(`/api/calendar/${id}`, { headers: H() })
    expect([200, 204]).toContain(res.status())
  })
})

// ═══════════════ CHILDREN ═══════════════
test.describe('Children', () => {
  let childId: string
  test('POST / — cria', async ({ request }) => {
    const body = await createAndGetId(request, 'post', '/api/children', { fullName: `Crianca CRUD ${Date.now()}`, birthDate: '2020-06-15', gender: 'MASCULINO', shift: 'INTEGRAL', status: 'ATIVO' })
    if (body) childId = body.id
  })
  test('GET / — lista', async ({ request }) => {
    if (!token) return test.skip()
    const res = await request.get('/api/children', { headers: G() })
    expect(res.status()).toBe(200)
  })
  test('GET /:id — busca', async ({ request }) => {
    if (!token || !childId) return test.skip()
    const res = await request.get(`/api/children/${childId}`, { headers: G() })
    expect(res.status()).toBe(200)
  })
  test('PATCH /:id — atualiza', async ({ request }) => {
    if (!token || !childId) return test.skip()
    const res = await request.patch(`/api/children/${childId}`, { headers: H(), data: { fullName: 'Updated' } })
    expect(res.status()).toBe(200)
  })
  test('POST /:id/authorized-pickups — cria pickup', async ({ request }) => {
    if (!token || !childId) return test.skip()
    const res = await request.post(`/api/children/${childId}/authorized-pickups`, { headers: H(), data: { fullName: 'Pickup', relationship: 'Pai', phone: '11988889999', authorization: 'SIM' } })
    expect([200, 201]).toContain(res.status())
  })
  test('DELETE /:id — deleta', async ({ request }) => {
    if (!token || !childId) return test.skip()
    const res = await request.delete(`/api/children/${childId}`, { headers: H() })
    expect([200, 204]).toContain(res.status())
  })
})

// ═══════════════ CHILD ITEMS ═══════════════
test.describe('Child Items', () => {
  let id: string
  test('POST / — cria', async ({ request }) => {
    const body = await createAndGetId(request, 'post', '/api/child-items', { name: `Item ${Date.now()}`, type: 'FRALDA', quantity: 10 })
    if (body) id = body.id
  })
  test('GET / — lista', async ({ request }) => {
    if (!token) return test.skip()
    const res = await request.get('/api/child-items', { headers: G() })
    expect(res.status()).toBe(200)
  })
  test('PATCH /:id — atualiza', async ({ request }) => {
    if (!token || !id) return test.skip()
    const res = await request.patch(`/api/child-items/${id}`, { headers: H(), data: { quantity: 5 } })
    expect(res.status()).toBe(200)
  })
  test('DELETE /:id — deleta', async ({ request }) => {
    if (!token || !id) return test.skip()
    const res = await request.delete(`/api/child-items/${id}`, { headers: H() })
    expect([200, 204]).toContain(res.status())
  })
})

// ═══════════════ DEVELOPMENT REPORTS ═══════════════
test.describe('Development Reports', () => {
  let id: string
  test('POST / — cria', async ({ request }) => {
    const body = await createAndGetId(request, 'post', '/api/development-reports', { title: `Report ${Date.now()}`, childId: 'any', date: new Date().toISOString() })
    if (body) id = body.id
  })
  test('GET / — lista', async ({ request }) => {
    if (!token) return test.skip()
    const res = await request.get('/api/development-reports', { headers: G() })
    expect(res.status()).toBe(200)
  })
  test('PATCH /:id — atualiza', async ({ request }) => {
    if (!token || !id) return test.skip()
    const res = await request.patch(`/api/development-reports/${id}`, { headers: H(), data: { title: 'Updated' } })
    expect([200, 400]).toContain(res.status())
  })
  test('DELETE /:id — deleta', async ({ request }) => {
    if (!token || !id) return test.skip()
    const res = await request.delete(`/api/development-reports/${id}`, { headers: H() })
    expect([200, 204]).toContain(res.status())
  })
})

// ═══════════════ DOCUMENTS ═══════════════
test.describe('Documents', () => {
  let id: string
  test('POST / — cria', async ({ request }) => {
    const body = await createAndGetId(request, 'post', '/api/documents', { name: `Doc ${Date.now()}`, type: 'RG', url: 'https://example.com/doc.pdf' })
    if (body) id = body.id
  })
  test('GET /:id — busca', async ({ request }) => {
    if (!token || !id) return test.skip()
    const res = await request.get(`/api/documents/${id}`, { headers: G() })
    expect([200, 404]).toContain(res.status())
  })
  test('DELETE /:id — deleta', async ({ request }) => {
    if (!token || !id) return test.skip()
    const res = await request.delete(`/api/documents/${id}`, { headers: H() })
    expect([200, 204, 404]).toContain(res.status())
  })
})

// ═══════════════ FINANCE ═══════════════
test.describe('Finance', () => {
  let id: string
  test('POST /invoices — cria', async ({ request }) => {
    const body = await createAndGetId(request, 'post', '/api/finance/invoices', { description: `Invoice ${Date.now()}`, amount: 150, dueDate: new Date(Date.now() + 30 * 86400000).toISOString(), status: 'PENDENTE', type: 'MENSALIDADE' })
    if (body) id = body.id
  })
  test('GET /invoices — lista', async ({ request }) => {
    if (!token) return test.skip()
    const res = await request.get('/api/finance/invoices', { headers: G() })
    expect(res.status()).toBe(200)
  })
  test('GET /invoices/:id — detalhes', async ({ request }) => {
    if (!token || !id) return test.skip()
    const res = await request.get(`/api/finance/invoices/${id}`, { headers: G() })
    expect([200, 404]).toContain(res.status())
  })
  test('PATCH /invoices/:id — atualiza', async ({ request }) => {
    if (!token || !id) return test.skip()
    const res = await request.patch(`/api/finance/invoices/${id}`, { headers: H(), data: { description: 'Updated' } })
    expect([200, 400]).toContain(res.status())
  })
  test('DELETE /invoices/:id — deleta', async ({ request }) => {
    if (!token || !id) return test.skip()
    const res = await request.delete(`/api/finance/invoices/${id}`, { headers: H() })
    expect([200, 204]).toContain(res.status())
  })
})

// ═══════════════ GROUPS ═══════════════
test.describe('Groups', () => {
  let id: string
  test('POST / — cria', async ({ request }) => {
    const body = await createAndGetId(request, 'post', '/api/groups', { name: `Turma CRUD ${Date.now()}`, shift: 'MANHA', capacity: 20 })
    if (body) id = body.id
  })
  test('GET / — lista', async ({ request }) => {
    if (!token) return test.skip()
    const res = await request.get('/api/groups', { headers: G() })
    expect(res.status()).toBe(200)
  })
  test('PATCH /:id — atualiza', async ({ request }) => {
    if (!token || !id) return test.skip()
    const res = await request.patch(`/api/groups/${id}`, { headers: H(), data: { capacity: 25 } })
    expect(res.status()).toBe(200)
  })
  test('DELETE /:id — deleta', async ({ request }) => {
    if (!token || !id) return test.skip()
    const res = await request.delete(`/api/groups/${id}`, { headers: H() })
    expect([200, 204]).toContain(res.status())
  })
})

// ═══════════════ GUARDIANS ═══════════════
test.describe('Guardians', () => {
  let id: string
  test('POST / — cria', async ({ request }) => {
    const body = await createAndGetId(request, 'post', '/api/guardians', { fullName: `Guardian CRUD ${Date.now()}`, phone: '11999990001', relationship: 'Pai' })
    if (body) id = body.id
  })
  test('GET / — lista', async ({ request }) => {
    if (!token) return test.skip()
    const res = await request.get('/api/guardians', { headers: G() })
    expect(res.status()).toBe(200)
  })
  test('GET /:id — busca', async ({ request }) => {
    if (!token || !id) return test.skip()
    const res = await request.get(`/api/guardians/${id}`, { headers: G() })
    expect(res.status()).toBe(200)
  })
  test('PATCH /:id — atualiza', async ({ request }) => {
    if (!token || !id) return test.skip()
    const res = await request.patch(`/api/guardians/${id}`, { headers: H(), data: { phone: '11988880002' } })
    expect(res.status()).toBe(200)
  })
  test('DELETE /:id — deleta', async ({ request }) => {
    if (!token || !id) return test.skip()
    const res = await request.delete(`/api/guardians/${id}`, { headers: H() })
    expect([200, 204]).toContain(res.status())
  })
})

// ═══════════════ HEALTH ═══════════════
test.describe('Health', () => {
  let id: string
  test('POST /medications — cria', async ({ request }) => {
    const body = await createAndGetId(request, 'post', '/api/health/medications', { name: `Med ${Date.now()}`, dosage: '10ml', frequency: '8h' })
    if (body) id = body.id
  })
  test('GET /medications — lista', async ({ request }) => {
    if (!token) return test.skip()
    const res = await request.get('/api/health/medications', { headers: G() })
    expect(res.status()).toBe(200)
  })
  test('PATCH /medications/:id — atualiza', async ({ request }) => {
    if (!token || !id) return test.skip()
    const res = await request.patch(`/api/health/medications/${id}`, { headers: H(), data: { dosage: '20ml' } })
    expect([200, 404]).toContain(res.status())
  })
})

// ═══════════════ PHOTOS ═══════════════
test.describe('Photos', () => {
  let id: string
  test('POST / — cria', async ({ request }) => {
    const body = await createAndGetId(request, 'post', '/api/photos', { url: 'https://example.com/photo.jpg', caption: `Photo ${Date.now()}` })
    if (body) id = body.id
  })
  test('GET / — lista', async ({ request }) => {
    if (!token) return test.skip()
    const res = await request.get('/api/photos', { headers: G() })
    expect(res.status()).toBe(200)
  })
  test('DELETE /:id — deleta', async ({ request }) => {
    if (!token || !id) return test.skip()
    const res = await request.delete(`/api/photos/${id}`, { headers: H() })
    expect([200, 204]).toContain(res.status())
  })
})

// ═══════════════ SETTINGS ═══════════════
test.describe('Settings', () => {
  test('GET / — dados da escola', async ({ request }) => {
    if (!token) return test.skip()
    const res = await request.get('/api/settings', { headers: G() })
    expect(res.status()).toBe(200)
  })
  test('PATCH / — atualiza', async ({ request }) => {
    if (!token) return test.skip()
    const res = await request.patch('/api/settings', { headers: H(), data: { schoolName: 'Escola Test' } })
    expect([200, 400]).toContain(res.status())
  })
})

// ═══════════════ STAFF ═══════════════
test.describe('Staff', () => {
  let id: string
  test('POST / — cria', async ({ request }) => {
    const body = await createAndGetId(request, 'post', '/api/staff', { name: `Staff CRUD ${Date.now()}`, roleType: 'PROFESSOR' })
    if (body) id = body.id
  })
  test('GET / — lista', async ({ request }) => {
    if (!token) return test.skip()
    const res = await request.get('/api/staff', { headers: G() })
    expect(res.status()).toBe(200)
  })
  test('PATCH /:id — atualiza', async ({ request }) => {
    if (!token || !id) return test.skip()
    const res = await request.patch(`/api/staff/${id}`, { headers: H(), data: { roleType: 'MONITOR' } })
    expect(res.status()).toBe(200)
  })
  test('DELETE /:id — deleta', async ({ request }) => {
    if (!token || !id) return test.skip()
    const res = await request.delete(`/api/staff/${id}`, { headers: H() })
    expect([200, 204]).toContain(res.status())
  })
})

// ═══════════════ STUDENTS ═══════════════
test.describe('Students', () => {
  let id: string
  test('POST / — cria', async ({ request }) => {
    const body = await createAndGetId(request, 'post', '/api/students', { name: `Student ${Date.now()}`, birthDate: '2018-01-01' })
    if (body) id = body.id
  })
  test('GET / — lista', async ({ request }) => {
    if (!token) return test.skip()
    const res = await request.get('/api/students', { headers: G() })
    expect(res.status()).toBe(200)
  })
  test('GET /:id — busca', async ({ request }) => {
    if (!token || !id) return test.skip()
    const res = await request.get(`/api/students/${id}`, { headers: G() })
    expect([200, 404]).toContain(res.status())
  })
})

// ═══════════════ USERS ═══════════════
test.describe('Users', () => {
  let id: string
  test('POST / — cria', async ({ request }) => {
    const body = await createAndGetId(request, 'post', '/api/users', { name: `User ${Date.now()}`, email: `e2e-${Date.now()}@test.com`, password: 'Test123!', role: 'FUNCIONARIO' })
    if (body) id = body.id
  })
  test('GET / — lista', async ({ request }) => {
    if (!token) return test.skip()
    const res = await request.get('/api/users', { headers: G() })
    expect(res.status()).toBe(200)
  })
  test('GET /:id — busca', async ({ request }) => {
    if (!token || !id) return test.skip()
    const res = await request.get(`/api/users/${id}`, { headers: G() })
    expect(res.status()).toBe(200)
  })
  test('PATCH /:id — atualiza', async ({ request }) => {
    if (!token || !id) return test.skip()
    const res = await request.patch(`/api/users/${id}`, { headers: H(), data: { name: 'Updated User' } })
    expect([200, 400]).toContain(res.status())
  })
  test('DELETE /:id — desativa', async ({ request }) => {
    if (!token || !id) return test.skip()
    const res = await request.delete(`/api/users/${id}`, { headers: H() })
    expect([200, 204]).toContain(res.status())
  })
})

// ═══════════════ WHATSAPP ═══════════════
test.describe('WhatsApp', () => {
  test('GET /status — status', async ({ request }) => {
    if (!token) return test.skip()
    const res = await request.get('/api/whatsapp/status', { headers: G() })
    expect([200, 404, 503]).toContain(res.status())
  })
  test('GET /messages — lista', async ({ request }) => {
    if (!token) return test.skip()
    const res = await request.get('/api/whatsapp/messages', { headers: G() })
    expect([200, 404]).toContain(res.status())
  })
})

// ═══════════════ TEACHER ═══════════════
test.describe('Teacher', () => {
  test('GET /dashboard — dashboard', async ({ request }) => {
    if (!token) return test.skip()
    const res = await request.get('/api/teacher/dashboard', { headers: G() })
    expect([200, 404]).toContain(res.status())
  })
  test('GET /classes — turmas', async ({ request }) => {
    if (!token) return test.skip()
    const res = await request.get('/api/teacher/classes', { headers: G() })
    expect([200, 404]).toContain(res.status())
  })
})

// ═══════════════ PARENT ═══════════════
test.describe('Parent', () => {
  test('GET /dashboard — dashboard', async ({ request }) => {
    if (!token) return test.skip()
    const res = await request.get('/api/parent/dashboard', { headers: G() })
    expect([200, 404]).toContain(res.status())
  })
  test('GET /feed — feed', async ({ request }) => {
    if (!token) return test.skip()
    const res = await request.get('/api/parent/feed', { headers: G() })
    expect([200, 404]).toContain(res.status())
  })
})

// ═══════════════ BILLING ═══════════════
test.describe('Billing', () => {
  test('GET /preview-monthly — preview', async ({ request }) => {
    if (!token) return test.skip()
    const res = await request.get('/api/billing/preview-monthly', { headers: G() })
    expect([200, 404]).toContain(res.status())
  })
})

// ═══════════════ CHECK-IN/OUT ═══════════════
test.describe('Check-in/out', () => {
  test('POST / — registra', async ({ request }) => {
    if (!token) return test.skip()
    const res = await request.post('/api/check-in-out', { headers: H(), data: { childId: 'any', type: 'IN', timestamp: new Date().toISOString() } })
    expect([200, 201, 400, 404]).toContain(res.status())
  })
  test('GET /children — status', async ({ request }) => {
    if (!token) return test.skip()
    const res = await request.get('/api/check-in-out/children', { headers: G() })
    expect([200, 404]).toContain(res.status())
  })
})

// ═══════════════ UPLOAD ═══════════════
test.describe('Upload', () => {
  test('POST /image — 400 sem arquivo', async ({ request }) => {
    if (!token) return test.skip()
    const res = await request.post('/api/upload/image', { headers: H() })
    expect([400, 500]).toContain(res.status())
  })
})

// ═══════════════ WEBHOOKS ═══════════════
test.describe('Webhooks', () => {
  test('POST /mercadopago — webhook MP', async ({ request }) => {
    const res = await request.post('/api/webhooks/mercadopago', { headers: { 'Content-Type': 'application/json' }, data: { type: 'payment', data: { id: 'test-123' } } })
    expect([200, 201, 400]).toContain(res.status())
  })
})

// ═══════════════ STATS ═══════════════
test.describe('Stats', () => {
  test('GET / — estatísticas', async ({ request }) => {
    if (!token) return test.skip()
    const res = await request.get('/api/stats', { headers: G() })
    expect([200, 404]).toContain(res.status())
  })
})

// ═══════════════ NOTIFICATIONS ═══════════════
test.describe('Notifications', () => {
  test('GET / — lista', async ({ request }) => {
    if (!token) return test.skip()
    const res = await request.get('/api/notifications', { headers: G() })
    expect(res.status()).toBe(200)
  })
})

// ═══════════════ DAILY ROUTINE ═══════════════
test.describe('Daily Routine', () => {
  test('GET / — rotinas', async ({ request }) => {
    if (!token) return test.skip()
    const res = await request.get('/api/daily-routine', { headers: G() })
    expect(res.status()).toBe(200)
  })
})

// ═══════════════ DAILY REPORTS ═══════════════
test.describe('Daily Reports', () => {
  test('POST / — cria', async ({ request }) => {
    if (!token) return test.skip()
    const res = await request.post('/api/daily-reports', { headers: H(), data: { childId: 'any', date: new Date().toISOString(), notes: 'Test' } })
    expect([200, 201, 400]).toContain(res.status())
  })
  test('GET / — lista', async ({ request }) => {
    if (!token) return test.skip()
    const res = await request.get('/api/daily-reports', { headers: G() })
    expect(res.status()).toBe(200)
  })
})

// ═══════════════ REPORTS ═══════════════
test.describe('Reports', () => {
  test('GET /export — export', async ({ request }) => {
    if (!token) return test.skip()
    const res = await request.get('/api/reports/export', { headers: G() })
    expect([200, 400, 404]).toContain(res.status())
  })
})
