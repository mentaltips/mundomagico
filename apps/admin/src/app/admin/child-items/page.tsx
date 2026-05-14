'use client'

import { useState } from 'react'
import { Package, AlertTriangle, Plus, X, Check, Loader2, Minus, RefreshCw, Box } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ITEM_TYPE_LABELS, ITEM_TYPE_EMOJIS, ITEM_TYPES } from '@mundo-magico/types'
import { PageHeader, EmptyState, Modal, Alert, LoadingState, Badge } from '@/components/ui'
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

  const { data: rawItems, isLoading } = useQuery({
    queryKey: ['child-items'],
    queryFn: () => fetch('/api/child-items').then((r) => r.json()),
  })
  const items: ChildItem[] = Array.isArray(rawItems) ? rawItems : []

  const { data: rawChildren } = useQuery({
    queryKey: ['children-list'],
    queryFn: () => fetch('/api/children').then((r) => r.json()),
  })
  const children: { id: string; fullName: string }[] = Array.isArray(rawChildren) ? rawChildren : []

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
    <div className="page animate-in">
      <PageHeader 
        title="Estoque das Crianças" 
        subtitle="Controle de fraldas, lenços e itens enviados pelos pais."
        icon={<Box size={24} />}
        actions={
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus size={18} /> Novo Item
          </button>
        }
      />

      {lowItems.length > 0 && (
        <Alert variant="warning">
          <p className="font-black mb-2 flex items-center gap-2">
            <AlertTriangle size={16} /> {lowItems.length} item(ns) com estoque baixo!
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
            {lowItems.map((item) => (
              <div key={item.id} className="bg-background/50 p-3 rounded-xl border border-amber-500/20 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-black truncate">{item.child.fullName}</p>
                  <p className="text-[10px] opacity-70 font-bold uppercase tracking-widest">
                    {ITEM_TYPE_EMOJIS[item.itemType as keyof typeof ITEM_TYPE_EMOJIS]} {ITEM_TYPE_LABELS[item.itemType as keyof typeof ITEM_TYPE_LABELS]}
                  </p>
                </div>
                <button
                  onClick={() => { setRepModal(item); setQty(10) }}
                  className="px-3 py-1 bg-amber-500 text-white rounded-lg text-[10px] font-black uppercase hover:bg-amber-600 transition-colors shrink-0"
                >
                  Repor
                </button>
              </div>
            ))}
          </div>
        </Alert>
      )}

      {isLoading ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <EmptyState 
          icon={<Package size={32} />}
          title="Nenhum item cadastrado"
          description="Os pais ainda não enviaram itens ou você ainda não os registrou."
          action={
            <button onClick={() => setShowModal(true)} className="btn-primary">
              Registrar Primeiro Item
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => {
            const remaining = item.quantityReceived - item.quantityUsed
            const isLow = remaining <= item.alertThreshold
            const pct = Math.min((remaining / Math.max(item.quantityReceived, 1)) * 100, 100)
            
            return (
              <div key={item.id} className="card-hover p-6 flex flex-col group">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-sm border border-border/50">
                      {ITEM_TYPE_EMOJIS[item.itemType as keyof typeof ITEM_TYPE_EMOJIS] ?? '📦'}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-black text-foreground leading-tight truncate">{item.child.fullName}</h3>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-1">
                        {ITEM_TYPE_LABELS[item.itemType as keyof typeof ITEM_TYPE_LABELS] ?? item.itemType}
                      </p>
                    </div>
                  </div>
                  {isLow && <Badge label="Baixo" variant="red" dot size="sm" />}
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Estoque Atual</span>
                      <span className={`text-sm font-black ${isLow ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {remaining} unidades
                      </span>
                    </div>
                    <div className="h-2 bg-accent rounded-full overflow-hidden shadow-inner">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${isLow ? 'bg-rose-500' : 'bg-emerald-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">
                    <span>Recebido: {item.quantityReceived}</span>
                    <span>Usado: {item.quantityUsed}</span>
                  </div>
                </div>

                <div className="mt-auto pt-6 border-t border-border/50 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => { setUseModal(item); setQty(1) }}
                    className="btn-ghost py-2.5 text-xs font-black gap-2"
                  >
                    <Minus size={14} /> Usar
                  </button>
                  <button
                    onClick={() => { setRepModal(item); setQty(10) }}
                    className="btn-primary py-2.5 text-xs font-black gap-2"
                  >
                    <RefreshCw size={14} /> Repor
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal: Novo Item */}
      <Modal 
        open={showModal} 
        onClose={() => setShowModal(false)}
        title="Novo Item em Estoque"
        subtitle="Registre o recebimento de itens enviados pelos pais."
      >
        <form onSubmit={handleCreate} className="space-y-5">
          <div>
            <label className="label">Criança *</label>
            <select
              required
              value={form.childId}
              onChange={(e) => setForm((p) => ({ ...p, childId: e.target.value }))}
              className="select"
            >
              <option value="">Selecione uma criança...</option>
              {children.map((c: any) => (
                <option key={c.id} value={c.id}>{c.fullName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Tipo de Item *</label>
            <select
              value={form.itemType}
              onChange={(e) => setForm((p) => ({ ...p, itemType: e.target.value }))}
              className="select"
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
              <label className="label">Qtd. Recebida</label>
              <input
                type="number" min={1} required value={form.quantityReceived}
                onChange={(e) => setForm((p) => ({ ...p, quantityReceived: e.target.value }))}
                className="input"
              />
            </div>
            <div>
              <label className="label">Alerta (Qtd. Baixa)</label>
              <input
                type="number" min={0} required value={form.alertThreshold}
                onChange={(e) => setForm((p) => ({ ...p, alertThreshold: e.target.value }))}
                className="input"
              />
            </div>
          </div>
          <div className="pt-4 flex gap-3 border-t border-border/50">
            <button type="button" onClick={() => setShowModal(false)} className="btn-ghost flex-1">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 gap-2">
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
              Cadastrar Item
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Usar Item */}
      <Modal
        open={!!useModal}
        onClose={() => setUseModal(null)}
        title="Registrar Uso"
      >
        {useModal && (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-accent rounded-[2rem] flex items-center justify-center text-4xl mx-auto mb-4 border border-border/50 shadow-sm">
                {ITEM_TYPE_EMOJIS[useModal.itemType as keyof typeof ITEM_TYPE_EMOJIS]}
              </div>
              <h3 className="text-lg font-black text-foreground">{useModal.child.fullName}</h3>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">
                {ITEM_TYPE_LABELS[useModal.itemType as keyof typeof ITEM_TYPE_LABELS]}
              </p>
            </div>

            <div className="flex items-center justify-center gap-8">
              <button 
                onClick={() => setQty((q) => Math.max(1, q - 1))} 
                className="w-14 h-14 rounded-2xl bg-accent hover:bg-accent/80 text-foreground font-black text-2xl transition-all shadow-sm"
              >
                −
              </button>
              <div className="flex flex-col items-center">
                <span className="text-5xl font-black text-foreground tabular-nums">{qty}</span>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-2">Unidade(s)</span>
              </div>
              <button 
                onClick={() => setQty((q) => q + 1)} 
                className="w-14 h-14 rounded-2xl bg-accent hover:bg-accent/80 text-foreground font-black text-2xl transition-all shadow-sm"
              >
                +
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <button onClick={handleUse} disabled={saving} className="w-full btn-primary py-4 gap-3 text-sm">
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Minus size={18} />}
                Confirmar Uso
              </button>
              <button onClick={() => setUseModal(null)} className="w-full btn-ghost py-3">
                Cancelar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Repor Estoque */}
      <Modal
        open={!!repModal}
        onClose={() => setRepModal(null)}
        title="Repor Estoque"
      >
        {repModal && (
          <div className="space-y-8">
             <div className="text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center text-4xl mx-auto mb-4 border border-primary/20 shadow-sm">
                <RefreshCw size={32} className="text-primary" />
              </div>
              <h3 className="text-lg font-black text-foreground">{repModal.child.fullName}</h3>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">
                {ITEM_TYPE_EMOJIS[repModal.itemType as keyof typeof ITEM_TYPE_EMOJIS]} {ITEM_TYPE_LABELS[repModal.itemType as keyof typeof ITEM_TYPE_LABELS]}
              </p>
            </div>

            <div className="flex items-center justify-center gap-8">
              <button 
                onClick={() => setQty((q) => Math.max(1, q - 1))} 
                className="w-14 h-14 rounded-2xl bg-accent hover:bg-accent/80 text-foreground font-black text-2xl transition-all shadow-sm"
              >
                −
              </button>
              <div className="flex flex-col items-center">
                <span className="text-5xl font-black text-foreground tabular-nums">{qty}</span>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-2">Unidade(s)</span>
              </div>
              <button 
                onClick={() => setQty((q) => q + 1)} 
                className="w-14 h-14 rounded-2xl bg-accent hover:bg-accent/80 text-foreground font-black text-2xl transition-all shadow-sm"
              >
                +
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <button onClick={handleReplenish} disabled={saving} className="w-full btn-primary py-4 gap-3 text-sm">
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                Registrar Reposição
              </button>
              <button onClick={() => setRepModal(null)} className="w-full btn-ghost py-3">
                Cancelar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
