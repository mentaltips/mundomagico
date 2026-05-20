import { NextResponse } from 'next/server'

function getApiBaseUrl() {
  const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'
  return apiUrl.replace(/\/$/, '').replace(/\/api$/, '')
}

export async function GET() {
  const baseUrl = getApiBaseUrl()
  const loginUrl = `${baseUrl}/api/auth/login`

  let apiResult: any = null
  let apiError: any = null

  try {
    const res = await fetch(loginUrl, {
      method: 'POST',
      body: JSON.stringify({
        email: 'diretoria@mundomagico.com.br',
        password: 'magia2024',
      }),
      headers: { 'Content-Type': 'application/json' },
    })
    const data = await res.json()
    apiResult = { status: res.status, ok: res.ok, hasUser: !!data.user, email: data.user?.email }
  } catch (err: any) {
    apiError = err.message
  }

  return NextResponse.json({
    env: {
      API_URL: process.env.API_URL || '(não definido)',
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '(não definido)',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || '(não definido)',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? '(definido - ' + process.env.NEXTAUTH_SECRET.slice(0, 6) + '...)' : '(NÃO DEFINIDO!)',
    },
    loginUrl,
    apiResult,
    apiError,
  })
}
