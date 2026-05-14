'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { LogIn, LogOut, Shield, AlertTriangle, Search, Clock, Users, X, CheckCircle2 } from 'lucide-react'
import { Modal, Avatar, Badge, BadgeVariant } from '@/components/ui'

interface AuthorizedPerson {
  name: string
  relationship: string
  phone: string
  cpf?: string | null
  type: 'guardian' | 'authorized'
}

interface ChildData {
  id: string
  fullName: string
  nickname?: string | null
  photoUrl?: string | null
  groupName?: string | null
  usesDiapers: boolean
  checkInOut: {
    id: string
    status: string
    checkInTime?: Date | null
    checkOutTime?: Date | null
    broughtBy?: string | null
    pickedUpBy?: string | null
  } | null
  authorizedPersons: AuthorizedPerson[]
}

interface Props {
  date: string
  children: ChildData[]
}

export function CheckInOutPanel({ date, children }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<{
    type: 'in' | 'out'
    child: ChildData
  } | null>(null)
  const [form, setForm] = useState({ personName: '', personDoc: '', note: '' })
  const [loading, setLoading] = useState(false)

  const filtered = children.filter((c) =>
    (c.fullName || '').toLowerCase().includes(search.toLowerCase())
  )

  const getStatus = (child: ChildData) => {
    if (!child.checkInOut) return 'AUSENTE'
    return child.checkInOut.status
  }

  const openModal = (type: 'in' | 'out', child: ChildData) => {
    setForm({ personName: '', personDoc: '', note: '' })
    setModal({ type, child })
  }

  const handleSubmit = async () => {
    if (!modal) return
    if (!form.personName.trim()) {
      toast.error('Informe o nome de quem está ' + (modal.type === 'in' ? 'trazendo' : 'buscando'))
      return
    }

    // Verificar se a pessoa está autorizada para busca
    if (modal.type === 'out') {
      const isAuthorized = modal.child.authorizedPersons.some(
        (p) => (p.name || '').toLowerCase().includes(form.personName.toLowerCase()) ||
               (form.personDoc && p.cpf === form.personDoc)
      )
      if (!isAuthorized) {
        const confirmed = window.confirm(
          `⚠️ ATENÇÃO!\n\n"${form.personName}" NÃO está na lista de pessoas autorizadas a buscar ${modal.child.fullName}.\n\nDeseja registrar mesmo assim? Isso gerará um alerta.`
        )
        if (!confirmed) return
      }
    }

    setLoading(true)
    try {
      const res = await fetch('/api/check-in-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId: modal.child.id,
          date,
          type: modal.type,
          personName: form.personName,
          personDoc: form.personDoc,
          note: form.note,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success(
        modal.type === 'in'
          ? `✅ ${modal.child.fullName} deu entrada!`
          : `👋 ${modal.child.fullName} foi embora!`
      )
      setModal(null)
      router.refresh()
    } catch {
      toast.error('Erro ao registrar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const statusConfig: Record<string, { label: string; variant: BadgeVariant }> = {
    PRESENTE:           { label: 'Presente',          variant: 'green' },
    AUSENTE:            { label: 'Ausente',            variant: 'amber' }, // Use amber for missing
    SAIU_MAIS_CEDO:     { label: 'Saiu mais cedo',     variant: 'sky' },
    AGUARDANDO_RETIRADA:{ label: 'Aguardando retirada',variant: 'blue' },
  }

  return (
    <>
      {/* Busca */}
      <div className="relative group mb-2">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <input
          className="input pl-12 w-full bg-accent/30 border-transparent focus:bg-accent/50 focus:border-primary/30 h-14 text-sm font-bold"
          placeholder="Buscar criança pelo nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Lista */}
      <div className="space-y-4">
        {filtered.map((child) => {
          const status = getStatus(child)
          const cfg = statusConfig[status] ?? statusConfig.AUSENTE
          const isPresent = status === 'PRESENTE' || status === 'AGUARDANDO_RETIRADA'

          return (
            <div key={child.id} className="card p-6 border border-border/50 hover:border-primary/20 transition-all group/card">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-5 flex-1 min-w-0">
                  <Avatar 
                    photoUrl={child.photoUrl} 
                    name={child.fullName}
                    size="lg"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                      <p className="font-black text-foreground text-lg sm:text-xl tracking-tight leading-tight line-clamp-2 sm:line-clamp-none">
                        {child.fullName}
                      </p>
                      <div className="shrink-0">
                        <Badge label={cfg.label} variant={cfg.variant} dot={status === 'AUSENTE'} />
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-y-2 gap-x-4">
                      {child.groupName && (
                        <span className="px-2 py-1 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest rounded-lg border border-primary/10">
                          {child.groupName}
                        </span>
                      )}
                      {child.checkInOut?.checkInTime && (
                        <span className="text-xs text-muted-foreground/70 flex items-center gap-1.5 font-bold">
                          <Clock className="w-3.5 h-3.5" />
                          Entrada: <span className="text-foreground">{new Date(child.checkInOut.checkInTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                          {child.checkInOut.broughtBy && <span className="opacity-60 text-[10px]">({child.checkInOut.broughtBy})</span>}
                        </span>
                      )}
                      {child.checkInOut?.checkOutTime && (
                        <span className="text-xs text-muted-foreground/70 flex items-center gap-1.5 font-bold">
                          <Clock className="w-3.5 h-3.5" />
                          Saída: <span className="text-foreground">{new Date(child.checkInOut.checkOutTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                          {child.checkInOut.pickedUpBy && <span className="opacity-60 text-[10px]">({child.checkInOut.pickedUpBy})</span>}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0">
                  {!isPresent ? (
                    <button
                      onClick={() => openModal('in', child)}
                      className="btn-primary w-full md:w-auto py-3.5 px-8 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2.5 shadow-lg shadow-primary/20"
                    >
                      <LogIn className="w-4 h-4" />
                      Check-in
                    </button>
                  ) : (
                    <button
                      onClick={() => openModal('out', child)}
                      className="btn-secondary w-full md:w-auto py-3.5 px-8 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2.5"
                    >
                      <LogOut className="w-4 h-4" />
                      Check-out
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal de Check-in/out */}
      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.type === 'in' ? 'Registrar entrada' : 'Registrar saída'}
        subtitle={modal?.child.fullName}
      >
        {modal && (
          <div className="space-y-6">
            {/* Pessoas autorizadas */}
            {modal.type === 'out' && modal.child.authorizedPersons.length > 0 && (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-4 h-4 text-emerald-500" />
                  <p className="text-xs font-black text-emerald-500 uppercase tracking-widest">Pessoas autorizadas</p>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {modal.child.authorizedPersons.map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, personName: p.name }))}
                      className="w-full text-left text-xs text-emerald-600/80 hover:text-emerald-500 py-2 px-3 rounded-xl hover:bg-emerald-500/10 transition-all border border-transparent hover:border-emerald-500/20"
                    >
                      <span className="font-bold">{p.name}</span> — {p.relationship}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="label">
                  {modal.type === 'in' ? 'Quem está trazendo *' : 'Quem está buscando *'}
                </label>
                <input
                  className="input"
                  placeholder="Nome completo"
                  value={form.personName}
                  onChange={(e) => setForm((p) => ({ ...p, personName: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">CPF / RG (opcional)</label>
                  <input
                    className="input"
                    placeholder="Documento"
                    value={form.personDoc}
                    onChange={(e) => setForm((p) => ({ ...p, personDoc: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">Observação</label>
                  <input
                    className="input"
                    placeholder="Ex: Veio de Uber"
                    value={form.note}
                    onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)} className="btn-secondary flex-1 py-3.5">
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={handleSubmit} 
                disabled={loading} 
                className="btn-primary flex-1 py-3.5 font-black uppercase tracking-widest text-xs"
              >
                {loading ? 'Processando...' : modal.type === 'in' ? 'Confirmar entrada' : 'Confirmar saída'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
