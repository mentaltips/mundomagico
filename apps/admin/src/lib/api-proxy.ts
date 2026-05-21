import { getApiAuth } from './auth'
import { NextRequest, NextResponse } from 'next/server'

export async function proxyRequest(req: NextRequest, pathOverride?: string) {
  const apiAuth = await getApiAuth(req)
  const accessToken = apiAuth?.token

  console.log(`[Proxy] ${req.method} ${new URL(req.url).pathname} | auth=${!!apiAuth} token=${accessToken?.length || 0}chars`)
  if (!accessToken) {
    console.warn(`[Proxy] WARNING: No access token for ${req.method} ${new URL(req.url).pathname}`)
  }

  const apiUrl = (process.env.API_URL || 'http://127.0.0.1:3333').replace(/\/$/, '')

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
      try { 
        const text = await req.text() 
        body = text
        if (process.env.NODE_ENV !== 'production' && text) {
          console.log(`[Proxy] Body received: ${text.length} bytes`)
        }
      } catch {}
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

    if (response.status >= 400) {
      const errorText = await response.clone().text()
      console.error(`[Proxy] ${response.status} from backend on ${req.method} ${path}:`, errorText)
    }

    const blob = await response.blob()
    const resContentType = response.headers.get('content-type') || 'application/json'

    return new NextResponse(blob, {
      status: response.status,
      headers: { 
        'Content-Type': resContentType,
        'Cache-Control': resContentType.startsWith('image/')
          ? 'public, max-age=31536000, immutable'
          : 'private, no-store',
      },
    })
  } catch (err: any) {
    console.error(`[Proxy Error] ${req.method} ${path}:`, err.message)
    return NextResponse.json({ error: 'API unavailable', detail: err?.message }, { status: 503 })
  }
}
