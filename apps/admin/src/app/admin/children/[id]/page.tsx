import { ChildForm } from '../_components/ChildForm'
import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { apiGet } from '@/lib/server-api'

export const dynamic = 'force-dynamic'

export default async function EditChildPage({ params }: { params: { id: string } }) {
  const user = await requireAuth()
  const [child, groups] = await Promise.all([
    apiGet<any>(`/api/children/${params.id}`).catch(() => null),
    apiGet<any[]>('/api/groups?active=true').catch(() => []),
  ])

  if (!child) {
    notFound()
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="page-title">Editar Aluno: {child.fullName}</h1>
        <p className="text-sm text-gray-500 mt-1">Atualize as informações do aluno e de seus responsáveis</p>
      </div>
      <ChildForm groups={groups} defaultValues={child} childId={params.id} />
    </div>
  )
}
