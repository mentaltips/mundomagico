/**
 * server-api.ts
 * Helper para Server Components chamarem a Express API diretamente.
 * NÃO usa o proxy do Next.js — chama process.env.API_URL direto.
 */
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'

function getApiUrl() {
  return (process.env.API_URL || 'http://localhost:3002').replace(/\/$/, '')
}

async function getToken(): Promise<string | null> {
  const session = await getServerSession(authOptions)
  return (session as any)?.accessToken ?? null
}

export async function serverFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken()
  const apiUrl = getApiUrl()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers,
    cache: 'no-store',
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`API error ${res.status}: ${text}`)
  }

  return res.json()
}

/** GET helper */
export function apiGet<T = any>(path: string) {
  return serverFetch<T>(path, { method: 'GET' })
}
