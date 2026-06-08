/**
 * Auth helper compartilhado — faz login UMA vez e reusa o token
 */
import { APIRequestContext } from '@playwright/test'

let cachedToken: string | null = null
let cachedSchoolId: string | null = null

export async function getAuth(request: APIRequestContext) {
  if (cachedToken) return { token: cachedToken, schoolId: cachedSchoolId }

  const res = await request.post('/api/auth/login', {
    data: { email: 'qa@mundomagico.com.br', password: 'Test123!' },
  })

  if (res.status() === 200) {
    const body = await res.json()
    cachedToken = body.token
    cachedSchoolId = body.user.schoolId
  }

  return { token: cachedToken, schoolId: cachedSchoolId }
}

export function authHeaders(token: string | null) {
  return token ? { Authorization: `Bearer ${token}` } : {}
}
