import Link from 'next/link'
import { Plus, Search, Baby, ChevronRight, X } from 'lucide-react'
import { CHILD_STATUS_COLORS, CHILD_STATUS_LABELS, SHIFT_LABELS } from '@mundo-magico/types'
import { differenceInMonths, differenceInYears } from 'date-fns'
import { requireAuth } from '@/lib/auth'
import { apiGet } from '@/lib/server-api'
import { Avatar, PageHeader, EmptyState, Badge } from '@/components/ui'

function formatAge(birthDate: string): string {
  const date = new Date(birthDate)
  const now = new Date()
  const years = differenceInYears(now, date)
  const months = differenceInMonths(now, date) % 12
  if (years === 0) return `${months}m`
  if (months === 0) return `${years}a`
  return `${years}a ${months}m`
}

const STATUS_VARIANTS: Record<string, any> = {
  ATIVO:            'green',
  ADAPTACAO:        'amber',
  AGUARDANDO_VAGA:  'blue',
  INATIVO:          'gray',
}

const SHIFT_BADGE: Record<string, string> = {
  MANHA:    'bg-sky-500/10 text-sky-600 border-sky-500/20',
  TARDE:    'bg-violet-500/10 text-violet-600 border-violet-500/20',
  INTEGRAL: 'bg-lime-500/10 text-lime-600 border-lime-500/20',
  NOTURNO:  'bg-muted text-muted-foreground border-border',
}

export const dynamic = 'force-dynamic'

export default async function ChildrenPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; groupId?: string; shift?: string }
}) {
  const user = await requireAuth()
  const { q, status, groupId, shift } = searchParams

  const query = new URLSearchParams()
  if (q) query.set('q', q)
  if (status) query.set('status', status)
  if (groupId) query.set('groupId', groupId)
  if (shift) query.set('shift', shift)

  const [children, groups] = await Promise.all([
    apiGet<any[]>(`/api/children?${query}`).catch(() => []),
    apiGet<any[]>('/api/groups?active=true').catch(() => []),
  ])

  const counts = {
    ATIVO:            children.filter((c) => c.status === 'ATIVO').length,
    ADAPTACAO:        children.filter((c) => c.status === 'ADAPTACAO').length,
    AGUARDANDO_VAGA:  children.filter((c) => c.status === 'AGUARDANDO_VAGA').length,
  }

  return (
    <div className="page animate-in">
      <PageHeader 
        title="Crianças" 
        subtitle={`${children.length} aluno${children.length !== 1 ? 's' : ''} cadastrado${children.length !== 1 ? 's' : ''}`}
        icon={<Baby size={24} />}
        actions={
          <Link href="/admin/children/new" className="btn-primary">
            <Plus size={18} /> Nova criança
          </Link>
        }
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Ativas',          value: counts.ATIVO,           variant: 'green' },
          { label: 'Adaptação',       value: counts.ADAPTACAO,       variant: 'amber' },
          { label: 'Ag. Vaga',        value: counts.AGUARDANDO_VAGA, variant: 'blue' },
        ].map((s, i) => (
          <div key={i} className="card p-5 flex items-center justify-between group overflow-hidden relative">
            <div className="relative z-10">
              <p className="text-3xl font-black text-foreground tracking-tight">{s.value}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">{s.label}</p>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              s.variant === 'green' ? 'bg-emerald-500/10 text-emerald-500' : 
              s.variant === 'amber' ? 'bg-amber-500/10 text-amber-500' : 
              'bg-blue-500/10 text-blue-500'
            }`}>
              <Baby size={24} />
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-5">
        <form className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              name="q"
              defaultValue={q}
              placeholder="Buscar por nome..."
              className="input pl-10"
            />
          </div>
          <select name="status" defaultValue={status} className="select">
            <option value="">Status</option>
            <option value="ATIVO">Ativo</option>
            <option value="ADAPTACAO">Em adaptação</option>
            <option value="AGUARDANDO_VAGA">Aguardando vaga</option>
            <option value="INATIVO">Inativo</option>
          </select>
          <select name="groupId" defaultValue={groupId} className="select">
            <option value="">Turma</option>
            {groups.map((g: any) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary flex-1">
              Filtrar
            </button>
            {(q || status || groupId || shift) && (
              <Link href="/admin/children" className="btn-secondary px-3">
                <X size={18} />
              </Link>
            )}
          </div>
        </form>
      </div>

      {children.length === 0 ? (
        <EmptyState 
          icon={<Baby size={32} />}
          title="Nenhuma criança encontrada"
          description="Tente ajustar os filtros ou cadastre uma nova criança."
          action={
            <Link href="/admin/children/new" className="btn-primary">
              <Plus size={16} /> Cadastrar criança
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {/* Table Container with scroll for mobile safety, though we use cards on mobile */}
          <div className="table-container hidden md:block">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="table-header">Criança</th>
                  <th className="table-header">Turma & Idade</th>
                  <th className="table-header">Turno</th>
                  <th className="table-header">Responsável</th>
                  <th className="table-header">Status</th>
                  <th className="table-header text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {children.map((child: any) => {
                  const guardian = child.guardians?.[0]?.guardian
                  return (
                    <tr key={child.id} className="table-row">
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          <Avatar name={child.fullName} photoUrl={child.photoUrl} size="md" />
                          <div>
                            <p className="font-black text-foreground text-sm">{child.fullName}</p>
                            {child.nickname && (
                              <p className="text-[10px] text-muted-foreground font-medium mt-0.5 uppercase tracking-wider italic">"{child.nickname}"</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <p className="text-sm font-bold text-foreground">{child.group?.name ?? '—'}</p>
                        <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{formatAge(child.birthDate)}</p>
                      </td>
                      <td className="table-cell">
                        <span className={`badge px-2.5 py-1 ${SHIFT_BADGE[child.shift] ?? 'badge-gray'}`}>
                          {SHIFT_LABELS[child.shift as keyof typeof SHIFT_LABELS] ?? child.shift}
                        </span>
                      </td>
                      <td className="table-cell">
                        {child.guardians && child.guardians.length > 0 ? (
                          <div>
                            <p className="text-sm font-bold text-foreground">
                              {child.guardians.slice(0, 2).map((g: any) => g.guardian.fullName.split(' ')[0]).join(', ')}
                              {child.guardians.length > 2 && ` +${child.guardians.length - 2}`}
                            </p>
                            {child.guardians[0].guardian.phone && (
                              <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{child.guardians[0].guardian.phone}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground/30 italic">Não cadastrado</span>
                        )}
                      </td>
                      <td className="table-cell">
                        <Badge 
                          label={CHILD_STATUS_LABELS[child.status as keyof typeof CHILD_STATUS_LABELS] ?? child.status} 
                          variant={STATUS_VARIANTS[child.status] ?? 'gray'} 
                        />
                      </td>
                      <td className="table-cell text-right">
                        <Link
                          href={`/admin/children/${child.id}`}
                          className="btn-ghost p-2 rounded-xl inline-flex"
                        >
                          <ChevronRight size={18} />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
            {children.map((child: any) => {
              const guardian = child.guardians?.[0]?.guardian
              return (
                <Link
                  key={child.id}
                  href={`/admin/children/${child.id}`}
                  className="card-interactive p-5 flex items-center gap-4"
                >
                  <Avatar name={child.fullName} photoUrl={child.photoUrl} size="lg" />
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-foreground truncate text-base">{child.fullName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        label={CHILD_STATUS_LABELS[child.status as keyof typeof CHILD_STATUS_LABELS] ?? child.status} 
                        variant={STATUS_VARIANTS[child.status] ?? 'gray'} 
                      />
                      {child.group && (
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{child.group.name}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground font-medium mt-2">
                      {formatAge(child.birthDate)}
                      {child.guardians && child.guardians.length > 0 && (
                        <> · {child.guardians.slice(0, 2).map((g: any) => g.guardian.fullName.split(' ')[0]).join(', ')}</>
                      )}
                    </p>
                  </div>
                  <ChevronRight size={20} className="text-muted-foreground shrink-0" />
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
