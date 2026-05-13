import Link from 'next/link'
import { Plus, Search, Baby, ChevronRight } from 'lucide-react'
import { prisma } from '@mundo-magico/database'
import { CHILD_STATUS_COLORS, CHILD_STATUS_LABELS, SHIFT_LABELS } from '@mundo-magico/types'
import { differenceInMonths, differenceInYears } from 'date-fns'
import { requireAuth } from '@/lib/auth'
import { Avatar } from '@/components/ui/index'

function formatAge(birthDate: Date): string {
  const now = new Date()
  const years = differenceInYears(now, birthDate)
  const months = differenceInMonths(now, birthDate) % 12
  if (years === 0) return `${months}m`
  if (months === 0) return `${years}a`
  return `${years}a ${months}m`
}

const STATUS_BADGE: Record<string, string> = {
  ATIVO:            'badge-green',
  ADAPTACAO:        'badge-amber',
  AGUARDANDO_VAGA:  'badge-blue',
  INATIVO:          'badge-gray',
}

const SHIFT_BADGE: Record<string, string> = {
  MANHA:    'bg-sky-50 text-sky-700',
  TARDE:    'bg-violet-50 text-violet-700',
  INTEGRAL: 'bg-lime-50 text-lime-700',
  NOTURNO:  'bg-gray-100 text-gray-600',
}

export default async function ChildrenPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; groupId?: string; shift?: string }
}) {
  const user = await requireAuth()
  const { q, status, groupId, shift } = searchParams

  const [children, groups] = await Promise.all([
    prisma.child.findMany({
      where: {
        schoolId: user.schoolId,
        ...(q ? { fullName: { contains: q, mode: 'insensitive' } } : {}),
        ...(status ? { status } : {}),
        ...(groupId ? { groupId } : {}),
        ...(shift ? { shift } : {}),
      },
      include: {
        group: true,
        guardians: { include: { guardian: true }, where: { isPrimary: true }, take: 1 },
      },
      orderBy: { fullName: 'asc' },
    }),
    prisma.group.findMany({ where: { schoolId: user.schoolId, active: true }, orderBy: { name: 'asc' } }),
  ])

  const counts = {
    ATIVO:            children.filter((c) => c.status === 'ATIVO').length,
    ADAPTACAO:        children.filter((c) => c.status === 'ADAPTACAO').length,
    AGUARDANDO_VAGA:  children.filter((c) => c.status === 'AGUARDANDO_VAGA').length,
  }

  return (
    <div className="page animate-in">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Crianças</h1>
          <p className="page-subtitle">{children.length} aluno{children.length !== 1 ? 's' : ''} cadastrado{children.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/admin/children/new" className="btn-primary gap-2">
          <Plus size={16} />
          Nova criança
        </Link>
      </div>

      {/* ── Summary badges ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Ativas',          value: counts.ATIVO,           cls: 'text-emerald-700 bg-emerald-50 border-emerald-100' },
          { label: 'Adaptação',       value: counts.ADAPTACAO,       cls: 'text-amber-700 bg-amber-50 border-amber-100' },
          { label: 'Ag. Vaga',        value: counts.AGUARDANDO_VAGA, cls: 'text-blue-700 bg-blue-50 border-blue-100' },
        ].map((s, i) => (
          <div key={i} className={`border rounded-2xl p-4 flex items-center gap-3 ${s.cls}`}>
            <Baby size={20} className="shrink-0" />
            <div>
              <p className="text-xl font-black leading-none">{s.value}</p>
              <p className="text-[10px] font-black uppercase tracking-wider mt-0.5 opacity-70">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <div className="card p-4">
        <form className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input
              name="q"
              defaultValue={q}
              placeholder="Buscar por nome..."
              className="input pl-10"
            />
          </div>
          <select name="status" defaultValue={status} className="select min-w-[160px]">
            <option value="">Todos os status</option>
            <option value="ATIVO">Ativo</option>
            <option value="ADAPTACAO">Em adaptação</option>
            <option value="AGUARDANDO_VAGA">Aguardando vaga</option>
            <option value="INATIVO">Inativo</option>
          </select>
          <select name="groupId" defaultValue={groupId} className="select min-w-[160px]">
            <option value="">Todas as turmas</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          <select name="shift" defaultValue={shift} className="select min-w-[140px]">
            <option value="">Turno</option>
            <option value="MANHA">Manhã</option>
            <option value="TARDE">Tarde</option>
            <option value="INTEGRAL">Integral</option>
          </select>
          <button type="submit" className="btn-primary gap-1.5">
            <Search size={14} />
            Filtrar
          </button>
          {(q || status || groupId || shift) && (
            <Link href="/admin/children" className="btn-secondary">
              Limpar
            </Link>
          )}
        </form>
      </div>

      {/* ── Empty state ─────────────────────────────────────────────────── */}
      {children.length === 0 && (
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 mb-4">
            <Baby size={32} />
          </div>
          <p className="font-black text-gray-700 text-lg mb-1">Nenhuma criança encontrada</p>
          <p className="text-sm text-gray-400 mb-6">Tente ajustar os filtros ou cadastre uma nova criança</p>
          <Link href="/admin/children/new" className="btn-primary gap-2">
            <Plus size={16} /> Cadastrar criança
          </Link>
        </div>
      )}

      {/* ── Mobile cards ────────────────────────────────────────────────── */}
      {children.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:hidden">
            {children.map((child) => {
              const guardian = child.guardians[0]?.guardian
              const shiftKey = child.shift as keyof typeof SHIFT_LABELS
              return (
                <Link
                  key={child.id}
                  href={`/admin/children/${child.id}`}
                  className="card-interactive p-4 flex items-center gap-3"
                >
                  <Avatar name={child.fullName} photoUrl={child.photoUrl} size="lg" />
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-gray-900 truncate text-sm">{child.fullName}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      <span className={`badge ${STATUS_BADGE[child.status] ?? 'badge-gray'}`}>
                        {CHILD_STATUS_LABELS[child.status as keyof typeof CHILD_STATUS_LABELS] ?? child.status}
                      </span>
                      {child.group && (
                        <span className="text-[10px] font-bold text-gray-400">{child.group.name}</span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 font-medium mt-1">
                      {formatAge(new Date(child.birthDate))}
                      {guardian ? ` · ${guardian.fullName.split(' ')[0]}` : ''}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 shrink-0" />
                </Link>
              )
            })}
          </div>

          {/* ── Desktop table ───────────────────────────────────────────── */}
          <div className="hidden md:block table-container">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="table-header rounded-tl-2xl">Criança</th>
                  <th className="table-header">Turma & Idade</th>
                  <th className="table-header">Turno</th>
                  <th className="table-header">Responsável</th>
                  <th className="table-header">Status</th>
                  <th className="table-header rounded-tr-2xl w-12" />
                </tr>
              </thead>
              <tbody>
                {children.map((child, idx) => {
                  const guardian = child.guardians[0]?.guardian
                  return (
                    <tr
                      key={child.id}
                      className={`table-row ${idx === children.length - 1 ? 'border-b-0' : ''}`}
                    >
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          <Avatar name={child.fullName} photoUrl={child.photoUrl} size="md" />
                          <div>
                            <p className="font-black text-gray-900 text-sm">{child.fullName}</p>
                            {child.nickname && (
                              <p className="text-[10px] text-gray-400 font-medium mt-0.5">"{child.nickname}"</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <p className="text-sm font-bold text-gray-700">{child.group?.name ?? '—'}</p>
                        <p className="text-[11px] text-gray-400 font-medium mt-0.5">{formatAge(new Date(child.birthDate))}</p>
                      </td>
                      <td className="table-cell">
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg ${SHIFT_BADGE[child.shift] ?? 'bg-gray-100 text-gray-600'}`}>
                          {SHIFT_LABELS[child.shift as keyof typeof SHIFT_LABELS] ?? child.shift}
                        </span>
                      </td>
                      <td className="table-cell">
                        {guardian ? (
                          <div>
                            <p className="text-sm font-bold text-gray-800">{guardian.fullName.split(' ')[0]}</p>
                            {guardian.phone && (
                              <p className="text-[11px] text-gray-400 font-medium mt-0.5">{guardian.phone}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300 italic">Não cadastrado</span>
                        )}
                      </td>
                      <td className="table-cell">
                        <span className={`badge ${STATUS_BADGE[child.status] ?? 'badge-gray'}`}>
                          {CHILD_STATUS_LABELS[child.status as keyof typeof CHILD_STATUS_LABELS] ?? child.status}
                        </span>
                      </td>
                      <td className="table-cell pr-4">
                        <Link
                          href={`/admin/children/${child.id}`}
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-lime-600 hover:bg-lime-50 transition-all"
                        >
                          <ChevronRight size={16} />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
