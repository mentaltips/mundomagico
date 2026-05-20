'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  FileText, Users, DollarSign, CheckCircle2, AlertCircle,
  Eye, ArrowUpRight, ArrowDownRight, ClipboardList,
  Search, BookmarkCheck, UserPlus, Edit3, Trash2, Wallet, Info
} from 'lucide-react'
import toast from 'react-hot-toast'
import { getErrorMessage } from '@/lib/utils'
import { Avatar, Badge, LoadingState, StatCard } from '@/components/ui'

import type { BadgeVariant } from '@/components/ui'

import { Staff, StaffPayment, Group, ROLE_LABELS, MONTHS } from './_components/types'
import { ModalSalaryConfig } from './_components/ModalSalaryConfig'
import { ModalGroupAssignment } from './_components/ModalGroupAssignment'
import { ModalBonusDeduction } from './_components/ModalBonusDeduction'
import { ModalMarkPaid } from './_components/ModalMarkPaid'
import { ModalPayslip } from './_components/ModalPayslip'
import { ModalNewStaff, type NewStaffForm } from './_components/ModalNewStaff'

const EMPTY_NEW_STAFF: NewStaffForm = {
  name: '', email: '', phone: '', whatsapp: '', cpf: '', birthDate: '',
  photoUrl: '',
  roleType: 'TEACHER', baseSalary: '', paymentDay: '5', pixKey: '',
  bankName: '', bankAgency: '', bankAccount: '', financialNotes: ''
}

const fmtBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

const PAYMENT_STATUS_VARIANTS: Record<string, BadgeVariant> = {
  DRAFT: 'gray',
  PENDING: 'amber',
  PAID: 'green',
  CANCELED: 'red',
}

export default function StaffPaymentsPage() {
  const [activeTab, setActiveTab] = useState<'folha' | 'equipe'>('folha')
  const [refMonth, setRefMonth] = useState<number>(new Date().getMonth() + 1)
  const [refYear, setRefYear] = useState<number>(new Date().getFullYear())

  const [staffList, setStaffList] = useState<Staff[]>([])
  const [paymentsList, setPaymentsList] = useState<StaffPayment[]>([])
  const [groups, setGroups] = useState<Group[]>([])

  const [loadingStaff, setLoadingStaff] = useState(true)
  const [loadingPayments, setLoadingPayments] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [generating, setGenerating] = useState(false)

  // Modal: Salary config
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)

  // Modal: Group assignment
  const [showAssignmentModal, setShowAssignmentModal] = useState(false)
  const [newAssignment, setNewAssignment] = useState({ groupId: '', assignmentType: 'MAIN_TEACHER' })

  // Modal: Payment status
  const [showPaymentStatusModal, setShowPaymentStatusModal] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<StaffPayment | null>(null)
  const [statusForm, setStatusForm] = useState({ status: 'PAID', paymentMethod: 'PIX', paymentDate: new Date().toISOString().split('T')[0], notes: '' })

  // Modal: Bonus/Deduction
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false)
  const [adjustmentType, setAdjustmentType] = useState<'bonus' | 'deduction'>('bonus')
  const [adjustmentForm, setAdjustmentForm] = useState({ title: '', amount: '', description: '', type: 'MANUAL' })

  // Modals: Payslip & New Staff
  const [showPayslipModal, setShowPayslipModal] = useState(false)
  const [showNewStaffProfileModal, setShowNewStaffProfileModal] = useState(false)
  const [newStaffForm, setNewStaffForm] = useState<NewStaffForm>(EMPTY_NEW_STAFF)

  // ─── Data fetching ───

  const fetchStaff = useCallback(async () => {
    setLoadingStaff(true)
    try {
      const res = await fetch('/api/staff')
      if (res.ok) setStaffList(await res.json())
    } catch {
      toast.error('Erro ao carregar dados da equipe.')
    } finally {
      setLoadingStaff(false)
    }
  }, [])

  const fetchPayments = useCallback(async () => {
    setLoadingPayments(true)
    try {
      const res = await fetch(`/api/staff/payments?month=${refMonth}&year=${refYear}`)
      if (res.ok) setPaymentsList(await res.json())
    } catch {
      toast.error('Erro ao carregar folha de pagamentos.')
    } finally {
      setLoadingPayments(false)
    }
  }, [refMonth, refYear])

  const fetchGroups = useCallback(async () => {
    try {
      const res = await fetch('/api/groups')
      if (res.ok) setGroups(await res.json())
    } catch { /* silent */ }
  }, [])

  useEffect(() => { fetchStaff(); fetchGroups() }, [fetchGroups, fetchStaff])
  useEffect(() => { if (activeTab === 'folha') fetchPayments() }, [activeTab, fetchPayments])

  // ─── Handlers ───

  const handleGeneratePayroll = async () => {
    if (!confirm(`Deseja gerar a folha para ${MONTHS[refMonth - 1]} de ${refYear}?`)) return
    setGenerating(true)
    try {
      const res = await fetch('/api/staff/payments/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: refMonth, year: refYear })
      })
      if (res.ok) {
        toast.success('Folha gerada com sucesso!')
        fetchPayments()
      } else {
        const err = await res.json()
        toast.error(getErrorMessage(err, 'Erro ao gerar folha.'))
      }
    } catch { toast.error('Erro de conexão.') } finally { setGenerating(false) }
  }

  const handleSaveStaffConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStaff) return
    try {
      const form = e.currentTarget as HTMLFormElement
      const data = new FormData(form)
      const payload = {
        name: data.get('name') as string,
        email: data.get('email') as string || null,
        phone: data.get('phone') as string || null,
        whatsapp: data.get('whatsapp') as string || null,
        cpf: data.get('cpf') as string || null,
        birthDate: data.get('birthDate') ? new Date(data.get('birthDate') as string).toISOString() : null,
        photoUrl: data.get('photoUrl') as string || null,
        roleType: data.get('roleType') as string,
        baseSalary: data.get('baseSalary') ? parseFloat(data.get('baseSalary') as string) : null,
        paymentDay: data.get('paymentDay') ? parseInt(data.get('paymentDay') as string) : null,
        pixKey: data.get('pixKey') as string || null,
        bankName: data.get('bankName') as string || null,
        bankAgency: data.get('bankAgency') as string || null,
        bankAccount: data.get('bankAccount') as string || null,
        financialNotes: data.get('financialNotes') as string || null
      }
      const res = await fetch(`/api/staff/${selectedStaff.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      })
      if (res.ok) {
        toast.success('Dados financeiros atualizados!')
        setShowConfigModal(false)
        fetchStaff()
        if (activeTab === 'folha') fetchPayments()
      } else {
        const err = await res.json()
        toast.error(getErrorMessage(err, 'Erro ao atualizar dados.'))
      }
    } catch { toast.error('Erro de conexão.') }
  }

  const handleAddAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStaff || !newAssignment.groupId) return
    try {
      const res = await fetch(`/api/staff/${selectedStaff.id}/assignments`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newAssignment)
      })
      if (res.ok) {
        toast.success('Vínculo com turma adicionado!')
        setNewAssignment({ groupId: '', assignmentType: 'MAIN_TEACHER' })
        const updated = await fetch('/api/staff')
        if (updated.ok) {
          const list = await updated.json()
          setStaffList(list)
          const matched = list.find((s: Staff) => s.id === selectedStaff.id)
          if (matched) setSelectedStaff(matched)
        }
      } else { toast.error('Erro ao vincular turma (pode já estar vinculada).') }
    } catch { toast.error('Erro de conexão.') }
  }

  const handleRemoveAssignment = async (assignmentId: string) => {
    if (!selectedStaff || !confirm('Deseja realmente remover este vínculo?')) return
    try {
      const res = await fetch(`/api/staff/${selectedStaff.id}/assignments/${assignmentId}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Vínculo removido.')
        const updated = await fetch('/api/staff')
        if (updated.ok) {
          const list = await updated.json()
          setStaffList(list)
          const matched = list.find((s: Staff) => s.id === selectedStaff.id)
          if (matched) setSelectedStaff(matched)
        }
      } else { toast.error('Erro ao remover vínculo.') }
    } catch { toast.error('Erro de conexão.') }
  }

  const handleUpdatePaymentStatus = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPayment) return
    try {
      const res = await fetch(`/api/staff/payments/${selectedPayment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: statusForm.status,
          paymentDate: statusForm.status === 'PAID' ? new Date(statusForm.paymentDate).toISOString() : null,
          paymentMethod: statusForm.status === 'PAID' ? statusForm.paymentMethod : null,
          notes: statusForm.notes
        })
      })
      if (res.ok) {
        toast.success('Status de pagamento atualizado!')
        setShowPaymentStatusModal(false)
        fetchPayments()
      } else { toast.error('Erro ao atualizar pagamento.') }
    } catch { toast.error('Erro de conexão.') }
  }

  const handleAddAdjustment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPayment) return
    try {
      const res = await fetch(`/api/staff/payments/${selectedPayment.id}/${adjustmentType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: adjustmentForm.title,
          amount: parseFloat(adjustmentForm.amount),
          description: adjustmentForm.description || null,
          type: adjustmentForm.type
        })
      })
      if (res.ok) {
        toast.success(adjustmentType === 'bonus' ? 'Bônus adicionado!' : 'Desconto registrado!')
        setShowAdjustmentModal(false)
        setAdjustmentForm({ title: '', amount: '', description: '', type: 'MANUAL' })
        fetchPayments()
      } else {
        const err = await res.json()
        toast.error(getErrorMessage(err, 'Erro ao registrar ajuste.'))
      }
    } catch { toast.error('Erro de conexão.') }
  }

  const handleCreateNewStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        ...newStaffForm,
        email: newStaffForm.email || null,
        phone: newStaffForm.phone || null,
        whatsapp: newStaffForm.whatsapp || null,
        cpf: newStaffForm.cpf || null,
        birthDate: newStaffForm.birthDate ? new Date(newStaffForm.birthDate).toISOString() : null,
        photoUrl: newStaffForm.photoUrl || null,
        baseSalary: newStaffForm.baseSalary ? parseFloat(newStaffForm.baseSalary) : null,
        paymentDay: parseInt(newStaffForm.paymentDay) || 5,
        pixKey: newStaffForm.pixKey || null,
        bankName: newStaffForm.bankName || null,
        bankAgency: newStaffForm.bankAgency || null,
        bankAccount: newStaffForm.bankAccount || null,
        financialNotes: newStaffForm.financialNotes || null
      }
      const res = await fetch('/api/staff', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      })
      if (res.ok) {
        toast.success('Perfil profissional cadastrado!')
        setShowNewStaffProfileModal(false)
        setNewStaffForm(EMPTY_NEW_STAFF)
        fetchStaff()
      } else {
        const err = await res.json()
        toast.error(getErrorMessage(err, 'Erro ao criar perfil.'))
      }
    } catch { toast.error('Erro de conexão.') }
  }

  const handleDeleteStaff = async (id: string) => {
    if (!confirm('Deseja realmente excluir este perfil? Os dados históricos serão preservados.')) return
    try {
      const res = await fetch(`/api/staff/${id}`, { method: 'DELETE' })
      if (res.ok) { toast.success('Perfil desativado.'); fetchStaff() }
      else toast.error('Erro ao desativar perfil.')
    } catch { toast.error('Erro de conexão.') }
  }

  // ─── Derived values ───

  const filteredStaff = staffList.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ROLE_LABELS[s.roleType]?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredPayments = paymentsList.filter(p =>
    p.staff.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalSalariesGenerated = paymentsList.reduce((acc, p) => acc + p.finalAmount, 0)
  const totalPaid = paymentsList.filter(p => p.status === 'PAID').reduce((acc, p) => acc + p.finalAmount, 0)
  const totalPending = paymentsList.filter(p => p.status === 'PENDING' || p.status === 'DRAFT').reduce((acc, p) => acc + p.finalAmount, 0)

  const statusLabels: Record<string, string> = {
    DRAFT: 'Rascunho', PENDING: 'Pendente', PAID: 'Pago', CANCELED: 'Cancelado'
  }

  // ─── Render ───

  return (
    <div className="page animate-in">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <BookmarkCheck className="text-primary h-8 w-8" />
            Folha de Pagamentos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestão de salários, contracheques mensais, atribuições e PIX de professoras e monitoras.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'equipe' && (
            <button
              onClick={() => setShowNewStaffProfileModal(true)}
              className="btn-primary"
            >
              <UserPlus className="h-4 w-4" />
              Novo Perfil Profissional
            </button>
          )}
          {activeTab === 'folha' && (
            <button
              onClick={handleGeneratePayroll}
              disabled={generating || staffList.length === 0}
              className="btn-primary disabled:opacity-50 disabled:pointer-events-none"
            >
              {generating ? 'Gerando...' : 'Gerar Folha Mensal'}
            </button>
          )}
        </div>
      </div>

      {/* QUICK METRICS */}
      {activeTab === 'folha' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Total da Folha"
            value={fmtBRL(totalSalariesGenerated)}
            icon={<DollarSign size={20} />}
            color="text-primary bg-primary/10"
          />
          <StatCard
            label="Total Pago"
            value={fmtBRL(totalPaid)}
            icon={<CheckCircle2 size={20} />}
            color="text-emerald-500 bg-emerald-500/10"
          />
          <StatCard
            label="Aguardando Pagamento"
            value={fmtBRL(totalPending)}
            icon={<AlertCircle size={20} />}
            color="text-amber-500 bg-amber-500/10"
          />
        </div>
      )}

      {/* CONTROL BAR */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-accent/40 border border-border/40 p-1 rounded-2xl overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('folha')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${activeTab === 'folha' ? 'bg-primary text-primary-foreground shadow-md shadow-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'}`}
          >
            <FileText className="h-3.5 w-3.5" />
            Folha Mensal
          </button>
          <button
            onClick={() => setActiveTab('equipe')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${activeTab === 'equipe' ? 'bg-primary text-primary-foreground shadow-md shadow-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'}`}
          >
            <Users className="h-3.5 w-3.5" />
            Equipe & Salários
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full xl:w-auto">
          {activeTab === 'folha' && (
            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
              <select
                value={refMonth}
                onChange={(e) => setRefMonth(parseInt(e.target.value))}
                className="select h-12"
              >
                {MONTHS.map((m, idx) => <option key={m} value={idx + 1}>{m}</option>)}
              </select>
              <select
                value={refYear}
                onChange={(e) => setRefYear(parseInt(e.target.value))}
                className="select h-12"
              >
                {[refYear - 2, refYear - 1, refYear, refYear + 1].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          )}

          <div className="relative group w-full sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Buscar por nome ou cargo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-12 w-full bg-accent/30 border-transparent focus:bg-accent/50 focus:border-primary/30 h-12 text-sm font-bold"
            />
          </div>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="table-container">
        {activeTab === 'folha' ? (
          loadingPayments ? (
            <LoadingState label="Carregando folha de pagamentos..." />
          ) : filteredPayments.length === 0 ? (
            <div className="p-16 text-center text-muted-foreground">
              <ClipboardList className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h4 className="text-sm font-black uppercase tracking-widest">Nenhum contracheque gerado</h4>
              <p className="text-xs mt-1 max-w-sm mx-auto text-muted-foreground/75">
                A folha para este mês ainda não foi aberta. Clique em <strong>Gerar Folha Mensal</strong> para carregar os salários.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr>
                    <th className="table-header">Colaborador(a)</th>
                    <th className="table-header">Função</th>
                    <th className="table-header text-right">Salário Base</th>
                    <th className="table-header text-right hidden lg:table-cell">Bônus (+)</th>
                    <th className="table-header text-right hidden lg:table-cell">Descontos (-)</th>
                    <th className="table-header text-right">Valor Final</th>
                    <th className="table-header text-center">Status</th>
                    <th className="table-header text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map(p => (
                    <tr key={p.id} className="table-row">
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          <Avatar name={p.staff.name} photoUrl={p.staff.photoUrl} size="sm" />
                          <div className="min-w-0">
                            <div className="font-bold truncate">{p.staff.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className="inline-flex rounded-md bg-accent/40 px-2.5 py-1 text-xs font-bold">
                          {ROLE_LABELS[p.staff.roleType] || p.staff.roleType}
                        </span>
                      </td>
                      <td className="table-cell text-right font-mono">{fmtBRL(p.baseSalary)}</td>
                      <td className="table-cell text-right font-mono text-emerald-600 hidden lg:table-cell">{fmtBRL(p.totalBonuses)}</td>
                      <td className="table-cell text-right font-mono text-rose-600 hidden lg:table-cell">{fmtBRL(p.totalDeductions)}</td>
                      <td className="table-cell text-right font-mono font-black text-primary">{fmtBRL(p.finalAmount)}</td>
                      <td className="table-cell text-center">
                        <Badge label={statusLabels[p.status]} variant={PAYMENT_STATUS_VARIANTS[p.status] || 'gray'} size="sm" dot={p.status === 'PENDING'} />
                      </td>
                      <td className="table-cell text-right space-x-1.5">
                        <button
                          onClick={() => { setAdjustmentType('bonus'); setSelectedPayment(p); setShowAdjustmentModal(true) }}
                          disabled={p.status === 'PAID'}
                          className="text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 p-2 rounded-xl transition-all disabled:opacity-40"
                          title="Adicionar Bônus"
                        >
                          <ArrowUpRight className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => { setAdjustmentType('deduction'); setSelectedPayment(p); setShowAdjustmentModal(true) }}
                          disabled={p.status === 'PAID'}
                          className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 p-2 rounded-xl transition-all disabled:opacity-40"
                          title="Adicionar Desconto"
                        >
                          <ArrowDownRight className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPayment(p)
                            setStatusForm({
                              status: p.status === 'PAID' ? 'PENDING' : 'PAID',
                              paymentMethod: p.paymentMethod || 'PIX',
                              paymentDate: p.paymentDate ? p.paymentDate.split('T')[0] : new Date().toISOString().split('T')[0],
                              notes: p.notes || ''
                            })
                            setShowPaymentStatusModal(true)
                          }}
                          className="text-primary hover:bg-primary/10 p-2 rounded-xl transition-all"
                          title="Registrar Pagamento"
                        >
                          <BookmarkCheck className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => { setSelectedPayment(p); setShowPayslipModal(true) }}
                          className="text-muted-foreground hover:bg-accent p-2 rounded-xl transition-all"
                          title="Visualizar Holerite"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          loadingStaff ? (
            <LoadingState label="Carregando lista da equipe..." />
          ) : filteredStaff.length === 0 ? (
            <div className="p-16 text-center text-muted-foreground">
              <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h4 className="text-sm font-black uppercase tracking-widest">Nenhum membro cadastrado</h4>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr>
                    <th className="table-header">Nome</th>
                    <th className="table-header">Cargo</th>
                    <th className="table-header">Salário Base</th>
                    <th className="table-header hidden lg:table-cell">Dados de Pagamento</th>
                    <th className="table-header hidden xl:table-cell">Turmas Ativas</th>
                    <th className="table-header text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.map(s => (
                    <tr key={s.id} className="table-row">
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          <Avatar name={s.name} photoUrl={s.photoUrl} size="sm" />
                          <div className="min-w-0">
                            <div className="font-bold truncate">{s.name}</div>
                            {s.cpf && <div className="text-[10px] text-muted-foreground mt-0.5">CPF: {s.cpf}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className="inline-flex rounded-md bg-accent/40 px-2.5 py-1 text-xs font-bold">
                          {ROLE_LABELS[s.roleType] || s.roleType}
                        </span>
                      </td>
                      <td className="table-cell font-mono font-bold">
                        {s.baseSalary ? `R$ ${s.baseSalary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Não definido'}
                      </td>
                      <td className="table-cell hidden lg:table-cell">
                        {s.pixKey ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-bold flex items-center gap-1 text-primary">
                              <Wallet className="h-3 w-3 shrink-0" />
                              PIX: {s.pixKey}
                            </span>
                            {s.bankName && <span className="text-[10px] text-muted-foreground">{s.bankName} Ag {s.bankAgency} C/C {s.bankAccount}</span>}
                          </div>
                        ) : (
                          <span className="text-xs text-rose-500 font-bold flex items-center gap-1">
                            <Info className="h-3.5 w-3.5" />
                            Sem dados bancários
                          </span>
                        )}
                      </td>
                      <td className="table-cell hidden xl:table-cell">
                        <div className="flex flex-wrap gap-1 max-w-[220px]">
                          {s.groupAssignments.length > 0 ? s.groupAssignments.map(a => (
                            <span key={a.id} className="inline-flex rounded-md bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 text-[10px] font-bold dark:bg-indigo-500/10 dark:border-none dark:text-indigo-400">
                              {a.group.name}
                            </span>
                          )) : (
                            <span className="text-xs text-muted-foreground italic">Nenhuma</span>
                          )}
                        </div>
                      </td>
                      <td className="table-cell text-right space-x-1.5">
                        <button
                          onClick={() => { setSelectedStaff(s); setShowAssignmentModal(true) }}
                          className="text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 px-3 py-1.5 rounded-xl text-xs font-black transition-all"
                        >
                          Vincular Turma
                        </button>
                        <button
                          onClick={() => { setSelectedStaff(s); setShowConfigModal(true) }}
                          className="text-primary hover:bg-primary/10 p-2 rounded-xl transition-all"
                          title="Configurar Salário"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteStaff(s.id)}
                          className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 p-2 rounded-xl transition-all"
                          title="Remover Perfil"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* ─── MODALS ─── */}

      {showConfigModal && selectedStaff && (
        <ModalSalaryConfig
          staff={selectedStaff}
          onClose={() => setShowConfigModal(false)}
          onSave={handleSaveStaffConfig}
        />
      )}

      {showAssignmentModal && selectedStaff && (
        <ModalGroupAssignment
          staff={selectedStaff}
          groups={groups}
          newAssignment={newAssignment}
          setNewAssignment={setNewAssignment}
          onClose={() => setShowAssignmentModal(false)}
          onAddAssignment={handleAddAssignment}
          onRemoveAssignment={handleRemoveAssignment}
        />
      )}

      {showAdjustmentModal && selectedPayment && (
        <ModalBonusDeduction
          payment={selectedPayment}
          adjustmentType={adjustmentType}
          adjustmentForm={adjustmentForm}
          setAdjustmentForm={setAdjustmentForm}
          onClose={() => setShowAdjustmentModal(false)}
          onSubmit={handleAddAdjustment}
        />
      )}

      {showPaymentStatusModal && selectedPayment && (
        <ModalMarkPaid
          payment={selectedPayment}
          statusForm={statusForm}
          setStatusForm={setStatusForm}
          onClose={() => setShowPaymentStatusModal(false)}
          onSubmit={handleUpdatePaymentStatus}
        />
      )}

      {showPayslipModal && selectedPayment && (
        <ModalPayslip
          payment={selectedPayment}
          onClose={() => setShowPayslipModal(false)}
        />
      )}

      {showNewStaffProfileModal && (
        <ModalNewStaff
          form={newStaffForm}
          setForm={setNewStaffForm}
          onClose={() => setShowNewStaffProfileModal(false)}
          onSubmit={handleCreateNewStaff}
        />
      )}

    </div>
  )
}
