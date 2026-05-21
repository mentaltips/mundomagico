import { NextRequest, NextResponse } from 'next/server'
import { getApiAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

function isImagePath(fileName: string) {
  return /\.(avif|gif|jpe?g|png|webp|svg)$/i.test(fileName)
}

function imagePlaceholder() {
  return new NextResponse(
    '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="18" fill="#102018"/><circle cx="48" cy="38" r="14" fill="#2f7d32"/><path d="M22 82c4-16 14-24 26-24s22 8 26 24" fill="#2f7d32"/></svg>',
    {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'private, no-store',
      },
    },
  )
}

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
      if (response.status === 404 && isImagePath(fileName)) {
        return imagePlaceholder()
      }
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
    if (isImagePath(fileName)) {
      return imagePlaceholder()
    }
    return new NextResponse('Not Found', { status: 404 })
  }
}
