'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { ShieldCheck, Plus, X, Check, Loader2, Trash2, Phone, User } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AUTHORIZATION_LABELS } from '@mundo-magico/types'
import toast from 'react-hot-toast'
import Link from 'next/link'

type Person = {
  id: string
  childId: string
  fullName: string
  cpf: string | null
  rg: string | null
  phone: string
  relationship: string
  photoUrl: string | null
  authorization: string
  validUntil: string | null
  observations: string | null
}

const RELATIONSHIP_OPTIONS = [
  'Pai', 'Mãe', 'Avô', 'Avó', 'Tio(a)', 'Irmão/Irmã', 'Padrinho/Madrinha', 'Vizinho(a)', 'Outro',
]

const AUTH_COLORS: Record<string, string> = {
  SIM:       'bg-emerald-50 text-emerald-700',
  NAO:       'bg-red-50 text-red-700',
  TEMPORARIO: 'bg-amber-50 text-amber-700',
}

export default function AuthorizedPickupsPage() {
  const { id: childId } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving]       = useState(false)
  const [deleting, setDeleting]   = useState<string | null>(null)
  const [form, setForm]           = useState({
    fullName: '', phone: '', relationship: 'Outro', cpf: '', rg: '',
    authorization: 'SIM', validUntil: '', observations: '',
  })

  const { data: persons = [], isLoading } = useQuery<Person[]>({
    queryKey: ['authorized-pickups', childId],
    queryFn: () => fetch(`/api/children/${childId}/authorized-pickups`).then((r) => r.json()),
  })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.fullName || !form.phone) { toast.error('Preencha nome e telefone'); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/children/${childId}/authorized-pickups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName:      form.fullName,
          phone:         form.phone,
          relationship:  form.relationship,
          cpf:           form.cpf || undefined,
          rg:            form.rg || undefined,
          authorization: form.authorization,
          validUntil:    form.validUntil || undefined,
          observations:  form.observations || undefined,
        }),
      })
      if (res.ok) {
        toast.success('Pessoa autorizada cadastrada!')
        setShowModal(false)
        setForm({ fullName: '', phone: '', relationship: 'Outro', cpf: '', rg: '', authorization: 'SIM', validUntil: '', observations: '' })
        queryClient.invalidateQueries({ queryKey: ['authorized-pickups', childId] })
      } else {
        toast.error('Erro ao cadastrar')
      }
    } catch { toast.error('Erro ao cadastrar') }
    finally { setSaving(false) }
  }

  const handleDelete = async (personId: string) => {
    if (!confirm('Remover esta pessoa da lista de autorizados?')) return
    setDeleting(personId)
    try {
      const res = await fetch(`/api/children/${childId}/authorized-pickups/${personId}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Removido!')
        queryClient.invalidateQueries({ queryKey: ['authorized-pickups', childId] })
      } else {
        toast.error('Erro ao remover')
      }
    } catch { toast.error('Erro ao remover') }
    finally { setDeleting(null) }
  }

  return (
    <div className="p-4 md:p-8 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-400 font-bold mb-1">
            <Link href={`/admin/children/${childId}`} className="hover:text-primary transition-colors">← Voltar para a criança</Link>
          </div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <ShieldCheck className="text-primary" size={28} />
            Pessoas Autorizadas a Buscar
          </h1>
          <p className="text-sm text-gray-500 mt-1">Controle quem pode retirar esta criança da escola</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-black shadow-lg shadow-lime-100 hover:bg-lime-600 transition-all"
        >
          <Plus size={18} />
          Adicionar Pessoa
        </button>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="text-primary animate-spin" size={32} />
        </div>
      ) : persons.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-16 text-center">
          <ShieldCheck className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-bold">Nenhuma pessoa autorizada cadastrada</p>
          <button onClick={() => setShowModal(true)} className="mt-4 text-primary font-black text-sm hover:underline">
            + Adicionar primeira pessoa
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {persons.map((person) => (
            <div key={person.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-xl shrink-0">
                {person.fullName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-black text-gray-900 truncate">{person.fullName}</p>
                    <p className="text-sm text-gray-500 font-medium">{person.relationship}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 ${AUTH_COLORS[person.authorization] ?? 'bg-gray-50 text-gray-500'}`}>
                    {AUTHORIZATION_LABELS[person.authorization as keyof typeof AUTHORIZATION_LABELS] ?? person.authorization}
                  </span>
                </div>
                <div className="mt-3 space-y-1">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone size={14} className="text-gray-400 shrink-0" />
                    <span className="font-bold">{person.phone}</span>
                  </div>
                  {(person.cpf || person.rg) && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <User size={14} className="text-gray-400 shrink-0" />
                      <span>
                        {person.cpf && `CPF: ${person.cpf}`}
                        {person.cpf && person.rg && ' · '}
                        {person.rg && `RG: ${person.rg}`}
                      </span>
                    </div>
                  )}
                  {person.authorization === 'TEMPORARIO' && person.validUntil && (
                    <p className="text-xs text-amber-600 font-bold mt-1">
                      Válido até: {new Date(person.validUntil).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => handleDelete(person.id)}
                    disabled={deleting === person.id}
                    className="text-gray-300 hover:text-red-500 transition-colors p-2 rounded-xl hover:bg-red-50"
                  >
                    {deleting === person.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="bg-white w-full sm:max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl relative z-10 p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-gray-900">Adicionar Pessoa Autorizada</h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Nome completo *</label>
                <input
                  type="text" required value={form.fullName}
                  onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                  placeholder="Ex: Maria da Silva"
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-lime-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Telefone *</label>
                  <input
                    type="tel" required value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="(11) 99999-9999"
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-lime-200"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Parentesco *</label>
                  <select
                    value={form.relationship}
                    onChange={(e) => setForm((p) => ({ ...p, relationship: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-lime-200"
                  >
                    {RELATIONSHIP_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">CPF</label>
                  <input
                    type="text" value={form.cpf}
                    onChange={(e) => setForm((p) => ({ ...p, cpf: e.target.value }))}
                    placeholder="000.000.000-00"
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-lime-200"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">RG</label>
                  <input
                    type="text" value={form.rg}
                    onChange={(e) => setForm((p) => ({ ...p, rg: e.target.value }))}
                    placeholder="00.000.000-0"
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-lime-200"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Autorização</label>
                <select
                  value={form.authorization}
                  onChange={(e) => setForm((p) => ({ ...p, authorization: e.target.value }))}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-lime-200"
                >
                  <option value="SIM">✅ Autorizado</option>
                  <option value="TEMPORARIO">⏳ Autorização temporária</option>
                  <option value="NAO">❌ Não autorizado</option>
                </select>
              </div>
              {form.authorization === 'TEMPORARIO' && (
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Válido até</label>
                  <input
                    type="date" value={form.validUntil}
                    onChange={(e) => setForm((p) => ({ ...p, validUntil: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-lime-200"
                  />
                </div>
              )}
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Observações</label>
                <textarea
                  value={form.observations}
                  onChange={(e) => setForm((p) => ({ ...p, observations: e.target.value }))}
                  rows={2}
                  placeholder="Informações adicionais..."
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-lime-200 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-2xl border border-gray-200 font-black text-sm text-gray-500">Cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 py-3 rounded-2xl bg-primary text-white font-black text-sm hover:bg-lime-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
