/**
 * E2E — Children CRUD com dados reais
 */
import { test, expect } from '@playwright/test'
import { getAuth, authHeaders } from './helpers/auth'

let childId: string

test.beforeAll(async ({ request }) => {
  await getAuth(request)
})

test('GET /api/children — lista crianças', async ({ request }) => {
  const { token } = await getAuth(request)
  if (!token) { test.skip(true, 'Sem autenticação'); return }
  const res = await request.get('/api/children', { headers: authHeaders(token) })
  expect(res.status()).toBe(200)
  const body = await res.json()
  if (Array.isArray(body) && body.length > 0) childId = body[0].id
})

test('POST /api/children — cria uma criança', async ({ request }) => {
  const { token } = await getAuth(request)
  if (!token) { test.skip(true, 'Sem autenticação'); return }
  const res = await request.post('/api/children', {
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    data: {
      fullName: `E2E ${Date.now()}`,
      birthDate: '2020-06-15',
      gender: 'MASCULINO',
      shift: 'INTEGRAL',
      status: 'ATIVO',
    },
  })
  expect([200, 201]).toContain(res.status())
  if (res.ok()) childId = (await res.json()).id
})

test('GET /api/children/:id — busca criança', async ({ request }) => {
  const { token } = await getAuth(request)
  if (!token || !childId) { test.skip(true, 'Sem criança'); return }
  const res = await request.get(`/api/children/${childId}`, { headers: authHeaders(token) })
  expect(res.status()).toBe(200)
})

test('PATCH /api/children/:id — atualiza nome', async ({ request }) => {
  const { token } = await getAuth(request)
  if (!token || !childId) { test.skip(true, 'Sem criança'); return }
  const res = await request.patch(`/api/children/${childId}`, {
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    data: { fullName: 'E2E Updated' },
  })
  expect(res.status()).toBe(200)
})

test('GET /api/children/:id/authorized-pickups — lista', async ({ request }) => {
  const { token } = await getAuth(request)
  if (!token || !childId) { test.skip(true, 'Sem criança'); return }
  const res = await request.get(`/api/children/${childId}/authorized-pickups`, { headers: authHeaders(token) })
  expect(res.status()).toBe(200)
})

test('POST /api/children/:id/authorized-pickups — cria', async ({ request }) => {
  const { token } = await getAuth(request)
  if (!token || !childId) { test.skip(true, 'Sem criança'); return }
  const res = await request.post(`/api/children/${childId}/authorized-pickups`, {
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    data: { fullName: 'Pickup E2E', relationship: 'Pai', phone: '11988887777', authorization: 'SIM' },
  })
  expect([200, 201]).toContain(res.status())
})

test('GET /api/children/inexistente — 404 tenant isolation', async ({ request }) => {
  const { token } = await getAuth(request)
  if (!token) { test.skip(true, 'Sem autenticação'); return }
  const res = await request.get('/api/children/id-inexistente-xyz', { headers: authHeaders(token) })
  expect(res.status()).toBe(404)
})

test('GET /api/children — sem auth 401', async ({ request }) => {
  const res = await request.get('/api/children')
  expect(res.status()).toBe(401)
})
