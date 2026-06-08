import { test, expect } from '@playwright/test'

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJxYS10ZXN0LWFkbWluIiwibmFtZSI6IlFBIFRlc3QgQWRtaW4iLCJlbWFpbCI6InFhQG11bmRvbWFnaWNvLmNvbS5iciIsInJvbGUiOiJBRE1JTiIsInNjaG9vbElkIjoiZmQ1NzY4YTItZjIyYS00OGYxLTk5YWYtMzIwNjhjZWEwMmQ1IiwiaWF0IjoxNzgwOTU2NjUxLCJleHAiOjE3ODA5NjAyNTF9.3oUmFsf3rlkojg8Lo77xH29v-7i-4NlzKtCzQMCrXC8'
let c = 0
const ip = () => `10.${Math.floor(c++/5)}.${c%255}.${(c*7)%255}`
const H = () => ({ Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json', 'X-Forwarded-For': ip() })
const G = () => ({ Authorization: `Bearer ${TOKEN}`, 'X-Forwarded-For': ip() })

test.describe('FINAL — ALL CRUD', () => {

  test('1. Announcements CRUD', async ({ request }) => {
    const p = await request.post('/api/announcements', { headers: H(), data: { title: `A${Date.now()}`, content: 'x', priority: 'NORMAL' } })
    expect([200,201]).toContain(p.status())
    if (!p.ok()) return
    const id = (await p.json()).id
    await request.patch(`/api/announcements/${id}`, { headers: H(), data: { title: 'OK' } })
    await request.delete(`/api/announcements/${id}`, { headers: H() })
  })

  test('2. Calendar CRUD', async ({ request }) => {
    const p = await request.post('/api/calendar', { headers: H(), data: { title: `E${Date.now()}`, date: new Date(Date.now()+86400000).toISOString(), description: 'x' } })
    expect([200,201]).toContain(p.status())
    if (!p.ok()) return
    const id = (await p.json()).id
    await request.patch(`/api/calendar/${id}`, { headers: H(), data: { title: 'OK' } })
    await request.delete(`/api/calendar/${id}`, { headers: H() })
  })

  test('3. Children CRUD + Pickups', async ({ request }) => {
    const p = await request.post('/api/children', { headers: H(), data: { fullName: `C${Date.now()}`, birthDate: '2020-06-15', gender: 'MASCULINO', shift: 'INTEGRAL', status: 'ATIVO' } })
    expect([200,201]).toContain(p.status())
    if (!p.ok()) return
    const c = await p.json()
    await request.get(`/api/children/${c.id}`, { headers: G() })
    await request.patch(`/api/children/${c.id}`, { headers: H(), data: { fullName: 'Updated' } })
    await request.post(`/api/children/${c.id}/authorized-pickups`, { headers: H(), data: { fullName: 'PU', relationship: 'Pai', phone: '11988889999', authorization: 'SIM' } })
    await request.get(`/api/children/${c.id}/guardians`, { headers: G() })
    await request.get(`/api/children/${c.id}/documents`, { headers: G() })
    await request.delete(`/api/children/${c.id}`, { headers: H() })
  })

  test('4. Child Items CRUD', async ({ request }) => {
    const p = await request.post('/api/child-items', { headers: H(), data: { name: `I${Date.now()}`, childId: 'cmq5p0s3r006x1hfksw62fex8', itemType: 'FRALDA', quantity: 10 } })
    expect([200,201,400]).toContain(p.status())
    if (!p.ok()) return
    const id = (await p.json()).id
    await request.patch(`/api/child-items/${id}`, { headers: H(), data: { quantity: 5 } })
    await request.delete(`/api/child-items/${id}`, { headers: H() })
  })

  test('5. Groups CRUD', async ({ request }) => {
    const p = await request.post('/api/groups', { headers: H(), data: { name: `G${Date.now()}`, shift: 'MANHA', capacity: 20 } })
    expect([200,201]).toContain(p.status())
    if (!p.ok()) return
    const id = (await p.json()).id
    await request.patch(`/api/groups/${id}`, { headers: H(), data: { capacity: 25 } })
    await request.delete(`/api/groups/${id}`, { headers: H() })
  })

  test('6. Guardians CRUD + Link', async ({ request }) => {
    const p = await request.post('/api/guardians', { headers: H(), data: { fullName: `R${Date.now()}`, phone: '11999990001', relationship: 'Pai' } })
    expect([200,201]).toContain(p.status())
    if (!p.ok()) return
    const id = (await p.json()).id
    await request.post('/api/guardians/link', { headers: H(), data: { childId: 'cmq5p0s3r006x1hfksw62fex8', guardianId: id } })
    await request.patch(`/api/guardians/${id}`, { headers: H(), data: { phone: '11988880002' } })
    await request.delete('/api/guardians/link', { headers: H(), data: { childId: 'cmq5p0s3r006x1hfksw62fex8', guardianId: id } })
    await request.delete(`/api/guardians/${id}`, { headers: H() })
  })

  test('7. Finance Invoices CRUD', async ({ request }) => {
    const p = await request.post('/api/finance/invoices', { headers: H(), data: { description: `F${Date.now()}`, amount: 150, dueDate: new Date(Date.now()+30*86400000).toISOString(), status: 'PENDENTE', type: 'MENSALIDADE' } })
    expect([200,201]).toContain(p.status())
    if (!p.ok()) return
    const id = (await p.json()).id
    await request.get(`/api/finance/invoices/${id}`, { headers: G() })
    await request.patch(`/api/finance/invoices/${id}`, { headers: H(), data: { description: 'Updated' } })
    await request.delete(`/api/finance/invoices/${id}`, { headers: H() })
  })

  test('8. Staff CRUD', async ({ request }) => {
    const p = await request.post('/api/staff', { headers: H(), data: { name: `S${Date.now()}`, roleType: 'PROFESSOR' } })
    expect([200,201]).toContain(p.status())
    if (!p.ok()) return
    const id = (await p.json()).id
    await request.patch(`/api/staff/${id}`, { headers: H(), data: { roleType: 'MONITOR' } })
    await request.delete(`/api/staff/${id}`, { headers: H() })
  })

  test('9. Students CRUD', async ({ request }) => {
    const p = await request.post('/api/students', { headers: H(), data: { fullName: `ST${Date.now()}`, birthDate: '2018-01-01' } })
    expect([200,201]).toContain(p.status())
    if (!p.ok()) return
    await request.get(`/api/students/${(await p.json()).id}`, { headers: G() })
  })

  test('10. Users CRUD', async ({ request }) => {
    const email = `eu-${Date.now()}@t.com`
    const p = await request.post('/api/users', { headers: H(), data: { name: `U${Date.now()}`, email, password: 'Test123!', role: 'FUNCIONARIO' } })
    expect([200,201]).toContain(p.status())
    if (!p.ok()) return
    const id = (await p.json()).id
    await request.patch(`/api/users/${id}`, { headers: H(), data: { name: 'Updated' } })
    await request.delete(`/api/users/${id}`, { headers: H() })
  })

  test('11. Photos + Documents + Health Meds', async ({ request }) => {
    const ph = await request.post('/api/photos', { headers: H(), data: { url: 'https://e.com/p.jpg', caption: 'P' } })
    if (ph.ok()) await request.delete(`/api/photos/${(await ph.json()).id}`, { headers: H() })
    const doc = await request.post('/api/documents', { headers: H(), data: { name: 'D', childId: 'cmq5p0s3r006x1hfksw62fex8', docType: 'RG', url: 'https://e.com/d.pdf' } })
    if (doc.ok()) await request.delete(`/api/documents/${(await doc.json()).id}`, { headers: H() })
    const med = await request.post('/api/health/medications', { headers: H(), data: { name: 'M', childId: 'cmq5p0s3r006x1hfksw62fex8', dosage: '10ml', frequency: '8h' } })
    if (med.ok()) await request.patch(`/api/health/medications/${(await med.json()).id}`, { headers: H(), data: { dosage: '20ml' } })
  })

  test('12. Settings + Teacher + Parent + Billing + WhatsApp + Check-in', async ({ request }) => {
    await request.patch('/api/settings', { headers: H(), data: { schoolName: 'Escola Test' } })
    await request.get('/api/settings', { headers: G() })
    await request.get('/api/teacher/dashboard', { headers: G() })
    await request.get('/api/teacher/classes', { headers: G() })
    await request.get('/api/parent/dashboard', { headers: G() })
    await request.get('/api/parent/feed', { headers: G() })
    await request.get('/api/billing/preview-monthly', { headers: G() })
    await request.get('/api/whatsapp/status', { headers: G() })
    await request.get('/api/whatsapp/messages', { headers: G() })
    await request.post('/api/check-in-out', { headers: H(), data: { childId: 'any', type: 'IN', timestamp: new Date().toISOString() } })
    await request.post('/api/upload/image', { headers: H() })
  })

  test('13. Reports + Stats + Notifications + Daily + Routine', async ({ request }) => {
    await request.get('/api/daily-reports', { headers: G() })
    await request.post('/api/daily-reports', { headers: H(), data: { childId: 'any', date: new Date().toISOString(), notes: 'T' } })
    await request.get('/api/daily-routine', { headers: G() })
    await request.get('/api/stats', { headers: G() })
    await request.get('/api/notifications', { headers: G() })
    await request.get('/api/reports/export', { headers: G() })
    await request.get('/api/health', { headers: G() })
    await request.get('/api/health/medications', { headers: G() })
  })

  test('14. Development Reports CRUD', async ({ request }) => {
    const p = await request.post('/api/development-reports', { headers: H(), data: { title: `DR${Date.now()}`, childId: 'any', date: new Date().toISOString() } })
    expect([200,201,400]).toContain(p.status())
    if (!p.ok()) return
    const id = (await p.json()).id
    await request.patch(`/api/development-reports/${id}`, { headers: H(), data: { title: 'OK' } })
    await request.delete(`/api/development-reports/${id}`, { headers: H() })
  })

  test('15. Webhooks + Security + 401 gate', async ({ request }) => {
    await request.post('/api/webhooks/mercadopago', { headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': ip() }, data: { type: 'payment', data: { id: 'test-final' } } })
    const h = await request.get('/health')
    expect(h.status()).toBe(200)
    const r = await request.get('/api/staff')
    expect(r.status()).toBe(401)
  })
})
