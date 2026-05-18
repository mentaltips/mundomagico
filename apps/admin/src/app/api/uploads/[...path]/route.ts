import { proxyRequest } from '@/lib/api-proxy'
import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  // O path vem como um array (ex: ['123.jpg']). Juntamos de volta.
  const filePath = params.path.join('/')
  
  // Repassamos para o backend no caminho real /uploads/... (sem o /api)
  return proxyRequest(req, `/uploads/${filePath}`)
}
