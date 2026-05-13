import { ChildForm } from '../_components/ChildForm'
import { prisma } from '@mundo-magico/database'
import { requireAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function NewChildPage() {
  const user = await requireAuth()
  const groups = await prisma.group.findMany({ where: { schoolId: user.schoolId, active: true }, orderBy: { name: 'asc' } })

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
