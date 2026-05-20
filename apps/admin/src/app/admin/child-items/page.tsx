'use client'

import { useState } from 'react'
import { Package, AlertTriangle, Plus, X, Check, Loader2, Minus, RefreshCw, Box } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ITEM_TYPE_LABELS, ITEM_TYPE_EMOJIS, ITEM_TYPES } from '@mundo-magico/types'
import { PageHeader, EmptyState, Modal, Alert, LoadingState, Avatar } from '@/components/ui'
import toast from 'react-hot-toast'
import { getErrorMessage } from '@/lib/utils'


type ChildItem = {
  id: string
  childId: string
  itemType: string
  description: string | null
  quantityReceived: number
  quantityUsed: number
  alertThreshold: number
  notes: string | null
  child: { id: string; fullName: string; photoUrl: string | null; group?: { name: string } | null }
}

type GroupedChild = {
  child: ChildItem['child']
  items: ChildItem[]
}

export default function ChildItemsPage() {
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [useModal, setUseModal]   = useState<ChildItem | null>(null)
  const [repModal, setRepModal]   = useState<ChildItem | null>(null)
  const [saving, setSaving]       = useState(false)
  const [qty, setQty]             = useState(1)
  const [search, setSearch]       = useState('')
  const [form, setForm]           = useState({
    childId: '', itemType: 'FRALDA', quantityReceived: '10', alertThreshold: '5', notes: '',
  })

  const { data: rawItems, isLoading } = useQuery({
    queryKey: ['child-items'],
    queryFn: () => fetch('/api/child-items').then(r => r.json()),
  })
  const items: ChildItem[] = Array.isArray(rawItems) ? rawItems : []

  const { data: rawChildren } = useQuery({
    queryKey: ['children-list'],
    queryFn: () => fetch('/api/children').then(r => r.json()),
  })
  const children: { id: string; fullName: string }[] = Array.isArray(rawChildren) ? rawChildren : []

  const filteredItems = items.filter(item => 
    item.child?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    item.itemType?.toLowerCase().includes(search.toLowerCase())
  )

  // Group items by child
  const grouped: GroupedChild[] = Object.values(
    filteredItems.reduce<Record<string, GroupedChild>>((acc, item) => {
      if (!acc[item.childId]) {
        acc[item.childId] = { child: item.child, items: [] }
      }
      acc[item.childId].items.push(item)
      return acc
    }, {})
  )

  const lowItems = filteredItems.filter(item => (item.quantityReceived - item.quantityUsed) <= item.alertThreshold)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.childId) { toast.error('Selecione uma criança'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/child-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId: form.childId, itemType: form.itemType,
          quantityReceived: Number(form.quantityReceived),
          alertThreshold: Number(form.alertThreshold),
          notes: form.notes || undefined,
        }),
      })
      if (res.ok) {
        toast.success('Item cadastrado!')
        setShowModal(false)
        setForm({ childId: '', itemType: 'FRALDA', quantityReceived: '10', alertThreshold: '5', notes: '' })
        queryClient.invalidateQueries({ queryKey: ['child-items'] })
      } else { 
        const errData = await res.json().catch(() => ({}))
        toast.error(getErrorMessage(errData, 'Erro ao cadastrar item')) 
      }
    } catch (err: any) { 
      toast.error('Erro de conexão com o servidor') 
    }
    finally { setSaving(false) }
  }

  const handleUse = async () => {
    if (!useModal) return
    setSaving(true)
    try {
      const res = await fetch(`/api/child-items/${useModal.id}/use`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: qty }),
      })
      if (res.ok) {
        toast.success('Uso registrado!')
        setUseModal(null); setQty(1)
        queryClient.invalidateQueries({ queryKey: ['child-items'] })
      } else {
        const err = await res.json()
        toast.error(getErrorMessage(err, 'Erro ao registrar uso'))
      }
    } catch { toast.error('Erro') }
    finally { setSaving(false) }
  }

  const handleReplenish = async () => {
    if (!repModal) return
    setSaving(true)
    try {
      const res = await fetch(`/api/child-items/${repModal.id}/replenish`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: qty }),
      })
      if (res.ok) {
        toast.success('Estoque reposto!')
        setRepModal(null); setQty(1)
        queryClient.invalidateQueries({ queryKey: ['child-items'] })
      } else { toast.error('Erro ao repor') }
    } catch { toast.error('Erro') }
    finally { setSaving(false) }
  }

  return (
    <div className="page animate-in pb-24">
      <PageHeader
        title="Estoque das Crianças"
        subtitle="Controle de fraldas, lenços e itens enviados pelos pais."
        icon={<Box size={24} />}
        actions={
          <button onClick={() => setShowModal(true)} className="btn-primary gap-2">
            <Plus size={18} /> Novo Item
          </button>
        }
      />

      {/* Search Bar */}
      <div className="mb-6 relative group">
        <Box className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <input 
          type="text" 
          placeholder="Buscar por criança ou item..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input pl-12 w-full bg-accent/30 border-transparent focus:bg-accent/50 focus:border-primary/30 h-14 text-sm font-bold"
        />
      </div>

      {/* Alerta de estoque baixo */}
      {lowItems.length > 0 && (
        <Alert variant="warning">
          <p className="font-black mb-2 flex items-center gap-2">
            <AlertTriangle size={16} /> {lowItems.length} item(ns) com estoque baixo!
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {lowItems.map(item => (
              <button
                key={item.id}
                onClick={() => { setRepModal(item); setQty(10) }}
                className="flex items-center gap-2 bg-background/50 border border-amber-500/30 px-3 py-1.5 rounded-xl text-xs font-black hover:bg-amber-500/10 transition-colors"
              >
                {ITEM_TYPE_EMOJIS[item.itemType as keyof typeof ITEM_TYPE_EMOJIS]} {item.child.fullName.split(' ')[0]} · Repor
              </button>
            ))}
          </div>
        </Alert>
      )}

      {isLoading ? (
        <LoadingState />
      ) : grouped.length === 0 ? (
        <EmptyState
          icon={<Package size={32} />}
          title="Nenhum item cadastrado"
          description="Registre os itens enviados pelos pais para cada criança."
          action={<button onClick={() => setShowModal(true)} className="btn-primary">Registrar Primeiro Item</button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {grouped.map(({ child, items: childItems }) => {
            const hasLow = childItems.some(i => i.quantityReceived - i.quantityUsed <= i.alertThreshold)
            return (
              <div key={child.id} className={`card p-5 border transition-all ${hasLow ? 'border-amber-500/30' : 'border-border/40 hover:border-primary/20'}`}>
                {/* Child header */}
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border/50">
                  <Avatar photoUrl={child.photoUrl} name={child.fullName} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-foreground leading-tight">{child.fullName}</p>
                    {child.group?.name && (
                      <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-0.5">{child.group.name}</p>
                    )}
                  </div>
                  {hasLow && (
                    <span className="shrink-0 px-2 py-0.5 bg-amber-500/15 text-amber-500 text-[10px] font-black rounded-full uppercase tracking-widest">Estoque baixo</span>
                  )}
                </div>

                {/* Items list */}
                <div className="space-y-3">
                  {childItems.map(item => {
                    const remaining = item.quantityReceived - item.quantityUsed
                    const isLow = remaining <= item.alertThreshold
                    const pct = Math.min((remaining / Math.max(item.quantityReceived, 1)) * 100, 100)

                    return (
                      <div key={item.id} className={`rounded-2xl p-3 border ${isLow ? 'bg-amber-500/5 border-amber-500/20' : 'bg-accent/20 border-border/30'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{ITEM_TYPE_EMOJIS[item.itemType as keyof typeof ITEM_TYPE_EMOJIS] ?? '📦'}</span>
                            <span className="text-xs font-black text-foreground uppercase tracking-widest">
                              {ITEM_TYPE_LABELS[item.itemType as keyof typeof ITEM_TYPE_LABELS] ?? item.itemType}
                            </span>
                          </div>
                          <span className={`text-xs font-black ${isLow ? 'text-amber-500' : 'text-emerald-500'}`}>
                            {remaining} un.
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div className="h-1.5 bg-border/50 rounded-full overflow-hidden mb-2">
                          <div
                            className={`h-full rounded-full transition-all ${isLow ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground font-bold">
                            Recebido: {item.quantityReceived} · Usado: {item.quantityUsed}
                          </span>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => { setUseModal(item); setQty(1) }}
                              className="px-2.5 py-1 bg-accent hover:bg-accent/80 text-foreground rounded-lg text-[10px] font-black flex items-center gap-1 transition-colors"
                            >
                              <Minus size={10} /> Usar
                            </button>
                            <button
                              onClick={() => { setRepModal(item); setQty(10) }}
                              className="px-2.5 py-1 bg-primary text-primary-foreground rounded-lg text-[10px] font-black flex items-center gap-1 hover:bg-primary/90 transition-colors"
                            >
                              <RefreshCw size={10} /> Repor
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Add item to this child */}
                <button
                  onClick={() => { setForm(f => ({ ...f, childId: child.id })); setShowModal(true) }}
                  className="mt-3 w-full py-2 rounded-2xl border border-dashed border-border/50 text-[10px] font-black text-muted-foreground hover:border-primary/30 hover:text-primary transition-all flex items-center justify-center gap-1.5"
                >
                  <Plus size={12} /> Adicionar item
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal: Novo Item */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Novo Item em Estoque" subtitle="Registre itens enviados pelos pais.">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="label">Criança *</label>
            <select required value={form.childId} onChange={e => setForm(p => ({ ...p, childId: e.target.value }))} className="select">
              <option value="">Selecione uma criança...</option>
              {children.map((c: any) => <option key={c.id} value={c.id}>{c.fullName}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Tipo de Item *</label>
            <select value={form.itemType} onChange={e => setForm(p => ({ ...p, itemType: e.target.value }))} className="select">
              {ITEM_TYPES.map(t => (
                <option key={t} value={t}>{ITEM_TYPE_EMOJIS[t]} {ITEM_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Qtd. Recebida</label>
              <input type="number" min={1} required value={form.quantityReceived} onChange={e => setForm(p => ({ ...p, quantityReceived: e.target.value }))} className="input" />
            </div>
            <div>
              <label className="label">Alerta (Qtd. Mínima)</label>
              <input type="number" min={0} required value={form.alertThreshold} onChange={e => setForm(p => ({ ...p, alertThreshold: e.target.value }))} className="input" />
            </div>
          </div>
          <div className="flex gap-3 pt-2 border-t border-border">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 gap-2">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Cadastrar
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Usar Item */}
      <Modal open={!!useModal} onClose={() => setUseModal(null)} title="Registrar Uso" subtitle={useModal ? `${ITEM_TYPE_EMOJIS[useModal.itemType as keyof typeof ITEM_TYPE_EMOJIS]} ${ITEM_TYPE_LABELS[useModal.itemType as keyof typeof ITEM_TYPE_LABELS]}` : ''}>
        {useModal && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 bg-accent/30 p-4 rounded-2xl">
              <Avatar photoUrl={useModal.child.photoUrl} name={useModal.child.fullName} size="sm" />
              <div>
                <p className="font-black text-foreground">{useModal.child.fullName}</p>
                <p className="text-xs text-muted-foreground">Estoque atual: {useModal.quantityReceived - useModal.quantityUsed} unidades</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-8">
              <button onClick={() => setQty(q => Math.max(1, q-1))} className="w-12 h-12 rounded-2xl bg-accent font-black text-2xl hover:bg-accent/80 transition-all">−</button>
              <div className="text-center">
                <span className="text-5xl font-black text-foreground tabular-nums">{qty}</span>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Unidade(s)</p>
              </div>
              <button onClick={() => setQty(q => q+1)} className="w-12 h-12 rounded-2xl bg-accent font-black text-2xl hover:bg-accent/80 transition-all">+</button>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setUseModal(null)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={handleUse} disabled={saving} className="btn-primary flex-1 gap-2">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Minus size={16} />} Confirmar Uso
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Repor */}
      <Modal open={!!repModal} onClose={() => setRepModal(null)} title="Repor Estoque" subtitle={repModal ? `${ITEM_TYPE_EMOJIS[repModal.itemType as keyof typeof ITEM_TYPE_EMOJIS]} ${ITEM_TYPE_LABELS[repModal.itemType as keyof typeof ITEM_TYPE_LABELS]}` : ''}>
        {repModal && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 bg-accent/30 p-4 rounded-2xl">
              <Avatar photoUrl={repModal.child.photoUrl} name={repModal.child.fullName} size="sm" />
              <div>
                <p className="font-black text-foreground">{repModal.child.fullName}</p>
                <p className="text-xs text-muted-foreground">Estoque atual: {repModal.quantityReceived - repModal.quantityUsed} unidades</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-8">
              <button onClick={() => setQty(q => Math.max(1, q-1))} className="w-12 h-12 rounded-2xl bg-accent font-black text-2xl hover:bg-accent/80 transition-all">−</button>
              <div className="text-center">
                <span className="text-5xl font-black text-foreground tabular-nums">{qty}</span>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Unidade(s)</p>
              </div>
              <button onClick={() => setQty(q => q+1)} className="w-12 h-12 rounded-2xl bg-accent font-black text-2xl hover:bg-accent/80 transition-all">+</button>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setRepModal(null)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={handleReplenish} disabled={saving} className="btn-primary flex-1 gap-2">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} Repor Estoque
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
