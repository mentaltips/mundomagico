'use client'

import { useState } from 'react'
import { Package, AlertTriangle, Plus, X, Check, Loader2, Minus, RefreshCw } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ITEM_TYPE_LABELS, ITEM_TYPE_EMOJIS, ITEM_TYPES } from '@mundo-magico/types'
import toast from 'react-hot-toast'

type ChildItem = {
  id: string
  childId: string
  itemType: string
  description: string | null
  quantityReceived: number
  quantityUsed: number
  alertThreshold: number
  notes: string | null
  child: { id: string; fullName: string; photoUrl: string | null }
}

export default function ChildItemsPage() {
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [useModal, setUseModal]   = useState<ChildItem | null>(null)
  const [repModal, setRepModal]   = useState<ChildItem | null>(null)
  const [saving, setSaving]       = useState(false)
  const [qty, setQty]             = useState(1)
  const [form, setForm]           = useState({
    childId: '', itemType: 'FRALDA', quantityReceived: '10', alertThreshold: '5', notes: '',
  })

  const { data: items = [], isLoading } = useQuery<ChildItem[]>({
    queryKey: ['child-items'],
    queryFn: () => fetch('/api/child-items').then((r) => r.json()),
  })

  const { data: children = [] } = useQuery<{ id: string; fullName: string }[]>({
    queryKey: ['children-list'],
    queryFn: () => fetch('/api/children').then((r) => r.json()),
  })

  const lowItems = items.filter((item) => item.quantityReceived - item.quantityUsed <= item.alertThreshold)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.childId) { toast.error('Selecione uma criança'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/child-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId:          form.childId,
          itemType:         form.itemType,
          quantityReceived: Number(form.quantityReceived),
          alertThreshold:   Number(form.alertThreshold),
          notes:            form.notes || undefined,
        }),
      })
      if (res.ok) {
        toast.success('Item cadastrado!')
        setShowModal(false)
        setForm({ childId: '', itemType: 'FRALDA', quantityReceived: '10', alertThreshold: '5', notes: '' })
        queryClient.invalidateQueries({ queryKey: ['child-items'] })
      } else {
        toast.error('Erro ao cadastrar item')
      }
    } catch { toast.error('Erro ao cadastrar item') }
    finally { setSaving(false) }
  }

  const handleUse = async () => {
    if (!useModal) return
    setSaving(true)
    try {
      const res = await fetch(`/api/child-items/${useModal.id}/use`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: qty }),
      })
      if (res.ok) {
        toast.success('Uso registrado!')
        setUseModal(null)
        setQty(1)
        queryClient.invalidateQueries({ queryKey: ['child-items'] })
      } else {
        const err = await res.json()
        toast.error(err.error ?? 'Erro ao registrar uso')
      }
    } catch { toast.error('Erro ao registrar uso') }
    finally { setSaving(false) }
  }

  const handleReplenish = async () => {
    if (!repModal) return
    setSaving(true)
    try {
      const res = await fetch(`/api/child-items/${repModal.id}/replenish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: qty }),
      })
      if (res.ok) {
        toast.success('Estoque reposto!')
        setRepModal(null)
        setQty(1)
        queryClient.invalidateQueries({ queryKey: ['child-items'] })
      } else {
        toast.error('Erro ao repor estoque')
      }
    } catch { toast.error('Erro ao repor estoque') }
    finally { setSaving(false) }
  }

  return (
    <div className="p-4 md:p-8 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Itens das Crianças</h1>
          <p className="text-sm text-gray-500 mt-0.5">Controle de fraldas, lenços e outros itens enviados pelos responsáveis</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-black shadow-lg shadow-lime-100 hover:bg-lime-600 transition-all"
        >
          <Plus size={18} />
          Novo Item
        </button>
      </div>

      {/* Alertas */}
      {lowItems.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-3xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <p className="font-black text-orange-800">{lowItems.length} item(ns) com estoque baixo!</p>
          </div>
          <div className="space-y-2">
            {lowItems.map((item) => {
              const remaining = item.quantityReceived - item.quantityUsed
              return (
                <div key={item.id} className="flex items-center justify-between bg-white rounded-2xl px-4 py-3 border border-orange-100">
                  <div>
                    <p className="font-bold text-gray-900">
                      {ITEM_TYPE_EMOJIS[item.itemType as keyof typeof ITEM_TYPE_EMOJIS]}{' '}
                      {item.child.fullName} — {ITEM_TYPE_LABELS[item.itemType as keyof typeof ITEM_TYPE_LABELS]}
                    </p>
                    <p className="text-xs text-orange-600 font-medium">
                      Restam apenas {remaining} unidade{remaining !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => { setRepModal(item); setQty(10) }}
                    className="text-xs font-black bg-orange-100 text-orange-700 px-3 py-1.5 rounded-xl hover:bg-orange-200 transition-colors"
                  >
                    + Repor
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Lista */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50/50 flex items-center justify-between">
          <p className="font-black text-gray-700">Todos os itens ({items.length})</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="text-primary animate-spin" size={32} />
          </div>
        ) : items.length === 0 ? (
          <div className="p-16 text-center">
            <Package className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-bold">Nenhum item cadastrado</p>
            <button onClick={() => setShowModal(true)} className="mt-4 text-primary font-black text-sm hover:underline">
              + Cadastrar primeiro item
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {items.map((item) => {
              const remaining = item.quantityReceived - item.quantityUsed
              const isLow = remaining <= item.alertThreshold
              const pct = Math.min((remaining / Math.max(item.quantityReceived, 1)) * 100, 100)
              return (
                <div key={item.id} className="p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <span className="text-3xl shrink-0">
                      {ITEM_TYPE_EMOJIS[item.itemType as keyof typeof ITEM_TYPE_EMOJIS] ?? '📦'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-gray-900 truncate">{item.child.fullName}</p>
                      <p className="text-sm font-bold text-gray-500">
                        {ITEM_TYPE_LABELS[item.itemType as keyof typeof ITEM_TYPE_LABELS] ?? item.itemType}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${isLow ? 'bg-orange-400' : 'bg-emerald-400'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className={`text-xs font-black whitespace-nowrap ${isLow ? 'text-orange-600' : 'text-emerald-600'}`}>
                          {remaining} restante{remaining !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex gap-4 mt-1">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Recebido: {item.quantityReceived}</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Usado: {item.quantityUsed}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => { setUseModal(item); setQty(1) }}
                      className="flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-black hover:bg-gray-200 transition-colors"
                    >
                      <Minus size={14} />
                      Usar
                    </button>
                    <button
                      onClick={() => { setRepModal(item); setQty(10) }}
                      className="flex items-center gap-1 px-3 py-2 bg-primary text-white rounded-xl text-xs font-black hover:bg-lime-600 transition-colors"
                    >
                      <RefreshCw size={14} />
                      Repor
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal: Novo Item */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="bg-white w-full sm:max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl relative z-10 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-gray-900">Novo Item</h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Criança *</label>
                <select
                  value={form.childId}
                  onChange={(e) => setForm((p) => ({ ...p, childId: e.target.value }))}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-lime-200"
                >
                  <option value="">Selecione...</option>
                  {(children as { id: string; fullName: string }[]).map((c) => (
                    <option key={c.id} value={c.id}>{c.fullName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Tipo de Item *</label>
                <select
                  value={form.itemType}
                  onChange={(e) => setForm((p) => ({ ...p, itemType: e.target.value }))}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-lime-200"
                >
                  {ITEM_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {ITEM_TYPE_EMOJIS[t]} {ITEM_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Qtd. Recebida</label>
                  <input
                    type="number" min={0} value={form.quantityReceived}
                    onChange={(e) => setForm((p) => ({ ...p, quantityReceived: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-lime-200"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Alerta em</label>
                  <input
                    type="number" min={0} value={form.alertThreshold}
                    onChange={(e) => setForm((p) => ({ ...p, alertThreshold: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-lime-200"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-2xl border border-gray-200 font-black text-sm text-gray-500">Cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 py-3 rounded-2xl bg-primary text-white font-black text-sm hover:bg-lime-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  Cadastrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Usar Item */}
      {useModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setUseModal(null)} />
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl relative z-10 p-8">
            <h2 className="text-xl font-black text-gray-900 mb-1">Registrar Uso</h2>
            <p className="text-sm text-gray-500 mb-6">
              {ITEM_TYPE_EMOJIS[useModal.itemType as keyof typeof ITEM_TYPE_EMOJIS]}{' '}
              {ITEM_TYPE_LABELS[useModal.itemType as keyof typeof ITEM_TYPE_LABELS]} — {useModal.child.fullName}
            </p>
            <div className="flex items-center justify-center gap-6 mb-8">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-700 font-black text-xl hover:bg-gray-200 flex items-center justify-center">−</button>
              <span className="text-4xl font-black text-gray-900 w-12 text-center">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-700 font-black text-xl hover:bg-gray-200 flex items-center justify-center">+</button>
            </div>
            <p className="text-center text-xs text-gray-400 mb-6">
              Restam {useModal.quantityReceived - useModal.quantityUsed} unidades
            </p>
            <div className="flex gap-3">
              <button onClick={() => setUseModal(null)} className="flex-1 py-3 rounded-2xl border border-gray-200 font-black text-sm text-gray-500">Cancelar</button>
              <button onClick={handleUse} disabled={saving} className="flex-1 py-3 rounded-2xl bg-gray-900 text-white font-black text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Minus size={16} />}
                Registrar uso
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Repor Estoque */}
      {repModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setRepModal(null)} />
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl relative z-10 p-8">
            <h2 className="text-xl font-black text-gray-900 mb-1">Repor Estoque</h2>
            <p className="text-sm text-gray-500 mb-6">
              {ITEM_TYPE_EMOJIS[repModal.itemType as keyof typeof ITEM_TYPE_EMOJIS]}{' '}
              {ITEM_TYPE_LABELS[repModal.itemType as keyof typeof ITEM_TYPE_LABELS]} — {repModal.child.fullName}
            </p>
            <div className="flex items-center justify-center gap-6 mb-8">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-700 font-black text-xl hover:bg-gray-200 flex items-center justify-center">−</button>
              <span className="text-4xl font-black text-gray-900 w-12 text-center">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-700 font-black text-xl hover:bg-gray-200 flex items-center justify-center">+</button>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setRepModal(null)} className="flex-1 py-3 rounded-2xl border border-gray-200 font-black text-sm text-gray-500">Cancelar</button>
              <button onClick={handleReplenish} disabled={saving} className="flex-1 py-3 rounded-2xl bg-primary text-white font-black text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                Repor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
