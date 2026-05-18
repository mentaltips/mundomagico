import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CheckInOutPanel } from './_components/CheckInOutPanel'
import { requireAuth } from '@/lib/auth'
import { apiGet } from '@/lib/server-api'
import { PageHeader, StatCard } from '@/components/ui'
import { ClipboardCheck, CheckCircle2, Clock, Users, ArrowRightLeft, BarChart2 } from 'lucide-react'
import Link from 'next/link'



export default async function CheckInOutClient({
  searchParams,
}: {
  searchParams: { date?: string; groupId?: string }
}) {
  await requireAuth()
  const today = searchParams.date ?? format(new Date(), 'yyyy-MM-dd')

  const groupsQuery = new URLSearchParams({ active: 'true' })
  const childrenQuery = new URLSearchParams({
    status: 'ATIVO,ADAPTACAO',
    date: today,
    ...(searchParams.groupId ? { groupId: searchParams.groupId } : {}),
  })

  const [groups, childrenData] = await Promise.all([
    apiGet<any[]>(`/api/groups?${groupsQuery}`).catch((e) => {
      console.error('[CheckInOutPage] Groups fetch error:', e)
      return []
    }),
    apiGet<any[]>(`/api/check-in-out/children?${childrenQuery}`).catch((e) => {
      console.error('[CheckInOutPage] Children fetch error:', e)
      return []
    }),
  ])

  const date = new Date(today + 'T00:00:00')

  const stats = {
    present: childrenData.filter((c: any) => c.checkInOut?.status === 'PRESENTE').length,
    absent:  childrenData.filter((c: any) => !c.checkInOut || c.checkInOut?.status === 'AUSENTE').length,
    left:    childrenData.filter((c: any) => c.checkInOut?.status === 'SAIU_MAIS_CEDO').length,
    waiting: childrenData.filter((c: any) => c.checkInOut?.status === 'AGUARDANDO_RETIRADA').length,
  }

  return (
    <div className="page animate-in">
      <PageHeader
        title="Entrada e Saída"
        subtitle={format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
        icon={<ArrowRightLeft size={24} />}
        actions={
          <Link href="/admin/check-in-out/relatorio" className="btn-secondary gap-2 text-xs">
            <BarChart2 size={16} /> Relatório Mensal
          </Link>
        }
      />

      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Presentes"
          value={stats.present}
          icon={<CheckCircle2 size={20} />}
          color="text-emerald-500 bg-emerald-500/10"
        />
        <StatCard
          label="Ausentes"
          value={stats.absent}
          icon={<Users size={20} />}
          color="text-muted-foreground bg-muted"
        />
        <StatCard
          label="Aguardando"
          value={stats.waiting}
          icon={<Clock size={20} />}
          color="text-blue-500 bg-blue-500/10"
        />
        <StatCard
          label="Saída Antecipada"
          value={stats.left}
          icon={<ArrowRightLeft size={20} />}
          color="text-amber-500 bg-amber-500/10"
        />
      </div>

      {/* Filters */}
      <div className="card p-5">
        <form className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="label">Data</label>
            <input type="date" name="date" defaultValue={today} className="input" />
          </div>
          <div className="flex-1">
            <label className="label">Filtrar por Turma</label>
            <select name="groupId" defaultValue={searchParams.groupId} className="select">
              <option value="">Todos os grupos</option>
              {groups.map((g: any) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button type="submit" className="btn-primary w-full sm:w-auto h-[46px] px-8">
              Buscar
            </button>
          </div>
        </form>
      </div>

      {/* Interactive Panel */}
      <div className="bg-card rounded-[2.5rem] border border-border shadow-sm overflow-hidden p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
            <ClipboardCheck size={20} />
          </div>
          <div>
            <h3 className="text-lg font-black text-foreground">Lista de Chamada</h3>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-0.5">
              Controle individual de presença
            </p>
          </div>
        </div>
        <CheckInOutPanel
          key={`${today}-${childrenData.length}-${childrenData.map((c: any) => c.checkInOut?.status).join(',')}`}
          date={today}
          initialChildren={childrenData}
        />
      </div>
    </div>
  )
}
