import { proxyRequest } from '@/lib/api-proxy'
import { NextRequest } from 'next/server'

export const GET = (req: NextRequest) => proxyRequest(req)
export const PATCH = (req: NextRequest) => proxyRequest(req)
export const DELETE = (req: NextRequest) => proxyRequest(req)
