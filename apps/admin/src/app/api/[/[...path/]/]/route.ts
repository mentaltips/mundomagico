import { NextRequest } from 'next/server'
import { proxyRequest } from '@/lib/api-proxy'

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path?.join('/') || ''
  return proxyRequest(req, `/api/${path}`)
}

export async function POST(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path?.join('/') || ''
  return proxyRequest(req, `/api/${path}`)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path?.join('/') || ''
  return proxyRequest(req, `/api/${path}`)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path?.join('/') || ''
  return proxyRequest(req, `/api/${path}`)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path?.join('/') || ''
  return proxyRequest(req, `/api/${path}`)
}
