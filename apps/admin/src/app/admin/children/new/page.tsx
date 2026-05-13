import { ChildForm } from '../_components/ChildForm'
import { prisma } from '@mundo-magico/database'

export default async function NewChildPage() {
  const groups = await prisma.group.findMany({ where: { active: true }, orderBy: { name: 'asc' } })

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
