import { NextRequest } from 'next/server'
import { proxyRequest } from '@/lib/api-proxy'

export const GET = (req: NextRequest) => proxyRequest(req, '/api/parent/feed')
export const POST = (req: NextRequest) => proxyRequest(req, '/api/parent/feed')
export const PATCH = (req: NextRequest) => proxyRequest(req, '/api/parent/feed')
export const PUT = (req: NextRequest) => proxyRequest(req, '/api/parent/feed')
export const DELETE = (req: NextRequest) => proxyRequest(req, '/api/parent/feed')
