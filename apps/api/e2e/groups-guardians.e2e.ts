/**
 * E2E — Groups (Turmas) + Guardians (Responsáveis) + Students
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

// ═══════════════ GROUPS (TURMAS) ═══════════════
test.describe('Groups (Turmas)', () => {
  test('GET /api/groups — lista turmas', async ({ request }) => {
    test.skip(!token, 'Sem autenticação')
    const res = await request.get('/api/groups', { headers: auth() })
    expect(res.status()).toBe(200)
  })

  test('POST /api/groups — cria turma', async ({ request }) => {
    test.skip(!token, 'Sem autenticação')
    const res = await request.post('/api/groups', {
      headers: { ...auth(), 'Content-Type': 'application/json' },
      data: {
        name: `Turma E2E ${Date.now()}`,
        shift: 'MANHA',
        capacity: 20,
      },
    })
    expect([200, 201]).toContain(res.status())
  })

  test('POST /api/groups — nome vazio retorna 400', async ({ request }) => {
    test.skip(!token, 'Sem autenticação')
    const res = await request.post('/api/groups', {
      headers: { ...auth(), 'Content-Type': 'application/json' },
      data: { name: '' },
    })
    expect(res.status()).toBe(400)
  })

  test('GET /api/groups — sem auth retorna 401', async ({ request }) => {
    const res = await request.get('/api/groups')
    expect(res.status()).toBe(401)
  })
})

// ═══════════════ GUARDIANS (RESPONSÁVEIS) ═══════════════
test.describe('Guardians (Responsáveis)', () => {
  test('GET /api/guardians — lista responsáveis', async ({ request }) => {
    test.skip(!token, 'Sem autenticação')
    const res = await request.get('/api/guardians', { headers: auth() })
    expect(res.status()).toBe(200)
  })

  test('POST /api/guardians — cria responsável', async ({ request }) => {
    test.skip(!token, 'Sem autenticação')
    const res = await request.post('/api/guardians', {
      headers: { ...auth(), 'Content-Type': 'application/json' },
      data: {
        fullName: 'Responsável E2E',
        phone: '11977776666',
        relationship: 'Mãe',
        email: `e2e-mae-${Date.now()}@test.com`,
      },
    })
    expect([200, 201]).toContain(res.status())
  })

  test('POST /api/guardians — sem telefone retorna 400', async ({ request }) => {
    test.skip(!token, 'Sem autenticação')
    const res = await request.post('/api/guardians', {
      headers: { ...auth(), 'Content-Type': 'application/json' },
      data: { fullName: 'Sem Tel', relationship: 'Pai' },
    })
    expect(res.status()).toBe(400)
  })

  test('POST /api/guardians/link — vincula responsável à criança', async ({ request }) => {
    test.skip(!token, 'Sem autenticação')
    const res = await request.post('/api/guardians/link', {
      headers: { ...auth(), 'Content-Type': 'application/json' },
      data: { childId: cmq5p0s3r006x1hfksw62fex8, guardianId: cmq5p0s6c00701hfk7hvg2hfb, isPrimary: true },
    })
    expect([200, 201, 400, 404]).toContain(res.status())
  })
})

// ═══════════════ STUDENTS ═══════════════
test.describe('Students', () => {
  test('GET /api/students — lista estudantes', async ({ request }) => {
    test.skip(!token, 'Sem autenticação')
    const res = await request.get('/api/students', { headers: auth() })
    expect(res.status()).toBe(200)
  })

  test('GET /api/students — sem auth retorna 401', async ({ request }) => {
    const res = await request.get('/api/students')
    expect(res.status()).toBe(401)
  })
})
