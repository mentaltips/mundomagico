import { prisma } from '@mundo-magico/database'
import { format } from 'date-fns'
import { CheckInOutPanel } from './_components/CheckInOutPanel'
import { requireAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function CheckInOutPage({
  searchParams,
}: {
  searchParams: { date?: string; groupId?: string }
}) {
  const user = await requireAuth()
  const today = searchParams.date ?? format(new Date(), 'yyyy-MM-dd')
  const date = new Date(today + 'T00:00:00')

  const groups = await prisma.group.findMany({
    where: { schoolId: user.schoolId, active: true },
    orderBy: { name: 'asc' },
  })

  const children = await prisma.child.findMany({
    where: {
      schoolId: user.schoolId,
      status: { in: ['ATIVO', 'ADAPTACAO'] },
      ...(searchParams.groupId ? { groupId: searchParams.groupId } : {}),
    },
    include: {
      group: true,
      checkInOuts: { where: { date } },
      guardians: {
        include: { guardian: true },
        where: { canPickup: true },
      },
      authorizedPickups: { where: { authorization: { in: ['SIM', 'TEMPORARIO'] } } },
    },
    orderBy: { fullName: 'asc' },
  })

  const stats = {
    present:  children.filter((c) => c.checkInOuts[0]?.status === 'PRESENTE').length,
    absent:   children.filter((c) => !c.checkInOuts[0] || c.checkInOuts[0]?.status === 'AUSENTE').length,
    left:     children.filter((c) => c.checkInOuts[0]?.status === 'SAIU_MAIS_CEDO').length,
    waiting:  children.filter((c) => c.checkInOuts[0]?.status === 'AGUARDANDO_RETIRADA').length,
  }

  const childrenData = children.map((child) => ({
    id: child.id,
    fullName: child.fullName,
    nickname: child.nickname,
    photoUrl: child.photoUrl,
    groupName: child.group?.name ?? null,
    usesDiapers: child.usesDiapers,
    checkInOut: child.checkInOuts[0] ?? null,
    authorizedPersons: [
      ...child.guardians.map((cg) => ({
        name: cg.guardian.fullName,
        relationship: cg.guardian.relationship,
        phone: cg.guardian.phone,
        cpf: cg.guardian.cpf,
        type: 'guardian' as const,
      })),
      ...child.authorizedPickups.map((ap) => ({
        name: ap.fullName,
        relationship: ap.relationship,
        phone: ap.phone,
        cpf: ap.cpf,
        type: 'authorized' as const,
      })),
    ],
  }))

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Entrada e Saída</h1>
          <p className="text-sm text-gray-500 capitalize">
            {format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: require('date-fns/locale/pt-BR').ptBR })}
          </p>
        </div>
      </div>

      {/* Filtro */}
      <div className="card p-4">
        <form className="flex flex-wrap gap-3">
          <input type="date" name="date" defaultValue={today} className="input w-44" />
          <select name="groupId" defaultValue={searchParams.groupId} className="input w-44">
            <option value="">Todos os grupos</option>
            {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <button type="submit" className="btn-primary">Buscar</button>
        </form>
      </div>

      {/* Cards de status */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 border-l-4 border-green-500">
          <p className="text-3xl font-bold text-green-600">{stats.present}</p>
          <p className="text-sm text-gray-600 mt-1">✅ Presentes</p>
        </div>
        <div className="card p-4 border-l-4 border-gray-400">
          <p className="text-3xl font-bold text-gray-500">{stats.absent}</p>
          <p className="text-sm text-gray-600 mt-1">○ Ausentes</p>
        </div>
        <div className="card p-4 border-l-4 border-blue-500">
          <p className="text-3xl font-bold text-blue-600">{stats.waiting}</p>
          <p className="text-sm text-gray-600 mt-1">⏳ Aguardando retirada</p>
        </div>
        <div className="card p-4 border-l-4 border-yellow-500">
          <p className="text-3xl font-bold text-yellow-600">{stats.left}</p>
          <p className="text-sm text-gray-600 mt-1">↩ Saiu mais cedo</p>
        </div>
      </div>

      {/* Painel interativo */}
      <CheckInOutPanel date={today} children={childrenData} />
    </div>
  )
}
