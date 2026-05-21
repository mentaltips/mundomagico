import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  const fileName = params.path?.join('/') || ''
  if (!fileName) {
    return new NextResponse('Not Found', { status: 404 })
  }

  const apiUrl = process.env.API_URL || 'https://api.mundomagicocajamar.com.br'
  const url = `${apiUrl}/uploads/${fileName}`

  // Get auth token from session
  const sessionCookie = req.cookies.get('next-auth.session-token') || req.cookies.get('__Secure-next-auth.session-token')
  const headers: HeadersInit = {}
  if (sessionCookie) {
    headers['Cookie'] = `${sessionCookie.name}=${sessionCookie.value}`
  }

  try {
    const response = await fetch(url, { headers })

    if (!response.ok) {
      return new NextResponse('Not Found', { status: 404 })
    }

    const buffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'image/png'

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return new NextResponse('Not Found', { status: 404 })
  }
}
