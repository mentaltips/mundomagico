'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { LogIn, LogOut, Shield, AlertTriangle, Search, Clock } from 'lucide-react'

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
    c.fullName.toLowerCase().includes(search.toLowerCase())
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
        (p) => p.name.toLowerCase().includes(form.personName.toLowerCase()) ||
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

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    PRESENTE:           { label: 'Presente',          color: 'text-green-700',  bg: 'bg-green-50 border-green-200' },
    AUSENTE:            { label: 'Ausente',            color: 'text-gray-500',   bg: 'bg-gray-50 border-gray-200' },
    SAIU_MAIS_CEDO:     { label: 'Saiu mais cedo',     color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
    AGUARDANDO_RETIRADA:{ label: 'Aguardando retirada',color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200' },
  }

  return (
    <>
      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          className="input pl-9 w-full"
          placeholder="Buscar criança..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {filtered.map((child) => {
          const status = getStatus(child)
          const cfg = statusConfig[status] ?? statusConfig.AUSENTE
          const isPresent = status === 'PRESENTE' || status === 'AGUARDANDO_RETIRADA'

          return (
            <div key={child.id} className={`card p-4 border ${cfg.bg}`}>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  {child.photoUrl ? (
                    <img src={child.photoUrl} className="w-11 h-11 rounded-full object-cover" alt={child.fullName} />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-lime-100 flex items-center justify-center text-primary font-bold">
                      {child.fullName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">{child.fullName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                      {child.checkInOut?.checkInTime && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Entrada: {new Date(child.checkInOut.checkInTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          {child.checkInOut.broughtBy && ` por ${child.checkInOut.broughtBy}`}
                        </span>
                      )}
                      {child.checkInOut?.checkOutTime && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Saída: {new Date(child.checkInOut.checkOutTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          {child.checkInOut.pickedUpBy && ` com ${child.checkInOut.pickedUpBy}`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {!isPresent && (
                    <button
                      onClick={() => openModal('in', child)}
                      className="btn-primary text-xs px-3 py-1.5"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      Check-in
                    </button>
                  )}
                  {isPresent && (
                    <button
                      onClick={() => openModal('out', child)}
                      className="btn-secondary text-xs px-3 py-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
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
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center gap-3">
              {modal.type === 'in' ? (
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <LogIn className="w-5 h-5 text-green-600" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <LogOut className="w-5 h-5 text-blue-600" />
                </div>
              )}
              <div>
                <h2 className="font-bold text-gray-900">
                  {modal.type === 'in' ? 'Registrar entrada' : 'Registrar saída'}
                </h2>
                <p className="text-sm text-gray-500">{modal.child.fullName}</p>
              </div>
            </div>

            {/* Pessoas autorizadas */}
            {modal.type === 'out' && modal.child.authorizedPersons.length > 0 && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-green-600" />
                  <p className="text-sm font-medium text-green-800">Pessoas autorizadas</p>
                </div>
                <div className="space-y-1">
                  {modal.child.authorizedPersons.map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, personName: p.name }))}
                      className="w-full text-left text-xs text-green-700 hover:text-green-900 py-1 px-2 rounded hover:bg-green-100"
                    >
                      {p.name} — {p.relationship} ({p.phone})
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
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
              <div>
                <label className="label">CPF / RG (opcional)</label>
                <input
                  className="input"
                  placeholder="Documento para conferência"
                  value={form.personDoc}
                  onChange={(e) => setForm((p) => ({ ...p, personDoc: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Observação</label>
                <input
                  className="input"
                  placeholder="Alguma observação..."
                  value={form.note}
                  onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setModal(null)} className="btn-secondary flex-1">
                Cancelar
              </button>
              <button type="button" onClick={handleSubmit} disabled={loading} className="btn-primary flex-1">
                {loading ? 'Registrando...' : modal.type === 'in' ? '✅ Confirmar entrada' : '👋 Confirmar saída'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
