import { proxyRequest } from '@/lib/api-proxy'
import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export const GET = (req: NextRequest) => proxyRequest(req)
