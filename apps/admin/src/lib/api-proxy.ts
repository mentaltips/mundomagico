import { getApiAuth } from './auth'
import { NextRequest, NextResponse } from 'next/server'

export async function proxyRequest(req: NextRequest, pathOverride?: string) {
  const apiAuth = await getApiAuth()
  const accessToken = apiAuth?.token

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[Proxy] ${req.method} ${new URL(req.url).pathname} | Token: ${!!accessToken}`)
  }

  const apiUrl = (process.env.API_URL || 'http://127.0.0.1:3002').replace(/\/$/, '')

  const url = new URL(req.url)
  const path = pathOverride || url.pathname
  const queryString = url.search

  const contentType = req.headers.get('content-type') || ''
  const isMultipart = contentType.includes('multipart/form-data')

  // Para multipart NÃO definimos Content-Type — o browser/fetch já inclui o boundary correto
  const headers: Record<string, string> = isMultipart
    ? {}
    : { 'Content-Type': 'application/json' }

  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`

  let body: BodyInit | undefined
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    if (isMultipart) {
      // Preserva o FormData binário intacto
      try { body = await req.blob() } catch {}
      if (body) headers['Content-Type'] = contentType // repassa com o boundary original
    } else {
      try { body = await req.text() } catch {}
    }
  }

  try {
    const response = await fetch(`${apiUrl}${path}${queryString}`, {
      method: req.method,
      headers,
      body,
    })

    // 204/205 não têm body
    if (response.status === 204 || response.status === 205) {
      return new NextResponse(null, { status: response.status })
    }

    const text = await response.text()
    const resContentType = response.headers.get('content-type') || 'application/json'
    return new NextResponse(text, {
      status: response.status,
      headers: { 'Content-Type': resContentType },
    })
  } catch (err: any) {
    console.error(`[Proxy Error] ${req.method} ${path}:`, err.message)
    return NextResponse.json({ error: 'API unavailable', detail: err?.message }, { status: 503 })
  }
}
