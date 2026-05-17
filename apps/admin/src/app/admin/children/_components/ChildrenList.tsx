'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Search, Baby, ChevronRight, X, Trash2, CreditCard, ShieldAlert } from 'lucide-react'
import { CHILD_STATUS_LABELS, SHIFT_LABELS } from '@mundo-magico/types'
import { differenceInMonths, differenceInYears } from 'date-fns'
import { Avatar, PageHeader, EmptyState, Badge } from '@/components/ui'
import toast from 'react-hot-toast'

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
  ATIVO:              'green',
  ADAPTACAO:          'amber',
  AGUARDANDO_VAGA:    'blue',
  PENDENTE_PAGAMENTO: 'rose',
  INATIVO:            'gray',
  CANCELADO:          'red',
}

const SHIFT_BADGE: Record<string, string> = {
  MANHA:    'bg-sky-500/10 text-sky-600 border-sky-500/20',
  TARDE:    'bg-violet-500/10 text-violet-600 border-violet-500/20',
  INTEGRAL: 'bg-lime-500/10 text-lime-600 border-lime-500/20',
  NOTURNO:  'bg-muted text-muted-foreground border-border',
}

interface Group {
  id: string
  name: string
  shift: string
}

interface ChildrenListProps {
  initialChildren: any[]
  initialGroups: Group[]
}

type TabType = 'TODOS' | 'ATIVO' | 'ADAPTACAO' | 'AGUARDANDO_VAGA' | 'PENDENTE_PAGAMENTO' | 'INATIVO'

export function ChildrenList({ initialChildren, initialGroups }: ChildrenListProps) {
  const router = useRouter()
  const [children, setChildren] = useState<any[]>(initialChildren)
  const [activeTab, setActiveTab] = useState<TabType>('TODOS')
  const [searchQuery, setSearchQuery] = useState('')
  const [groupFilter, setGroupFilter] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [bulkDeleting, setBulkDeleting] = useState(false)

  // Status counters
  const counts = {
    TODOS:              children.length,
    ATIVO:              children.filter((c) => c.status === 'ATIVO').length,
    ADAPTACAO:          children.filter((c) => c.status === 'ADAPTACAO').length,
    AGUARDANDO_VAGA:    children.filter((c) => c.status === 'AGUARDANDO_VAGA').length,
    PENDENTE_PAGAMENTO: children.filter((c) => c.status === 'PENDENTE_PAGAMENTO').length,
    INATIVO:            children.filter((c) => c.status === 'INATIVO' || c.status === 'CANCELADO').length,
  }

  // Deletar criança individualmente
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza absoluta que deseja excluir a criança "${name}"? Todos os diários, fotos, relatórios de desenvolvimento e registros vinculados serão excluídos permanentemente.`)) {
      return
    }

    setDeletingId(id)
    try {
      const res = await fetch(`/api/children/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('Falha ao excluir a criança')
      }

      // Remover do estado imediatamente com animação
      setChildren((prev) => prev.filter((c) => c.id !== id))
      toast.success(`${name} foi excluído com sucesso!`)
      router.refresh()
    } catch (err) {
      toast.error('Erro ao excluir. Tente novamente.')
      console.error(err)
    } finally {
      setDeletingId(null)
    }
  }

  // Excluir em lote (Limpeza / Remarketing)
  const handleBulkDelete = async () => {
    const listToDelete = filteredChildren.filter((c) => c.status === 'INATIVO' || c.status === 'CANCELADO' || c.status === 'PENDENTE_PAGAMENTO')
    if (listToDelete.length === 0) return

    const label = activeTab === 'PENDENTE_PAGAMENTO' ? 'inadimplentes / pendentes de pagamento' : 'inativas / canceladas'

    if (!confirm(`ATENÇÃO CRÍTICA: Você deseja excluir TODAS as ${listToDelete.length} crianças ${label} filtradas na lista atual? Esta ação é irreversível!`)) {
      return
    }

    setBulkDeleting(true)
    let successCount = 0

    try {
      for (const child of listToDelete) {
        const res = await fetch(`/api/children/${child.id}`, { method: 'DELETE' })
        if (res.ok) {
          successCount++
        }
      }

      setChildren((prev) => prev.filter((c) => !listToDelete.some((item) => item.id === c.id)))
      toast.success(`${successCount} crianças foram excluídas com sucesso!`)
      router.refresh()
    } catch (err) {
      toast.error('Ocorreu um erro durante a exclusão em lote.')
      console.error(err)
    } finally {
      setBulkDeleting(false)
    }
  }

  // Filtragem local
  const filteredChildren = children.filter((child) => {
    // 1. Filtro por Abas de Status
    if (activeTab === 'ATIVO' && child.status !== 'ATIVO') return false
    if (activeTab === 'ADAPTACAO' && child.status !== 'ADAPTACAO') return false
    if (activeTab === 'AGUARDANDO_VAGA' && child.status !== 'AGUARDANDO_VAGA') return false
    if (activeTab === 'PENDENTE_PAGAMENTO' && child.status !== 'PENDENTE_PAGAMENTO') return false
    if (activeTab === 'INATIVO' && child.status !== 'INATIVO' && child.status !== 'CANCELADO') return false

    // 2. Filtro por busca
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const matchesName = (child.fullName || '').toLowerCase().includes(q)
      const matchesNickname = (child.nickname || '').toLowerCase().includes(q)
      const matchesGuardian = child.guardians?.some((g: any) =>
        (g.guardian?.fullName || '').toLowerCase().includes(q)
      )
      if (!matchesName && !matchesNickname && !matchesGuardian) return false
    }

    // 3. Filtro por turma
    if (groupFilter && child.groupId !== groupFilter) return false

    return true
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Crianças"
        subtitle={`${counts.ATIVO} criança${counts.ATIVO !== 1 ? 's' : ''} ativa${counts.ATIVO !== 1 ? 's' : ''} | ${counts.TODOS} no total`}
        icon={<Baby size={24} />}
        actions={
          <Link href="/admin/children/new" className="btn-primary">
            <Plus size={18} /> Nova criança
          </Link>
        }
      />

      {/* Aesthetic Status Pills Tabs */}
      <div className="flex gap-1.5 border-b border-border overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 pb-px">
        {([
          { id: 'TODOS',              label: 'Todos',                   count: counts.TODOS,              color: 'text-muted-foreground border-transparent hover:text-foreground' },
          { id: 'ATIVO',              label: 'Ativas',                  count: counts.ATIVO,              color: 'text-emerald-500 border-emerald-500/10 hover:bg-emerald-500/5' },
          { id: 'ADAPTACAO',          label: 'Em Adaptação',            count: counts.ADAPTACAO,          color: 'text-amber-500 border-amber-500/10 hover:bg-amber-500/5' },
          { id: 'AGUARDANDO_VAGA',    label: 'Aguardando Vaga',         count: counts.AGUARDANDO_VAGA,    color: 'text-blue-500 border-blue-500/10 hover:bg-blue-500/5' },
          { id: 'PENDENTE_PAGAMENTO', label: 'Pendente de Pagamento',   count: counts.PENDENTE_PAGAMENTO, color: 'text-rose-500 border-rose-500/10 hover:bg-rose-500/5' },
          { id: 'INATIVO',            label: 'Inativas / Canceladas',   count: counts.INATIVO,            color: 'text-gray-400 border-gray-400/10 hover:bg-gray-400/5' },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-[10px] sm:text-xs font-black uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-primary text-primary bg-primary/5'
                : tab.color
            }`}
          >
            <span>{tab.label}</span>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Ativas',          value: counts.ATIVO,           variant: 'green' },
          { label: 'Pendente Pagamento', value: counts.PENDENTE_PAGAMENTO, variant: 'rose' },
          { label: 'Aguardando Vaga', value: counts.AGUARDANDO_VAGA, variant: 'blue' },
        ].map((s, i) => (
          <div key={i} className="card p-5 flex items-center justify-between group overflow-hidden relative">
            <div className="relative z-10">
              <p className="text-3xl font-black text-foreground tracking-tight">{s.value}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">{s.label}</p>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              s.variant === 'green' ? 'bg-emerald-500/10 text-emerald-500' : 
              s.variant === 'rose' ? 'bg-rose-500/10 text-rose-500' : 
              'bg-blue-500/10 text-blue-500'
            }`}>
              {s.variant === 'rose' ? <CreditCard size={24} /> : <Baby size={24} />}
            </div>
          </div>
        ))}
      </div>

      {/* Filters & Actions */}
      <div className="card p-5">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 flex-1">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nome ou responsável..."
                className="input pl-10"
              />
            </div>
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="select"
            >
              <option value="">Todas as Turmas</option>
              {initialGroups.map((g: any) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              {(searchQuery || groupFilter) && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setGroupFilter('')
                  }}
                  className="btn-secondary px-3.5"
                  title="Limpar filtros"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Remarketing / Bulk Delete Button */}
          {(activeTab === 'INATIVO' || activeTab === 'PENDENTE_PAGAMENTO') && filteredChildren.length > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="btn bg-rose-500/10 border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white inline-flex items-center justify-center gap-2 whitespace-nowrap self-start lg:self-auto px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all"
            >
              <Trash2 size={16} />
              {bulkDeleting ? 'Excluindo...' : activeTab === 'PENDENTE_PAGAMENTO' ? 'Excluir Todos Pendentes' : 'Excluir Todos Inativos'}
            </button>
          )}
        </div>
      </div>

      {filteredChildren.length === 0 ? (
        <EmptyState
          icon={<Baby size={32} />}
          title="Nenhuma criança encontrada"
          description="Tente ajustar os filtros ou cadastrar uma nova criança."
          action={
            <Link href="/admin/children/new" className="btn-primary">
              <Plus size={16} /> Cadastrar criança
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {/* Table Container */}
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
                {filteredChildren.map((child: any) => {
                  return (
                    <tr key={child.id} className="table-row group">
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
                              {child.guardians.slice(0, 2).map((g: any) => (g.guardian?.fullName || '').split(' ')[0]).join(', ')}
                              {child.guardians.length > 2 && ` +${child.guardians.length - 2}`}
                            </p>
                            {child.guardians[0].guardian?.phone && (
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
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleDelete(child.id, child.fullName)}
                            disabled={deletingId === child.id}
                            className="btn-ghost text-muted-foreground hover:text-rose-500 hover:bg-rose-500/5 p-2 rounded-xl transition-all"
                            title="Excluir criança"
                          >
                            <Trash2 size={16} />
                          </button>
                          <Link
                            href={`/admin/children/${child.id}`}
                            className="btn-ghost p-2 rounded-xl inline-flex text-muted-foreground hover:text-foreground hover:bg-accent/50"
                          >
                            <ChevronRight size={18} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
            {filteredChildren.map((child: any) => {
              return (
                <div
                  key={child.id}
                  className="card p-5 space-y-4 relative overflow-hidden"
                >
                  <div className="flex items-center gap-4">
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
                      <p className="text-xs text-muted-foreground font-medium mt-1">
                        {formatAge(child.birthDate)}
                      </p>
                    </div>
                  </div>

                  {child.guardians && child.guardians.length > 0 && (
                    <div className="border-t border-border/50 pt-3">
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Responsável</p>
                      <p className="text-xs font-bold text-foreground mt-0.5">
                        {child.guardians.map((g: any) => g.guardian?.fullName).join(', ')}
                      </p>
                      {child.guardians[0].guardian?.phone && (
                        <p className="text-xs text-muted-foreground mt-0.5">{child.guardians[0].guardian.phone}</p>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-border/50">
                    <button
                      onClick={() => handleDelete(child.id, child.fullName)}
                      disabled={deletingId === child.id}
                      className="btn bg-rose-500/5 hover:bg-rose-500/10 text-rose-500 border-none font-bold text-[10px] uppercase tracking-wider px-3.5 py-1.5 rounded-xl"
                    >
                      Excluir
                    </button>
                    <Link
                      href={`/admin/children/${child.id}`}
                      className="btn-primary font-bold text-[10px] uppercase tracking-wider px-3.5 py-1.5 rounded-xl inline-flex items-center gap-1"
                    >
                      Editar <ChevronRight size={12} />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
