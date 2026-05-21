import { NextRequest, NextResponse } from 'next/server'
import { getApiAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  const fileName = params.path?.join('/') || ''
  if (!fileName) {
    return new NextResponse('Not Found', { status: 404 })
  }

  const apiUrl = (process.env.API_URL || 'https://api.mundomagicocajamar.com.br').replace(/\/$/, '')
  const url = `${apiUrl}/uploads/${fileName}`

  const apiAuth = await getApiAuth(req)
  const headers: Record<string, string> = {}
  if (apiAuth?.token) {
    headers['Authorization'] = `Bearer ${apiAuth.token}`
  }

  try {
    const response = await fetch(url, { headers })

    if (!response.ok) {
      return new NextResponse('Not Found', { status: response.status })
    }

    const buffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'image/jpeg'

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
