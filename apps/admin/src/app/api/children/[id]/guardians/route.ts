import { proxyRequest } from '@/lib/api-proxy'
import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export const GET = (req: NextRequest, { params }: { params: { id: string } }) => {
  console.log(`[RouteHit] GET /api/children/${params.id}/guardians`)
  return proxyRequest(req)
}
export const POST = (req: NextRequest) => proxyRequest(req)
export const PATCH = (req: NextRequest) => proxyRequest(req)
export const PUT = (req: NextRequest) => proxyRequest(req)
export const DELETE = (req: NextRequest) => proxyRequest(req)

