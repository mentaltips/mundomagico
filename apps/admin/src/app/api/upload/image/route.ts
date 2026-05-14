import { getApiAuth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

const API_URL = (process.env.API_URL || 'http://127.0.0.1:3002').replace(/\/$/, '')

export async function POST(req: NextRequest) {
  try {
    const apiAuth = await getApiAuth()
    const token = apiAuth?.token

    // Repassa o FormData diretamente para a API
    const formData = await req.formData()

    const response = await fetch(`${API_URL}/api/upload/image`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro no upload' }, { status: 500 })
  }
}
