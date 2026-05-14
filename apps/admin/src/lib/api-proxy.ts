import { getToken } from 'next-auth/jwt'
import { authOptions, getApiAuth } from './auth'
import { NextRequest, NextResponse } from 'next/server'

export async function proxyRequest(req: NextRequest, pathOverride?: string) {
  const apiAuth = await getApiAuth()
  const accessToken = apiAuth?.token
  
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[Proxy] ${req.method} ${new URL(req.url).pathname} | Token: ${!!accessToken}`)
  }

  const apiUrl = (process.env.API_URL || 'http://127.0.0.1:3002').replace(/\/$/, '')
  
  const url = new URL(req.url)
  // Mantém o /api pois a API no servidor Express espera este prefixo
  const path = pathOverride || url.pathname
  const queryString = url.search

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`

  let body: string | undefined
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    try { body = await req.text() } catch {}
  }

  try {
    const response = await fetch(`${apiUrl}${path}${queryString}`, {
      method: req.method,
      headers,
      body,
    })

    // Respostas sem body (204 No Content, 205 Reset Content) não podem ter body
    // O Response constructor lança erro se tentar criar body com esses status
    if (response.status === 204 || response.status === 205) {
      return new NextResponse(null, { status: response.status })
    }

    const text = await response.text()
    return new NextResponse(text, {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error(`[Proxy Error] ${req.method} ${path}:`, err.message)
    return NextResponse.json({ error: 'API unavailable', detail: err?.message }, { status: 503 })
  }
}
