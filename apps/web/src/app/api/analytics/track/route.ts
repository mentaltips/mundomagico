import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'

    const res = await fetch(`${apiUrl}/api/analytics/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    return new NextResponse(null, { status: res.ok ? 204 : 200 })
  } catch {
    // Silently ignore — analytics should never break the page
    return new NextResponse(null, { status: 204 })
  }
}
