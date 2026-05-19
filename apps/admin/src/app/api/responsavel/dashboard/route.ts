import { NextRequest } from 'next/server'
import { proxyRequest } from '@/lib/api-proxy'

export const dynamic = 'force-dynamic'

export const GET = (req: NextRequest) => proxyRequest(req, '/api/responsavel/dashboard')
export const POST = (req: NextRequest) => proxyRequest(req, '/api/responsavel/dashboard')
export const PATCH = (req: NextRequest) => proxyRequest(req, '/api/responsavel/dashboard')
export const PUT = (req: NextRequest) => proxyRequest(req, '/api/responsavel/dashboard')
export const DELETE = (req: NextRequest) => proxyRequest(req, '/api/responsavel/dashboard')
