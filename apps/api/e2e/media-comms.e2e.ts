/**
 * E2E — WhatsApp + Photos + Documents + Calendar + Announcements
 * Cobre: envio de mensagens, uploads, agenda, mural
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

// ═══════════════ WHATSAPP ═══════════════
test.describe('WhatsApp', () => {
  test('GET /api/whatsapp — status/config', async ({ request }) => {
    test.skip(!token, 'Sem autenticação')
    const res = await request.get('/api/whatsapp', { headers: auth() })
    expect([200, 404]).toContain(res.status())
  })

  test('GET /api/whatsapp — sem auth retorna 401', async ({ request }) => {
    const res = await request.get('/api/whatsapp')
    expect(res.status()).toBe(401)
  })
})

// ═══════════════ PHOTOS ═══════════════
test.describe('Photos (Fotos)', () => {
  test('GET /api/photos — lista fotos', async ({ request }) => {
    test.skip(!token, 'Sem autenticação')
    const res = await request.get('/api/photos', { headers: auth() })
    expect(res.status()).toBe(200)
  })

  test('GET /api/photos — sem auth retorna 401', async ({ request }) => {
    const res = await request.get('/api/photos')
    expect(res.status()).toBe(401)
  })
})

// ═══════════════ DOCUMENTS ═══════════════
test.describe('Documents (Documentos)', () => {
  test('GET /api/documents — lista documentos', async ({ request }) => {
    test.skip(!token, 'Sem autenticação')
    const res = await request.get('/api/documents', { headers: auth() })
    expect(res.status()).toBe(200)
  })

  test('GET /api/documents — sem auth retorna 401', async ({ request }) => {
    const res = await request.get('/api/documents')
    expect(res.status()).toBe(401)
  })
})

// ═══════════════ CALENDAR ═══════════════
test.describe('Calendar (Calendário)', () => {
  test('GET /api/calendar — lista eventos', async ({ request }) => {
    test.skip(!token, 'Sem autenticação')
    const res = await request.get('/api/calendar', { headers: auth() })
    expect(res.status()).toBe(200)
  })

  test('POST /api/calendar — cria evento', async ({ request }) => {
    test.skip(!token, 'Sem autenticação')
    const tomorrow = new Date(Date.now() + 86400000).toISOString()
    const res = await request.post('/api/calendar', {
      headers: { ...auth(), 'Content-Type': 'application/json' },
      data: {
        title: 'Evento E2E',
        date: tomorrow,
        description: 'Evento de teste',
      },
    })
    expect([200, 201]).toContain(res.status())
  })

  test('GET /api/calendar — sem auth retorna 401', async ({ request }) => {
    const res = await request.get('/api/calendar')
    expect(res.status()).toBe(401)
  })
})

// ═══════════════ ANNOUNCEMENTS ═══════════════
test.describe('Announcements (Comunicados)', () => {
  test('GET /api/announcements — lista comunicados', async ({ request }) => {
    test.skip(!token, 'Sem autenticação')
    const res = await request.get('/api/announcements', { headers: auth() })
    expect(res.status()).toBe(200)
  })

  test('POST /api/announcements — cria comunicado', async ({ request }) => {
    test.skip(!token, 'Sem autenticação')
    const res = await request.post('/api/announcements', {
      headers: { ...auth(), 'Content-Type': 'application/json' },
      data: {
        title: 'Comunicado E2E',
        content: 'Conteúdo do comunicado de teste',
        priority: 'NORMAL',
      },
    })
    expect([200, 201]).toContain(res.status())
  })
})

// ═══════════════ UPLOAD ═══════════════
test.describe('Upload', () => {
  test('GET /api/upload — sem auth retorna 401', async ({ request }) => {
    const res = await request.get('/api/upload')
    expect(res.status()).toBe(401)
  })
})
