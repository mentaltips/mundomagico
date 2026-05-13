import { ChildForm } from '../_components/ChildForm'
import { requireAuth } from '@/lib/auth'
import { apiGet } from '@/lib/server-api'

export const dynamic = 'force-dynamic'

export default async function NewChildPage() {
  const user = await requireAuth()
  const groups = await apiGet<any[]>('/api/groups?active=true').catch(() => [])

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="page-title">Cadastrar Criança</h1>
        <p className="text-sm text-gray-500 mt-1">Preencha os dados da criança e seus responsáveis</p>
      </div>
      <ChildForm groups={groups} />
    </div>
  )
}
