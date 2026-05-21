'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Heart, Pill, AlertCircle, Clock,
  CheckCircle2, Plus, Search,
  Thermometer, AlertTriangle, Loader2, X
} from 'lucide-react'
import { Modal, PageHeader, EmptyState, Badge, LoadingState, Avatar } from '@/components/ui'
import toast from 'react-hot-toast'

const FREQ_LABEL: Record<string, string> = {
  DIARIO: 'Diário', SEMANAL: 'Semanal', MENSAL: 'Mensal',
  CONFORME_NECESSARIO: 'Se necessário', UNICO: 'Dose única',
}

export default function HealthPage() {
  const [medications, setMedications] = useState<any[]>([])
  const [children, setChildren]       = useState<any[]>([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')

  const [showAdminModal, setShowAdminModal] = useState(false)
  const [selectedMed, setSelectedMed]       = useState<any>(null)
  const [adminData, setAdminData]           = useState({ dosage: '', notes: '' })
  const [adminLoading, setAdminLoading]     = useState(false)

  const [showAddModal, setShowAddModal] = useState(false)
  const [addLoading, setAddLoading]     = useState(false)
  const [addForm, setAddForm] = useState({
    childId: '', name: '', dosage: '', frequency: 'DIARIO',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '', instructions: '',
  })

  const fetchMedications = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/health/medications?active=true')
      if (res.ok) {
        const data = await res.json()
        setMedications(Array.isArray(data) ? data : [])
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(`Erro ao carregar medicações (${res.status}): ${err?.error?.message || ''}`)
      }
    } catch { toast.error('Erro ao carregar medicações') }
    finally { setLoading(false) }
  }

  const fetchChildren = async () => {
    try {
      const res = await fetch('/api/children?status=ATIVO,ADAPTACAO')
      if (res.ok) {
        const data = await res.json()
        setChildren(Array.isArray(data) ? data : data.children ?? [])
      }
    } catch {}
  }

  useEffect(() => { fetchMedications(); fetchChildren() }, [])

  const handleAdminister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMed) return
    setAdminLoading(true)
    try {
      const res = await fetch(`/api/health/medications/${selectedMed.id}/administer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dosage: adminData.dosage || selectedMed.dosage, notes: adminData.notes })
      })
      if (res.ok) {
        toast.success('Dose registrada! ✅')
        setShowAdminModal(false)
        setAdminData({ dosage: '', notes: '' })
        fetchMedications()
      } else { toast.error('Erro ao registrar dose') }
    } catch { toast.error('Erro ao registrar dose') }
    finally { setAdminLoading(false) }
  }

  const handleAddMedication = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addForm.childId || !addForm.name || !addForm.dosage) {
      toast.error('Preencha aluno, medicamento e dosagem'); return
    }
    setAddLoading(true)
    try {
      const res = await fetch('/api/health/medications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId: addForm.childId, name: addForm.name, dosage: addForm.dosage,
          frequency: addForm.frequency, startDate: addForm.startDate,
          ...(addForm.endDate && { endDate: addForm.endDate }),
          ...(addForm.instructions && { instructions: addForm.instructions }),
          active: true,
        })
      })
      if (res.ok) {
        toast.success('Medicação cadastrada!')
        setShowAddModal(false)
        setAddForm({ childId: '', name: '', dosage: '', frequency: 'DIARIO', startDate: new Date().toISOString().slice(0,10), endDate: '', instructions: '' })
        fetchMedications()
      } else { toast.error('Erro ao cadastrar') }
    } catch { toast.error('Erro ao cadastrar') }
    finally { setAddLoading(false) }
  }

  const handleDeactivate = async (id: string) => {
    if (!confirm('Desativar esta medicação?')) return
    try {
      const res = await fetch(`/api/health/medications/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: false })
      })
      if (res.ok) { toast.success('Desativada'); fetchMedications() }
    } catch { toast.error('Erro') }
  }

  // Filter out empty/null/"não" allergies
  const childrenWithAllergies = children.filter(c => {
    const a = c.allergies
    if (!a) return false
    const str = typeof a === 'string' ? a.trim() : JSON.stringify(a)
    return str && str !== '[]' && str !== '' && str.toLowerCase() !== 'não' && str.toLowerCase() !== 'nao'
  })

  const filteredMeds = medications.filter(med =>
    (med.child?.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
    (med.name || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="page animate-in pb-24">
      <PageHeader
        title="Saúde & Bem-estar"
        subtitle="Controle de medicações e cuidados especiais."
        icon={<Heart className="text-rose-500 fill-rose-500" size={24} />}
        actions={
          <button onClick={() => setShowAddModal(true)} className="btn-primary gap-2">
            <Plus size={18} /> Nova Medicação
          </button>
        }
      />

      {/* Top strip: stats + warning */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
            <Pill size={20} />
          </div>
          <div>
            <p className="text-2xl font-black text-foreground leading-none">{medications.length}</p>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-0.5">Medicações ativas</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-rose-500/10 text-rose-500 rounded-xl flex items-center justify-center shrink-0">
            <AlertCircle size={20} />
          </div>
          <div>
            <p className="text-2xl font-black text-foreground leading-none">{childrenWithAllergies.length}</p>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-0.5">Com alergias</p>
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-amber-500/10 border border-amber-500/20 rounded-3xl p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-600 dark:text-amber-400 font-bold leading-relaxed">
            Confirme dosagem e autorização antes de administrar qualquer medicamento.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por aluno ou remédio..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input pl-11 h-12 text-sm"
        />
      </div>

      {/* Allergies strip — only if there are any */}
      {childrenWithAllergies.length > 0 && (
        <div className="card p-4">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <AlertCircle size={11} className="text-rose-500" /> Alergias registradas
          </p>
          <div className="flex flex-wrap gap-2">
            {childrenWithAllergies.map((c: any) => {
              const allergyStr = typeof c.allergies === 'string'
                ? c.allergies.replace(/[\[\]"]/g, '').trim()
                : JSON.stringify(c.allergies)
              return (
                <div key={c.id} className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-2xl px-3 py-2">
                  <Avatar photoUrl={c.photoUrl} name={c.fullName} size="xs" />
                  <div>
                    <p className="text-xs font-black text-foreground">{c.fullName.split(' ')[0]}</p>
                    <p className="text-[10px] text-rose-500 font-bold">{allergyStr}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Medication cards */}
      {loading ? (
        <LoadingState label="Carregando medicações..." />
      ) : filteredMeds.length === 0 ? (
        <EmptyState
          icon={<Pill size={32} />}
          title="Nenhuma medicação ativa"
          description="Cadastre medicações contínuas para alunos que precisam."
          action={
            <button onClick={() => setShowAddModal(true)} className="btn-primary gap-2">
              <Plus size={16} /> Cadastrar Medicação
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMeds.map((med, i) => (
            <motion.div
              key={med.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card p-5 flex flex-col border border-border/40 hover:border-primary/20 transition-all"
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <Avatar name={med.child?.fullName} photoUrl={med.child?.photoUrl} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="font-black text-foreground text-sm leading-tight truncate">{med.child?.fullName}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate">{med.child?.group?.name || 'Sem turma'}</p>
                </div>
                <button onClick={() => handleDeactivate(med.id)} className="p-1.5 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all shrink-0">
                  <X size={13} />
                </button>
              </div>

              {/* Medication details */}
              <div className="bg-accent/30 rounded-2xl p-3 mb-4 space-y-1.5 border border-border/20 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-base font-black text-foreground">{med.name}</p>
                  <Badge label={FREQ_LABEL[med.frequency] ?? med.frequency} variant="amber" size="sm" />
                </div>
                <p className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                  <Thermometer size={11} className="text-primary" /> {med.dosage}
                </p>
                {(med.notes || med.instructions) && (
                  <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">{med.notes || med.instructions}</p>
                )}
              </div>

              {/* Last dose + action */}
              <div className="flex items-center justify-between pt-3 border-t border-border/50">
                <div>
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Última dose</p>
                  <p className="text-[11px] font-black text-foreground flex items-center gap-1 mt-0.5">
                    <Clock size={10} className="text-muted-foreground" />
                    {med.administrations?.[0]
                      ? new Date(med.administrations[0].administeredAt).toLocaleDateString('pt-BR') + ' ' + new Date(med.administrations[0].administeredAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                      : 'Pendente'}
                  </p>
                </div>
                <button
                  onClick={() => { setSelectedMed(med); setShowAdminModal(true) }}
                  className="btn-primary py-2 px-4 rounded-xl text-[11px] font-black gap-1.5"
                >
                  <CheckCircle2 size={13} /> Registrar
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal: Registrar Dose */}
      <Modal open={showAdminModal} onClose={() => setShowAdminModal(false)} title="Registrar Dose" subtitle={selectedMed?.child?.fullName}>
        <form onSubmit={handleAdminister} className="space-y-4">
          <div className="bg-primary/10 p-4 rounded-2xl border border-primary/20 flex items-start gap-3">
            <AlertCircle className="text-primary shrink-0 mt-0.5" size={16} />
            <div>
              <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Prescrição</p>
              <p className="text-sm font-bold text-primary/80">{selectedMed?.name} — {selectedMed?.dosage} ({FREQ_LABEL[selectedMed?.frequency] ?? selectedMed?.frequency})</p>
            </div>
          </div>
          <div>
            <label className="label">Confirmar Dosagem</label>
            <input type="text" placeholder={selectedMed?.dosage} value={adminData.dosage} onChange={e => setAdminData({...adminData, dosage: e.target.value})} className="input" />
          </div>
          <div>
            <label className="label">Observações</label>
            <textarea rows={3} placeholder="Ex: Tomou tudo sem dificuldades..." value={adminData.notes} onChange={e => setAdminData({...adminData, notes: e.target.value})} className="input" />
          </div>
          <div className="flex gap-3 pt-2 border-t border-border">
            <button type="button" onClick={() => setShowAdminModal(false)} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={adminLoading} className="btn-primary flex-1 gap-2">
              {adminLoading ? <Loader2 size={16} className="animate-spin" /> : <><CheckCircle2 size={16} /> Confirmar</>}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Nova Medicação */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Nova Medicação" subtitle="Cadastrar medicamento para um aluno">
        <form onSubmit={handleAddMedication} className="space-y-4">
          <div>
            <label className="label">Aluno *</label>
            <select value={addForm.childId} onChange={e => setAddForm({...addForm, childId: e.target.value})} className="select" required>
              <option value="">Selecione o aluno...</option>
              {children.map((c: any) => <option key={c.id} value={c.id}>{c.fullName}{c.group?.name ? ` — ${c.group.name}` : ''}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Medicamento *</label>
              <input type="text" placeholder="Ex: Amoxicilina" value={addForm.name} onChange={e => setAddForm({...addForm, name: e.target.value})} className="input" required />
            </div>
            <div>
              <label className="label">Dosagem *</label>
              <input type="text" placeholder="Ex: 5ml" value={addForm.dosage} onChange={e => setAddForm({...addForm, dosage: e.target.value})} className="input" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Frequência</label>
              <select value={addForm.frequency} onChange={e => setAddForm({...addForm, frequency: e.target.value})} className="select">
                <option value="DIARIO">Diário</option>
                <option value="SEMANAL">Semanal</option>
                <option value="CONFORME_NECESSARIO">Se necessário</option>
                <option value="UNICO">Dose única</option>
              </select>
            </div>
            <div>
              <label className="label">Início</label>
              <input type="date" value={addForm.startDate} onChange={e => setAddForm({...addForm, startDate: e.target.value})} className="input" />
            </div>
          </div>
          <div>
            <label className="label">Término (opcional)</label>
            <input type="date" value={addForm.endDate} onChange={e => setAddForm({...addForm, endDate: e.target.value})} className="input" />
          </div>
          <div>
            <label className="label">Instruções</label>
            <textarea rows={2} placeholder="Ex: Dar após o almoço..." value={addForm.instructions} onChange={e => setAddForm({...addForm, instructions: e.target.value})} className="input" />
          </div>
          <div className="flex gap-3 pt-2 border-t border-border">
            <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={addLoading} className="btn-primary flex-1 gap-2">
              {addLoading ? <Loader2 size={16} className="animate-spin" /> : <><Plus size={16} /> Cadastrar</>}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
