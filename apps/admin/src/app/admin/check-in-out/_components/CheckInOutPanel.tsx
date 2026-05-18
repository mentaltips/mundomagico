'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { LogIn, LogOut, Shield, AlertTriangle, Search, Clock, Users, X, CheckCircle2, Loader2 } from 'lucide-react'
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
  initialChildren: ChildData[]
}

const STATUS_RANK: Record<string, number> = {
  AUSENTE: 0,
  PRESENTE: 1,
  AGUARDANDO_RETIRADA: 2,
  SAIU_MAIS_CEDO: 3,
}

export function CheckInOutPanel({ date, initialChildren }: Props) {
  console.log('CheckInOutPanel render:', { date, childrenCount: initialChildren.length, statuses: initialChildren.map(c => c.checkInOut?.status) })
  const router = useRouter()
  const [childrenList, setChildrenList] = useState<ChildData[]>(initialChildren)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Sincronizar estado local quando os props mudam (ex: após router.refresh)
  // Mantém o estado otimista se o servidor ainda não confirmou a mudança
  useEffect(() => {
    setChildrenList(prev =>
      initialChildren.map(serverChild => {
        const local = prev.find(c => c.id === serverChild.id)
        // Se o estado local é mais avançado que o servidor (race condition), mantém o local
        const localRank  = STATUS_RANK[local?.checkInOut?.status ?? 'AUSENTE'] ?? 0
        const serverRank = STATUS_RANK[serverChild.checkInOut?.status ?? 'AUSENTE'] ?? 0
        if (local && localRank > serverRank) return local
        return serverChild
      })
    )
    setIsRefreshing(false)
  }, [initialChildren])

  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<{
    type: 'in' | 'out'
    child: ChildData
  } | null>(null)
  const [form, setForm] = useState({ personName: '', personDoc: '', note: '' })
  const [loading, setLoading] = useState(false)

  const filtered = childrenList.filter((c) =>
    (c.fullName || '').toLowerCase().includes(search.toLowerCase())
  )

  const getStatus = (child: ChildData) => {
    const record = child.checkInOut
    if (!record) return 'AUSENTE'
    
    // Fallback: se tiver horário de entrada mas não de saída, está presente
    if (record.status === 'PRESENTE' || (record.checkInTime && !record.checkOutTime)) {
      return 'PRESENTE'
    }
    
    return record.status || 'AUSENTE'
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
          status: modal.type === 'in' ? 'PRESENTE' : 'AGUARDANDO_RETIRADA',
          ...(modal.type === 'in' ? {
            checkInTime: new Date().toISOString(),
            broughtBy: form.personName,
            broughtByDoc: form.personDoc,
            checkInNote: form.note,
          } : {
            checkOutTime: new Date().toISOString(),
            pickedUpBy: form.personName,
            pickedUpByDoc: form.personDoc,
            checkOutNote: form.note,
          })
        }),
      })
      if (!res.ok) throw new Error()
      toast.success(
        modal.type === 'in'
          ? `✅ ${modal.child.fullName} deu entrada!`
          : `👋 ${modal.child.fullName} foi embora!`
      )
      // Atualização otimista local para feedback instantâneo
      const newStatus = modal.type === 'in' ? 'PRESENTE' : 'AGUARDANDO_RETIRADA'
      setChildrenList((prev: ChildData[]) => prev.map((c: ChildData) => 
        c.id === modal.child.id 
          ? { 
              ...c, 
              checkInOut: { 
                ...(c.checkInOut || { id: 'temp', status: 'AUSENTE' }), 
                status: newStatus,
                ...(modal.type === 'in' ? { checkInTime: new Date(), broughtBy: form.personName } : { checkOutTime: new Date(), pickedUpBy: form.personName })
              } 
            } 
          : c
      ))

      setModal(null)
      setIsRefreshing(true)
      
      // Delay de 1 segundo para garantir que o banco persistiu e o cache limpou
      setTimeout(() => {
        router.refresh()
      }, 1000)
    } catch (err) {
      console.error('Check-in error:', err)
      toast.error('Erro ao registrar. Tente novamente.')
      setIsRefreshing(false)
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
      {/* Overlay de Sincronização */}
      {isRefreshing && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex flex-col items-center justify-center gap-4">
          <div className="bg-accent/90 border border-white/10 p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-4 animate-in zoom-in duration-300">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <div className="text-center">
              <h3 className="font-bold text-lg">Sincronizando Dados</h3>
              <p className="text-sm text-muted-foreground">Confirmando presença com o servidor...</p>
            </div>
          </div>
        </div>
      )}

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
            {/* Pessoas autorizadas/responsáveis */}
            {modal.child.authorizedPersons.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Responsáveis Autorizados</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {modal.child.authorizedPersons.map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setForm((prev) => ({ 
                        ...prev, 
                        personName: p.name,
                        personDoc: p.cpf || prev.personDoc
                      }))}
                      className={`group w-full text-left p-3 rounded-2xl border transition-all flex flex-col gap-1 ${
                        form.personName === p.name 
                          ? 'bg-primary/10 border-primary shadow-lg shadow-primary/10' 
                          : 'bg-accent/20 border-border/40 hover:border-primary/30 hover:bg-accent/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-foreground">{p.name}</span>
                        {p.type === 'guardian' && <Badge label="Pai/Mãe" variant="primary" size="sm" />}
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{p.relationship}</span>
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
