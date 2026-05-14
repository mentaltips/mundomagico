import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CheckInOutPanel } from './_components/CheckInOutPanel'
import { requireAuth } from '@/lib/auth'
import { apiGet } from '@/lib/server-api'

export const dynamic = 'force-dynamic'

export default async function CheckInOutPage({
  searchParams,
}: {
  searchParams: { date?: string; groupId?: string }
}) {
  const user = await requireAuth()
  const today = searchParams.date ?? format(new Date(), 'yyyy-MM-dd')

  const groupsQuery = new URLSearchParams({ active: 'true' })
  const childrenQuery = new URLSearchParams({
    status: 'ATIVO,ADAPTACAO',
    date: today,
    ...(searchParams.groupId ? { groupId: searchParams.groupId } : {}),
  })

  const [groups, childrenData] = await Promise.all([
    apiGet<any[]>(`/api/groups?${groupsQuery}`).catch(() => []),
    apiGet<any[]>(`/api/check-in-out/children?${childrenQuery}`).catch(() => []),
  ])

  const date = new Date(today + 'T00:00:00')

  const stats = {
    present: childrenData.filter((c: any) => c.checkInOut?.status === 'PRESENTE').length,
    absent:  childrenData.filter((c: any) => !c.checkInOut || c.checkInOut?.status === 'AUSENTE').length,
    left:    childrenData.filter((c: any) => c.checkInOut?.status === 'SAIU_MAIS_CEDO').length,
    waiting: childrenData.filter((c: any) => c.checkInOut?.status === 'AGUARDANDO_RETIRADA').length,
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Entrada e Saída</h1>
          <p className="text-sm text-gray-500 capitalize">
            {format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
      </div>

      {/* Filtro */}
      <div className="card p-4">
        <form className="flex flex-wrap gap-3">
          <input type="date" name="date" defaultValue={today} className="input w-44" />
          <select name="groupId" defaultValue={searchParams.groupId} className="input w-44">
            <option value="">Todos os grupos</option>
            {groups.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
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
