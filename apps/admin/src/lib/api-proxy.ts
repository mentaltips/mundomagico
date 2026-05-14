import { getToken } from 'next-auth/jwt'
import { authOptions } from './auth'
import { NextRequest, NextResponse } from 'next/server'

export async function proxyRequest(req: NextRequest, pathOverride?: string) {
  // Tenta pegar o token do cookie da requisição
  const token = await getToken({ 
    req: req as any, 
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === 'production'
  })
  
  const accessToken = (token as any)?.accessToken
  
  console.log(`[Proxy] Request: ${req.method} ${req.url}`)
  console.log(`[Proxy] Token object exists: ${!!token}`)
  console.log(`[Proxy] AccessToken: ${!!accessToken}`)
  
  const headersObj: any = {}
  req.headers.forEach((v, k) => { headersObj[k] = k.includes('cookie') ? '[HIDDEN]' : v })
  console.log(`[Proxy] Headers:`, JSON.stringify(headersObj, null, 2))
  console.log(`[Proxy] Cookies list:`, req.cookies.getAll().map(c => c.name).join(', '))

  const apiUrl = (process.env.API_URL || 'http://localhost:3333').replace(/\/$/, '')
  
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
    const text = await response.text()
    return new NextResponse(text, {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return NextResponse.json({ error: 'API unavailable', detail: err?.message }, { status: 503 })
  }
}
