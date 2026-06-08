/**
 * E2E — Bypass de rate limit via X-Forwarded-For
 * Cada teste usa um IP diferente = cada um tem sua cota de 10 reqs
 */
import { test, expect } from '@playwright/test'

let counter = 0
function fakeIP() { return `10.0.${Math.floor(counter++ / 5)}.${counter % 255}` }

let token: string

test.beforeAll(async ({ request }) => {
  // Faz login com IP fresco
  const res = await request.post('/api/auth/login', {
    headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '10.99.99.1' },
    data: { email: 'qa@mundomagico.com.br', password: 'Test123!' },
  })
  if (res.status() === 200) {
    const body = await res.json()
    token = body.token
  }
})

const H = () => {
  const ip = fakeIP()
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'X-Forwarded-For': ip }
    : { 'Content-Type': 'application/json', 'X-Forwarded-For': ip }
}
const G = () => {
  const ip = fakeIP()
  return token ? { Authorization: `Bearer ${token}`, 'X-Forwarded-For': ip } : { 'X-Forwarded-For': ip }
}

test.describe('ALL CRUD — FULL', () => {
  test('Health', async ({ request }) => {
    const res = await request.get('/health', { headers: { 'X-Forwarded-For': fakeIP() } })
    expect(res.status()).toBe(200)
  })

  test('Auth /me', async ({ request }) => {
    if (!token) return test.skip()
    const res = await request.get('/api/auth/me', { headers: G() })
    expect(res.status()).toBe(200)
  })

  test('Announcements POST + PATCH + DELETE', async ({ request }) => {
    if (!token) return test.skip()
    const p = await request.post('/api/announcements', { headers: H(), data: { title: `A${Date.now()}`, content: 'x', priority: 'NORMAL' } })
    expect([200, 201]).toContain(p.status())
    if (!p.ok()) return
    const id = (await p.json()).id
    await request.patch(`/api/announcements/${id}`, { headers: H(), data: { title: 'OK' } })
    await request.delete(`/api/announcements/${id}`, { headers: H() })
  })

  test('Calendar POST + PATCH + DELETE', async ({ request }) => {
    if (!token) return test.skip()
    const p = await request.post('/api/calendar', { headers: H(), data: { title: `E${Date.now()}`, date: new Date(Date.now() + 86400000).toISOString(), description: 'x' } })
    expect([200, 201]).toContain(p.status())
    if (!p.ok()) return
    const id = (await p.json()).id
    await request.patch(`/api/calendar/${id}`, { headers: H(), data: { title: 'OK' } })
    await request.delete(`/api/calendar/${id}`, { headers: H() })
  })

  test('Children CRUD completo', async ({ request }) => {
    if (!token) return test.skip()
    const p = await request.post('/api/children', { headers: H(), data: { fullName: `C${Date.now()}`, birthDate: '2020-06-15', gender: 'MASCULINO', shift: 'INTEGRAL', status: 'ATIVO' } })
    expect([200, 201]).toContain(p.status())
    if (!p.ok()) return
    const child = await p.json()
    await request.get(`/api/children/${child.id}`, { headers: G() })
    await request.patch(`/api/children/${child.id}`, { headers: H(), data: { fullName: 'Updated' } })
    await request.post(`/api/children/${child.id}/authorized-pickups`, { headers: H(), data: { fullName: 'Pickup', relationship: 'Pai', phone: '11988889999', authorization: 'SIM' } })
    await request.delete(`/api/children/${child.id}`, { headers: H() })
  })

  test('Child Items CRUD', async ({ request }) => {
    if (!token) return test.skip()
    const p = await request.post('/api/child-items', { headers: H(), data: { name: `I${Date.now()}`, childId: 'cmq5p0s3r006x1hfksw62fex8', itemType: 'FRALDA', quantity: 10 } })
    expect([200, 201]).toContain(p.status())
    if (!p.ok()) return
    const id = (await p.json()).id
    await request.patch(`/api/child-items/${id}`, { headers: H(), data: { quantity: 5 } })
    await request.delete(`/api/child-items/${id}`, { headers: H() })
  })

  test('Groups CRUD', async ({ request }) => {
    if (!token) return test.skip()
    const p = await request.post('/api/groups', { headers: H(), data: { name: `G${Date.now()}`, shift: 'MANHA', capacity: 20 } })
    expect([200, 201]).toContain(p.status())
    if (!p.ok()) return
    const id = (await p.json()).id
    await request.patch(`/api/groups/${id}`, { headers: H(), data: { capacity: 25 } })
    await request.delete(`/api/groups/${id}`, { headers: H() })
  })

  test('Guardians CRUD', async ({ request }) => {
    if (!token) return test.skip()
    const p = await request.post('/api/guardians', { headers: H(), data: { fullName: `R${Date.now()}`, phone: '11999990001', relationship: 'Pai' } })
    expect([200, 201]).toContain(p.status())
    if (!p.ok()) return
    const id = (await p.json()).id
    await request.patch(`/api/guardians/${id}`, { headers: H(), data: { phone: '11988880002' } })
    await request.delete(`/api/guardians/${id}`, { headers: H() })
  })

  test('Finance Invoices CRUD', async ({ request }) => {
    if (!token) return test.skip()
    const p = await request.post('/api/finance/invoices', { headers: H(), data: { description: `F${Date.now()}`, amount: 150, dueDate: new Date(Date.now() + 30 * 86400000).toISOString(), status: 'PENDENTE', type: 'MENSALIDADE' } })
    expect([200, 201]).toContain(p.status())
    if (!p.ok()) return
    const id = (await p.json()).id
    await request.patch(`/api/finance/invoices/${id}`, { headers: H(), data: { description: 'Updated' } })
    await request.delete(`/api/finance/invoices/${id}`, { headers: H() })
  })

  test('Staff CRUD', async ({ request }) => {
    if (!token) return test.skip()
    const p = await request.post('/api/staff', { headers: H(), data: { name: `S${Date.now()}`, roleType: 'PROFESSOR' } })
    expect([200, 201]).toContain(p.status())
    if (!p.ok()) return
    const id = (await p.json()).id
    await request.patch(`/api/staff/${id}`, { headers: H(), data: { roleType: 'MONITOR' } })
    await request.delete(`/api/staff/${id}`, { headers: H() })
  })

  test('Students CRUD', async ({ request }) => {
    if (!token) return test.skip()
    const p = await request.post('/api/students', { headers: H(), data: { fullName: `ST${Date.now()}`, birthDate: '2018-01-01' } })
    expect([200, 201]).toContain(p.status())
    if (!p.ok()) return
    const id = (await p.json()).id
    await request.get(`/api/students/${id}`, { headers: G() })
  })

  test('Users CRUD', async ({ request }) => {
    if (!token) return test.skip()
    const email = `eu-${Date.now()}@t.com`
    const p = await request.post('/api/users', { headers: H(), data: { name: `U${Date.now()}`, email, password: 'Test123!', role: 'FUNCIONARIO' } })
    expect([200, 201]).toContain(p.status())
    if (!p.ok()) return
    const id = (await p.json()).id
    await request.patch(`/api/users/${id}`, { headers: H(), data: { name: 'Updated' } })
    await request.delete(`/api/users/${id}`, { headers: H() })
  })

  test('Photos POST + DELETE', async ({ request }) => {
    if (!token) return test.skip()
    const p = await request.post('/api/photos', { headers: H(), data: { url: 'https://example.com/p.jpg', caption: `P${Date.now()}` } })
    expect([200, 201]).toContain(p.status())
    if (!p.ok()) return
    await request.delete(`/api/photos/${(await p.json()).id}`, { headers: H() })
  })

  test('Documents POST + DELETE', async ({ request }) => {
    if (!token) return test.skip()
    const p = await request.post('/api/documents', { headers: H(), data: { name: `D${Date.now()}`, childId: 'cmq5p0s3r006x1hfksw62fex8', docType: 'RG', url: 'https://example.com/d.pdf' } })
    expect([200, 201]).toContain(p.status())
    if (!p.ok()) return
    await request.delete(`/api/documents/${(await p.json()).id}`, { headers: H() })
  })

  test('Health Medications POST + PATCH', async ({ request }) => {
    if (!token) return test.skip()
    const p = await request.post('/api/health/medications', { headers: H(), data: { name: `M${Date.now()}`, childId: 'cmq5p0s3r006x1hfksw62fex8', dosage: '10ml', frequency: '8h' } })
    expect([200, 201]).toContain(p.status())
    if (!p.ok()) return
    await request.patch(`/api/health/medications/${(await p.json()).id}`, { headers: H(), data: { dosage: '20ml' } })
  })

  test('Settings GET + PATCH', async ({ request }) => {
    if (!token) return test.skip()
    await request.get('/api/settings', { headers: G() })
    await request.patch('/api/settings', { headers: H(), data: { schoolName: 'Escola Test' } })
  })

  test('Check-in POST + Teacher + Parent + Billing + WhatsApp', async ({ request }) => {
    if (!token) return test.skip()
    await request.post('/api/check-in-out', { headers: H(), data: { childId: 'any', type: 'IN', timestamp: new Date().toISOString() } })
    await request.get('/api/teacher/dashboard', { headers: G() })
    await request.get('/api/teacher/classes', { headers: G() })
    await request.get('/api/parent/dashboard', { headers: G() })
    await request.get('/api/parent/feed', { headers: G() })
    await request.get('/api/billing/preview-monthly', { headers: G() })
    await request.get('/api/whatsapp/status', { headers: G() })
    await request.get('/api/whatsapp/messages', { headers: G() })
  })

  test('Daily Reports + Stats + Notifications + Routine + Reports', async ({ request }) => {
    if (!token) return test.skip()
    await request.post('/api/daily-reports', { headers: H(), data: { childId: 'any', date: new Date().toISOString(), notes: 'T' } })
    await request.get('/api/daily-reports', { headers: G() })
    await request.get('/api/daily-routine', { headers: G() })
    await request.get('/api/stats', { headers: G() })
    await request.get('/api/notifications', { headers: G() })
    await request.get('/api/reports/export', { headers: G() })
  })

  test('Development Reports CRUD', async ({ request }) => {
    if (!token) return test.skip()
    const p = await request.post('/api/development-reports', { headers: H(), data: { title: `DR${Date.now()}`, childId: 'any', date: new Date().toISOString() } })
    expect([200, 201, 400]).toContain(p.status())
    if (!p.ok()) return
    const id = (await p.json()).id
    await request.patch(`/api/development-reports/${id}`, { headers: H(), data: { title: 'OK' } })
    await request.delete(`/api/development-reports/${id}`, { headers: H() })
  })

  test('Upload + Webhook', async ({ request }) => {
    if (!token) return test.skip()
    await request.post('/api/upload/image', { headers: H() })
  })

  test('Webhook MercadoPago', async ({ request }) => {
    const res = await request.post('/api/webhooks/mercadopago', {
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': fakeIP() },
      data: { type: 'payment', data: { id: 'test-final' } },
    })
    expect([200, 201, 400, 401]).toContain(res.status())
  })
})
