'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CreditCard, TrendingUp, DollarSign, Plus, X, Check, Loader2,
  Clock, CheckCircle2, AlertCircle, Barcode, QrCode,
  RefreshCw, Users, Banknote, Trash2
} from 'lucide-react'
import { format, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { Modal, EmptyState, Badge, Skeleton, Avatar } from '@/components/ui'

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

const STATUS: Record<string, { label: string; badge: string; icon: any }> = {
  PENDENTE:  { label: 'Pendente',  badge: 'badge-amber',  icon: Clock },
  PAGO:      { label: 'Pago',      badge: 'badge-green',  icon: CheckCircle2 },
  VENCIDO:   { label: 'Vencido',   badge: 'badge-red',    icon: AlertCircle },
  CANCELADO: { label: 'Cancelado', badge: 'badge-gray',   icon: X },
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

// ── Component ─────────────────────────────────────────────────────────────────
export default function FinancePage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [children, setChildren] = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  const [showModal, setShowModal]       = useState(false)
  const [showBatchModal, setShowBatchModal] = useState(false)

  const [form, setForm] = useState({
    childId: '', description: '',
    amount: '', dueDate: format(addDays(new Date(), 10), 'yyyy-MM-dd'),
    referenceMonth: format(new Date(), 'yyyy-MM'),
  })

  const [batch, setBatch] = useState({
    description: `Mensalidade ${format(new Date(), 'MMMM/yyyy', { locale: ptBR })}`,
    amount: '', dueDate: format(addDays(new Date(), 10), 'yyyy-MM-dd'),
    referenceMonth: format(new Date(), 'yyyy-MM'),
    selectedIds: [] as string[],
  })

  const fetchInvoices = async () => {
    setLoading(true)
    try {
      const url = filterStatus ? `/api/finance/invoices?status=${filterStatus}` : '/api/finance/invoices'
      const res = await fetch(url)
      if (res.ok) setInvoices(await res.json())
    } catch { toast.error('Erro ao carregar faturas') }
    finally { setLoading(false) }
  }

  const fetchChildren = async () => {
    const res = await fetch('/api/children')
    if (res.ok) setChildren(await res.json())
  }

  useEffect(() => { fetchInvoices() }, [filterStatus])
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
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
      })
      if (res.ok) {
        toast.success('Fatura criada!')
        setShowModal(false)
        setForm({ childId: '', description: '', amount: '', dueDate: format(addDays(new Date(), 10), 'yyyy-MM-dd'), referenceMonth: format(new Date(), 'yyyy-MM') })
        fetchInvoices()
      } else toast.error('Erro ao criar fatura')
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
      const payload = batch.selectedIds.map(id => ({
        childId: id, description: batch.description,
        amount: parseFloat(batch.amount), dueDate: batch.dueDate,
        referenceMonth: batch.referenceMonth,
      }))
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

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir permanentemente esta fatura?')) return
    try {
      const res = await fetch(`/api/finance/invoices/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Fatura excluída!')
        fetchInvoices()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Erro ao excluir')
      }
    } catch { toast.error('Erro ao excluir') }
  }

  const totalPaid    = invoices.filter(i => i.status === 'PAGO').reduce((s, i) => s + i.amount, 0)
  const totalPending = invoices.filter(i => i.status === 'PENDENTE').reduce((s, i) => s + i.amount, 0)
  const totalOverdue = invoices.filter(i => i.status === 'VENCIDO').reduce((s, i) => s + i.amount, 0)
  const studentName  = (inv: Invoice) => inv.child?.fullName || inv.student?.fullName || '—'

  return (
    <div className="page animate-in">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Financeiro</h1>
          <p className="page-subtitle">Faturas, mensalidades e pagamentos via Mercado Pago</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowBatchModal(true)} className="btn-secondary gap-1.5 text-xs">
            <Users size={14} /> Gerar em Lote
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary gap-1.5 text-xs">
            <Plus size={14} /> Nova Fatura
          </button>
        </div>
      </div>

      {/* ── Summary cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-xl font-black text-gray-900">{fmtBRL(totalPaid)}</p>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Recebido</p>
            <p className="text-[10px] text-emerald-600 font-bold mt-0.5">
              {invoices.filter(i => i.status === 'PAGO').length} fatura(s) paga(s)
            </p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-xl font-black text-gray-900">{fmtBRL(totalPending)}</p>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">A Receber</p>
            <p className="text-[10px] text-amber-600 font-bold mt-0.5">
              {invoices.filter(i => i.status === 'PENDENTE').length} pendente(s)
            </p>
          </div>
        </div>
        <div className="bg-rose-600 rounded-2xl p-5 flex items-center gap-4 shadow-sm shadow-rose-200">
          <div className="w-11 h-11 bg-white/20 text-white rounded-xl flex items-center justify-center shrink-0">
            <AlertCircle size={20} />
          </div>
          <div>
            <p className="text-xl font-black text-white">{fmtBRL(totalOverdue)}</p>
            <p className="text-[11px] font-bold text-rose-100 uppercase tracking-widest mt-0.5">Vencido</p>
            <p className="text-[10px] text-rose-200 font-bold mt-0.5">
              {invoices.filter(i => i.status === 'VENCIDO').length} vencida(s)
            </p>
          </div>
        </div>
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilterStatus(f.value)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wide transition-all ${
              filterStatus === f.value
                ? 'bg-gray-900 text-white shadow-sm'
                : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
            }`}
          >
            {f.label}
          </button>
        ))}
        <button
          onClick={fetchInvoices}
          className="ml-auto w-9 h-9 btn-ghost rounded-xl flex items-center justify-center p-0"
          title="Atualizar"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div className="table-container">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : invoices.length === 0 ? (
          <EmptyState
            icon={<Banknote size={28} />}
            title="Nenhuma fatura encontrada"
            description="Gere mensalidades em lote ou crie uma fatura individual."
            action={
              <button onClick={() => setShowBatchModal(true)} className="btn-primary gap-2">
                <Users size={14} /> Gerar mensalidades
              </button>
            }
          />
        ) : (
          <>
            {/* Desktop header */}
            <div className="hidden md:grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-5 py-3 bg-gray-50/70 border-b border-gray-100">
              <span className="table-header text-left">Aluno</span>
              <span className="table-header">Descrição</span>
              <span className="table-header">Valor</span>
              <span className="table-header">Vencimento</span>
              <span className="table-header">Status</span>
            </div>
            <div className="divide-y divide-gray-50">
              {invoices.map((inv, i) => {
                const s = STATUS[inv.status] ?? STATUS.PENDENTE
                const Icon = s.icon
                const name = studentName(inv)
                return (
                  <motion.div
                    key={inv.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="flex items-center gap-3 md:gap-4 px-5 py-3.5 hover:bg-gray-50/50 transition-colors group"
                  >
                    <Avatar name={name} photoUrl={inv.child?.photoUrl} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-gray-900 text-sm truncate">{name}</p>
                      <p className="text-[11px] text-gray-400 font-medium truncate">{inv.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-black text-gray-900 text-sm">{fmtBRL(inv.amount)}</p>
                      <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                        {format(new Date(inv.dueDate), 'dd/MM/yy')}
                      </p>
                    </div>
                    <span className={`badge ${s.badge} shrink-0 hidden sm:inline-flex`}>
                      <Icon size={10} /> {s.label}
                    </span>
                    <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {inv.status === 'PENDENTE' && (
                        <button onClick={() => handleCancel(inv.id)}
                          className="w-8 h-8 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center hover:bg-amber-100 transition-colors" title="Cancelar">
                          <X size={14} />
                        </button>
                      )}
                      {inv.status !== 'PAGO' && (
                        <button onClick={() => handleDelete(inv.id)}
                          className="w-8 h-8 bg-red-50 text-red-600 rounded-lg flex items-center justify-center hover:bg-red-100 transition-colors" title="Excluir">
                          <Trash2 size={14} />
                        </button>
                      )}
                      {inv.boletoUrl && (
                        <a href={inv.boletoUrl} target="_blank" rel="noreferrer"
                          className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-100 transition-colors" title="Boleto">
                          <Barcode size={14} />
                        </a>
                      )}
                      {inv.pixCopyPaste && (
                        <button onClick={() => { navigator.clipboard.writeText(inv.pixCopyPaste!); toast.success('PIX copiado!') }}
                          className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center hover:bg-emerald-100 transition-colors" title="Copiar PIX">
                          <QrCode size={14} />
                        </button>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* ── Modal: Nova Fatura ───────────────────────────────────────────── */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Nova Fatura"
        subtitle="Criar cobrança individual para um aluno"
        footer={
          <>
            <button onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
            <button form="create-invoice" type="submit" disabled={saving} className="btn-primary gap-2">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {saving ? 'Salvando…' : 'Criar Fatura'}
            </button>
          </>
        }
      >
        <form id="create-invoice" onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="label">Aluno / Criança *</label>
            <select value={form.childId} onChange={e => setForm(p => ({ ...p, childId: e.target.value }))} className="select">
              <option value="">Selecione...</option>
              {children.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Descrição *</label>
            <input type="text" placeholder="Ex: Mensalidade Junho/2025"
              value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              className="input" />
          </div>
          <div className="grid grid-cols-2 gap-3">
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
          <div>
            <label className="label">Mês de Referência</label>
            <input type="month" value={form.referenceMonth}
              onChange={e => setForm(p => ({ ...p, referenceMonth: e.target.value }))} className="input" />
          </div>
        </form>
      </Modal>

      {/* ── Modal: Gerar em Lote ─────────────────────────────────────────── */}
      <Modal
        open={showBatchModal}
        onClose={() => setShowBatchModal(false)}
        title="Gerar em Lote"
        subtitle="Crie mensalidades para múltiplos alunos de uma vez"
        size="lg"
        footer={
          <>
            <button onClick={() => setShowBatchModal(false)} className="btn-secondary">Cancelar</button>
            <button form="batch-invoice" type="submit" disabled={saving || batch.selectedIds.length === 0} className="btn-primary gap-2">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Users size={14} />}
              {saving ? 'Gerando…' : `Gerar ${batch.selectedIds.length} Fatura(s)`}
            </button>
          </>
        }
      >
        <form id="batch-invoice" onSubmit={handleBatch} className="space-y-4">
          <div>
            <label className="label">Descrição</label>
            <input type="text" value={batch.description}
              onChange={e => setBatch(p => ({ ...p, description: e.target.value }))} className="input" />
          </div>
          <div className="grid grid-cols-2 gap-3">
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
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Selecionar Alunos *</label>
              <button type="button" onClick={() =>
                setBatch(p => ({ ...p, selectedIds: p.selectedIds.length === children.length ? [] : children.map(c => c.id) }))
              } className="text-[10px] font-black text-lime-600 hover:text-lime-700">
                {batch.selectedIds.length === children.length ? 'Desmarcar todos' : 'Selecionar todos'}
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-50">
              {children.length === 0 ? (
                <p className="text-center text-gray-300 text-xs py-6">Nenhum aluno encontrado</p>
              ) : children.map(c => (
                <label key={c.id} className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-lime-50/50 transition-colors">
                  <input type="checkbox" checked={batch.selectedIds.includes(c.id)}
                    onChange={e => setBatch(p => ({
                      ...p, selectedIds: e.target.checked
                        ? [...p.selectedIds, c.id]
                        : p.selectedIds.filter(id => id !== c.id)
                    }))}
                    className="w-4 h-4 accent-lime-600 rounded" />
                  <Avatar name={c.fullName} photoUrl={c.photoUrl} size="sm" />
                  <span className="text-sm font-bold text-gray-900">{c.fullName}</span>
                </label>
              ))}
            </div>
            <p className="text-[10px] font-bold text-gray-400 mt-1.5">
              {batch.selectedIds.length} de {children.length} selecionado(s)
            </p>
          </div>
        </form>
      </Modal>
    </div>
  )
}
