import { proxyRequest } from '@/lib/api-proxy'
import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  return proxyRequest(req, '/api/auth/change-password')
}
