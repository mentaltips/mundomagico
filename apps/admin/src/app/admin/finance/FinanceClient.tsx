'use client'

import { useState, useEffect, Suspense, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CreditCard, TrendingUp, DollarSign, Plus, X, Check, Loader2,
  Clock, CheckCircle2, AlertCircle, Barcode, QrCode, Printer,
  RefreshCw, Users, Banknote, Trash2, Search, Filter, ChevronRight
} from 'lucide-react'
import { format, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { Modal, EmptyState, Badge, Skeleton, Avatar, PageHeader, StatCard, Alert } from '@/components/ui'
import { getErrorMessage } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────
type Invoice = {
  id: string
  description: string
  amount: number
  dueDate: string
  status: 'PENDENTE' | 'PAGO' | 'VENCIDO' | 'CANCELADO'
  referenceMonth?: string
  boletoUrl?: string
  pixCopyPaste?: string
  checkoutUrl?: string
  paidAt?: string
  child?: { id: string; fullName: string; photoUrl?: string }
  student?: { id: string; fullName: string; photoUrl?: string }
}

const STATUS_CONFIG: Record<string, { label: string; variant: any; icon: any }> = {
  PENDENTE:  { label: 'Pendente',  variant: 'amber', icon: Clock },
  PAGO:      { label: 'Pago',      variant: 'green', icon: CheckCircle2 },
  VENCIDO:   { label: 'Vencido',   variant: 'red',   icon: AlertCircle },
  CANCELADO: { label: 'Cancelado', variant: 'gray',  icon: X },
}

const FILTERS = [
  { value: '',          label: 'Todas' },
  { value: 'PENDENTE',  label: 'Pendentes' },
  { value: 'PAGO',      label: 'Pagas' },
  { value: 'VENCIDO',   label: 'Vencidas' },
  { value: 'CANCELADO', label: 'Canceladas' },
]

const fmtBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const QUICK_CHARGES = [
  { label: 'Diária Meio Período', amount: '50', kind: 'EXTRA', color: 'orange' },
  { label: 'Diária Integral', amount: '70', kind: 'EXTRA', color: 'sky' },
  { label: 'Pacote Mensal Integral', amount: '850', kind: 'MONTHLY', color: 'violet' },
  { label: 'Pacote Mensal Meio Período', amount: '550', kind: 'MONTHLY', color: 'green' },
] as const

const QUICK_CHARGE_STYLES = {
  orange: 'border-orange-200 bg-orange-50 text-orange-600',
  sky: 'border-sky-200 bg-sky-50 text-sky-600',
  violet: 'border-violet-200 bg-violet-50 text-violet-600',
  green: 'border-green-200 bg-green-50 text-green-600',
}

// ── Component ─────────────────────────────────────────────────────────────────
// ── Main Page Wrapper ─────────────────────────────────────────────────────────
export default function FinanceClient() {
  return (
    <Suspense fallback={<div className="p-10 animate-pulse text-center">Carregando módulo financeiro...</div>}>
      <FinancePageContent />
    </Suspense>
  )
}

function FinancePageContent() {
  const searchParams = useSearchParams()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [children, setChildren] = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') ?? '')
  const [showModal, setShowModal]       = useState(false)
  const [showBatchModal, setShowBatchModal] = useState(false)

  const [form, setForm] = useState({
    childId: '', guardianId: '', description: '',
    amount: '', dueDate: format(addDays(new Date(), 10), 'yyyy-MM-dd'),
    referenceMonth: format(new Date(), 'yyyy-MM'),
    invoiceKind: 'MONTHLY',
    boletoUrl: '', boletoBarcode: '',
  })

  const [batch, setBatch] = useState({
    description: `Mensalidade ${format(new Date(), 'MMMM/yyyy', { locale: ptBR })}`,
    amount: '', dueDate: format(addDays(new Date(), 10), 'yyyy-MM-dd'),
    referenceMonth: format(new Date(), 'yyyy-MM'),
    selectedIds: [] as string[],
  })

  const fetchInvoices = useCallback(async () => {
    setLoading(true)
    try {
      const url = filterStatus ? `/api/finance/invoices?status=${filterStatus}` : '/api/finance/invoices'
      const res = await fetch(url)
      if (res.ok) setInvoices(await res.json())
    } catch { toast.error('Erro ao carregar faturas') }
    finally { setLoading(false) }
  }, [filterStatus])

  const fetchChildren = async () => {
    const res = await fetch('/api/children')
    if (res.ok) setChildren(await res.json())
  }

  useEffect(() => { fetchInvoices() }, [fetchInvoices])
  useEffect(() => { fetchChildren() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.childId || !form.description || !form.amount) {
      toast.error('Preencha todos os campos obrigatórios'); return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/finance/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId: form.childId,
          ...(form.guardianId && { guardianId: form.guardianId }),
          description: form.description,
          amount: parseFloat(form.amount),
          dueDate: form.dueDate,
          referenceMonth: form.invoiceKind === 'EXTRA' ? null : form.referenceMonth,
          ...(form.boletoUrl && { boletoUrl: form.boletoUrl }),
          ...(form.boletoBarcode && { boletoBarcode: form.boletoBarcode }),
        }),
      })
      const data = await res.json().catch(() => null)
      if (res.ok) {
        toast.success('Fatura criada!')
        setShowModal(false)
        setForm({ 
          childId: '', guardianId: '', description: '', amount: '', 
          dueDate: format(addDays(new Date(), 10), 'yyyy-MM-dd'),
          referenceMonth: format(new Date(), 'yyyy-MM'),
          invoiceKind: 'MONTHLY',
          boletoUrl: '', boletoBarcode: '' 
        })
        fetchInvoices()
      } else toast.error(getErrorMessage(data, 'Erro ao criar fatura'))
    } catch { toast.error('Erro ao criar fatura') }
    finally { setSaving(false) }
  }

  const handleBatch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!batch.amount || batch.selectedIds.length === 0) {
      toast.error('Selecione alunos e informe o valor'); return
    }
    setSaving(true)
    try {
      const payload = batch.selectedIds.map(id => {
        const child = children.find(c => c.id === id)
        return {
          childId: id,
          guardianId: child?.guardians?.[0]?.guardianId || '',
          description: batch.description,
          amount: parseFloat(batch.amount),
          dueDate: batch.dueDate,
          referenceMonth: batch.referenceMonth,
        }
      })
      const res = await fetch('/api/finance/invoices', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const result = await res.json()
        const created = result.filter((r: any) => !r.skipped).length
        const skipped = result.filter((r: any) => r.skipped).length
        toast.success(`${created} fatura(s) criada(s)${skipped ? `, ${skipped} já existia(m)` : ''}`)
        setShowBatchModal(false)
        fetchInvoices()
      } else toast.error('Erro ao gerar cobranças')
    } catch { toast.error('Erro ao gerar cobranças') }
    finally { setSaving(false) }
  }

  const handleCancel = async (id: string) => {
    if (!confirm('Deseja realmente cancelar esta fatura?')) return
    try {
      const res = await fetch(`/api/finance/invoices/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELADO' }),
      })
      if (res.ok) {
        toast.success('Fatura cancelada!')
        fetchInvoices()
      } else toast.error('Erro ao cancelar')
    } catch { toast.error('Erro ao cancelar') }
  }

  const handleMarkAsPaid = async (id: string) => {
    if (!confirm('Deseja marcar esta fatura como PAGA manualmente?')) return
    try {
      const res = await fetch(`/api/finance/invoices/${id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: 'MANUAL' }),
      })
      if (res.ok) {
        toast.success('Fatura marcada como paga!')
        fetchInvoices()
      } else toast.error('Erro ao processar baixa')
    } catch { toast.error('Erro ao processar baixa') }
  }

  const handleGeneratePayment = async (id: string, method: 'PIX' | 'BOLETO') => {
    const toastId = toast.loading(`Gerando ${method} no Mercado Pago...`)
    try {
      const res = await fetch(`/api/finance/invoices/${id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method }),
      })
      if (res.ok) {
        toast.success(`${method} gerado com sucesso!`, { id: toastId })
        fetchInvoices()
      } else {
        const d = await res.json()
        toast.error(d.error || `Erro ao gerar ${method}`, { id: toastId })
      }
    } catch { toast.error(`Erro ao gerar ${method}`, { id: toastId }) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir permanentemente esta fatura?')) return
    try {
      const res = await fetch(`/api/finance/invoices/${id}`, { method: 'DELETE' })
      if (res.ok || res.status === 404) {
        // 204 = deletado agora | 404 = já havia sido deletado antes
        toast.success('Fatura excluída!')
        fetchInvoices()
      } else {
        let msg = 'Erro ao excluir'
        try { const d = await res.json(); msg = d.error || msg } catch {}
        toast.error(msg)
      }
    } catch { toast.error('Erro ao excluir') }
  }

  const now = new Date()
  const totalPaid    = invoices.filter(i => i.status === 'PAGO').reduce((s, i) => s + i.amount, 0)
  const totalPending = invoices.filter(i => i.status === 'PENDENTE').reduce((s, i) => s + i.amount, 0)
  const totalOverdue = invoices.filter(i => i.status === 'PENDENTE' && new Date(i.dueDate) < now).reduce((s, i) => s + i.amount, 0)
  const studentName  = (inv: Invoice) => inv.child?.fullName || inv.student?.fullName || '—'

  return (
    <div className="page animate-in">
      <PageHeader 
        title="Financeiro" 
        subtitle="Gerencie faturas, mensalidades e pagamentos da escola."
        icon={<Banknote size={24} />}
        actions={
          <div className="flex gap-2">
            <button onClick={() => setShowBatchModal(true)} className="btn-secondary hidden sm:flex">
              <Users size={18} /> Lote
            </button>
            <button onClick={() => setShowModal(true)} className="btn-primary">
              <Plus size={18} /> <span className="hidden sm:inline">Nova Fatura</span>
            </button>
          </div>
        }
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard 
          label="Recebido" 
          value={fmtBRL(totalPaid)} 
          icon={<CheckCircle2 size={20} />} 
          color="text-emerald-500 bg-emerald-500/10" 
          trend={`${invoices.filter(i => i.status === 'PAGO').length} pagas`}
        />
        <StatCard 
          label="A Receber" 
          value={fmtBRL(totalPending)} 
          icon={<Clock size={20} />} 
          color="text-amber-500 bg-amber-500/10" 
          trend={`${invoices.filter(i => i.status === 'PENDENTE').length} abertas`}
        />
        <StatCard 
          label="Vencido" 
          value={fmtBRL(totalOverdue)} 
          icon={<AlertCircle size={20} />} 
          color="text-rose-500 bg-rose-500/10" 
          trend={`${invoices.filter(i => i.status === 'VENCIDO').length} vencidas`}
          trendUp={false}
        />
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative group flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Buscar por aluno ou descrição..."
            className="input pl-12 w-full bg-accent/30 border-transparent focus:bg-accent/50 focus:border-primary/30 h-14 text-sm font-bold"
            // Filter is currently handled by status, but we can add local filtering if needed
          />
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar sm:pb-0">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilterStatus(f.value)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap h-14 min-w-[100px] transition-all border ${
                filterStatus === f.value
                  ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20'
                  : 'bg-card text-muted-foreground border-border hover:border-primary/50'
              }`}
            >
              {f.label}
            </button>
          ))}
          <button
            onClick={fetchInvoices}
            className="w-14 h-14 bg-card text-muted-foreground border border-border rounded-xl flex items-center justify-center p-0 shrink-0 hover:border-primary/50 transition-colors"
            title="Atualizar"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : invoices.length === 0 ? (
        <EmptyState 
          icon={<Banknote size={32} />}
          title="Nenhuma fatura encontrada"
          description="Você ainda não gerou nenhuma cobrança para o filtro selecionado."
          action={
            <button onClick={() => setShowModal(true)} className="btn-primary">
              Criar Primeira Fatura
            </button>
          }
        />
      ) : (
        <div className="table-container">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="table-header">Aluno</th>
                <th className="table-header hidden md:table-cell">Descrição</th>
                <th className="table-header">Valor</th>
                <th className="table-header hidden sm:table-cell">Vencimento</th>
                <th className="table-header">Status</th>
                <th className="table-header text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => {
                const config = STATUS_CONFIG[inv.status] || STATUS_CONFIG.PENDENTE
                const name = studentName(inv)
                return (
                  <tr key={inv.id} className="table-row group">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <Avatar name={name} photoUrl={inv.child?.photoUrl} size="sm" />
                        <div className="min-w-0">
                          <p className="font-black text-foreground truncate">{name}</p>
                          <p className="text-[10px] text-muted-foreground font-medium md:hidden truncate">{inv.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell hidden md:table-cell">
                      <p className="text-sm text-muted-foreground font-medium truncate max-w-xs">{inv.description}</p>
                    </td>
                    <td className="table-cell">
                      <p className="font-black text-foreground">{fmtBRL(inv.amount)}</p>
                    </td>
                    <td className="table-cell hidden sm:table-cell">
                      <p className="text-xs font-bold text-muted-foreground">
                        {format(new Date(inv.dueDate), 'dd/MM/yyyy')}
                      </p>
                    </td>
                    <td className="table-cell">
                      <Badge 
                        label={config.label} 
                        variant={config.variant} 
                        dot={inv.status === 'PENDENTE'}
                      />
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-2 pr-2">
                        {inv.status === 'PENDENTE' && (
                          <>
                            <button onClick={() => handleGeneratePayment(inv.id, 'PIX')} className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-colors" title="Gerar PIX no Mercado Pago">
                              <QrCode size={16} />
                            </button>
                            <button onClick={() => handleGeneratePayment(inv.id, 'BOLETO')} className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-colors" title="Gerar Boleto no Mercado Pago">
                              <Barcode size={16} />
                            </button>
                            <button onClick={() => handleMarkAsPaid(inv.id)} className="p-2 text-emerald-600 hover:bg-emerald-500/10 rounded-xl transition-colors" title="Baixa Manual">
                              <CheckCircle2 size={16} />
                            </button>
                            <button onClick={() => handleCancel(inv.id)} className="p-2 text-amber-500 hover:bg-amber-500/10 rounded-xl transition-colors" title="Cancelar">
                              <X size={16} />
                            </button>
                          </>
                        )}
                        {inv.status !== 'PAGO' && (
                          <button onClick={() => handleDelete(inv.id)} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors" title="Excluir">
                            <Trash2 size={16} />
                          </button>
                        )}
                        {inv.boletoUrl && (
                          <a href={inv.boletoUrl} target="_blank" rel="noreferrer" className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-colors" title="Boleto">
                            <Barcode size={16} />
                          </a>
                        )}
                        {inv.pixCopyPaste && (
                          <button onClick={() => { navigator.clipboard.writeText(inv.pixCopyPaste!); toast.success('PIX copiado!') }} className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-colors" title="Copiar PIX">
                            <QrCode size={16} />
                          </button>
                        )}
                        <a 
                          href={`/admin/finance/invoice/${inv.id}/print`} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-xl transition-colors" 
                          title="Imprimir Recibo/Boleto"
                        >
                          <Printer size={16} />
                        </a>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Nova Fatura */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Nova Fatura"
        subtitle="Crie uma cobrança individual para um aluno."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="label">Aluno *</label>
            <select 
              value={form.childId} 
              onChange={e => {
                const childId = e.target.value
                const child = children.find(c => c.id === childId)
                const firstGuardianId = child?.guardians?.[0]?.guardianId || ''
                setForm(p => ({ ...p, childId, guardianId: firstGuardianId }))
              }} 
              className="select"
            >
              <option value="">Selecione o aluno...</option>
              {children.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
            </select>
          </div>
          {form.childId && (
            <div>
              <label className="label">Responsável Financeiro *</label>
              <select 
                value={form.guardianId} 
                onChange={e => setForm(p => ({ ...p, guardianId: e.target.value }))} 
                className="select"
              >
                <option value="">Selecione o responsável...</option>
                {children.find(c => c.id === form.childId)?.guardians?.map((g: any) => (
                  <option key={g.guardianId} value={g.guardianId}>{g.guardian.fullName}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="label">Tipo de cobranca</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setForm(p => ({ ...p, invoiceKind: 'MONTHLY' }))}
                className={`rounded-3xl border-2 p-4 text-left transition-all ${
                  form.invoiceKind === 'MONTHLY'
                    ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
                    : 'border-border bg-card hover:border-primary/30'
                }`}
              >
                <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <CreditCard size={18} />
                </span>
                <span className="block text-sm font-black text-foreground">Mensalidade</span>
                <span className="mt-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Uma por mes
                </span>
              </button>
              <button
                type="button"
                onClick={() => setForm(p => ({ ...p, invoiceKind: 'EXTRA' }))}
                className={`rounded-3xl border-2 p-4 text-left transition-all ${
                  form.invoiceKind === 'EXTRA'
                    ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10'
                    : 'border-border bg-card hover:border-amber-500/30'
                }`}
              >
                <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
                  <Plus size={18} />
                </span>
                <span className="block text-sm font-black text-foreground">Encargo avulso</span>
                <span className="mt-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Evento, diaria, item
                </span>
              </button>
            </div>
          </div>
          <div>
            <label className="label">Descrição *</label>
            <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {QUICK_CHARGES.map(charge => (
                <button
                  key={charge.label}
                  type="button"
                  onClick={() => setForm(p => ({
                    ...p,
                    invoiceKind: charge.kind,
                    description: charge.label,
                    amount: charge.amount,
                  }))}
                  className={`rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md ${QUICK_CHARGE_STYLES[charge.color]}`}
                >
                  <span className="block text-[10px] font-black uppercase tracking-widest opacity-80">
                    {charge.kind === 'EXTRA' ? 'Avulso' : 'Mensal'}
                  </span>
                  <span className="mt-1 block text-sm font-black text-foreground">{charge.label}</span>
                  <span className="mt-2 block text-lg font-black">{fmtBRL(Number(charge.amount))}</span>
                </button>
              ))}
            </div>
            <input type="text" placeholder={form.invoiceKind === 'EXTRA' ? 'Ex: Uniforme, material, passeio' : 'Ex: Mensalidade Junho/2025'}
              value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              className="input" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Valor (R$) *</label>
              <input type="number" min="0.01" step="0.01" placeholder="0,00"
                value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                className="input" />
            </div>
            <div>
              <label className="label">Vencimento</label>
              <input type="date" value={form.dueDate}
                onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} className="input" />
            </div>
          </div>
          {form.invoiceKind === 'MONTHLY' ? (
            <div>
              <label className="label">Mes de Referencia</label>
              <input type="month" value={form.referenceMonth}
                onChange={e => setForm(p => ({ ...p, referenceMonth: e.target.value }))} className="input" />
            </div>
          ) : (
            <Alert variant="info">
              Encargos avulsos nao usam mes de referencia e podem existir junto da mensalidade do aluno.
            </Alert>
          )}

          <div className="pt-4 border-t space-y-4">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Boleto Externo (Opcional)</p>
            <div className="space-y-4">
              <div>
                <label className="label">URL do Boleto (Link PDF)</label>
                <input type="url" placeholder="https://..."
                  value={form.boletoUrl} onChange={e => setForm(p => ({ ...p, boletoUrl: e.target.value }))}
                  className="input" />
              </div>
              <div>
                <label className="label">Código de Barras</label>
                <input type="text" placeholder="000000.00000..."
                  value={form.boletoBarcode} onChange={e => setForm(p => ({ ...p, boletoBarcode: e.target.value }))}
                  className="input" />
              </div>
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t">
            <button type="button" onClick={() => setShowModal(false)} className="btn-ghost" disabled={saving}>Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? <Loader2 size={16} className="animate-spin" /> : 'Criar Fatura'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Gerar em Lote */}
      <Modal
        open={showBatchModal}
        onClose={() => setShowBatchModal(false)}
        title="Gerar em Lote"
        subtitle="Crie mensalidades para múltiplos alunos de uma vez."
        size="lg"
      >
        <form onSubmit={handleBatch} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">Descrição Padrão</label>
              <input type="text" value={batch.description}
                onChange={e => setBatch(p => ({ ...p, description: e.target.value }))} className="input" />
            </div>
            <div>
              <label className="label">Valor (R$) *</label>
              <input type="number" min="0.01" step="0.01" placeholder="0,00"
                value={batch.amount} onChange={e => setBatch(p => ({ ...p, amount: e.target.value }))}
                className="input" />
            </div>
            <div>
              <label className="label">Vencimento</label>
              <input type="date" value={batch.dueDate}
                onChange={e => setBatch(p => ({ ...p, dueDate: e.target.value }))} className="input" />
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="label mb-0">Selecionar Alunos ({batch.selectedIds.length})</label>
              <button type="button" onClick={() =>
                setBatch(p => ({ ...p, selectedIds: p.selectedIds.length === children.length ? [] : children.map(c => c.id) }))
              } className="text-xs font-black text-primary hover:underline">
                {batch.selectedIds.length === children.length ? 'Desmarcar todos' : 'Selecionar todos'}
              </button>
            </div>
            <div className="max-h-60 overflow-y-auto border border-border rounded-2xl divide-y divide-border bg-accent/20">
              {children.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground italic text-sm">Nenhum aluno encontrado</div>
              ) : children.map(c => (
                <label key={c.id} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-accent/50 transition-colors">
                  <input type="checkbox" checked={batch.selectedIds.includes(c.id)}
                    onChange={e => setBatch(p => ({
                      ...p, selectedIds: e.target.checked
                        ? [...p.selectedIds, c.id]
                        : p.selectedIds.filter(id => id !== c.id)
                    }))}
                    className="w-5 h-5 accent-primary rounded-lg" />
                  <Avatar name={c.fullName} photoUrl={c.photoUrl} size="sm" />
                  <span className="text-sm font-black text-foreground">{c.fullName}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t">
            <button type="button" onClick={() => setShowBatchModal(false)} className="btn-ghost" disabled={saving}>Cancelar</button>
            <button type="submit" disabled={saving || batch.selectedIds.length === 0} className="btn-primary">
              {saving ? <Loader2 size={16} className="animate-spin" /> : `Gerar ${batch.selectedIds.length} Cobranças`}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
