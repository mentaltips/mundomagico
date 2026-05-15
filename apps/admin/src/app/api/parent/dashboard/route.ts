import { NextRequest } from 'next/server'
import { proxyRequest } from '@/lib/api-proxy'

export const GET = (req: NextRequest) => proxyRequest(req, '/api/parent/dashboard')
export const POST = (req: NextRequest) => proxyRequest(req, '/api/parent/dashboard')
export const PATCH = (req: NextRequest) => proxyRequest(req, '/api/parent/dashboard')
export const PUT = (req: NextRequest) => proxyRequest(req, '/api/parent/dashboard')
export const DELETE = (req: NextRequest) => proxyRequest(req, '/api/parent/dashboard')
