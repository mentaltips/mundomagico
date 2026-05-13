import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { NextRequest, NextResponse } from 'next/server'

export async function proxyRequest(req: NextRequest, pathOverride?: string) {
  const session = await getServerSession(authOptions)
  const token = (session as any)?.accessToken

  const apiUrl = (process.env.API_URL || 'http://localhost:3333').replace(/\/$/, '')
  
  const url = new URL(req.url)
  const path = pathOverride || url.pathname.replace(/^\/api/, '')
  const queryString = url.search

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

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
