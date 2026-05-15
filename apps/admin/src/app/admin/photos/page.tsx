'use client'

import { useState } from 'react'
import { Camera, Plus, X, Check, Loader2, Trash2, EyeOff, Share2, Users } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { PageHeader, EmptyState, LoadingState, Modal } from '@/components/ui'
import { useSession } from 'next-auth/react'

type Photo = {
  id: string
  childId: string | null
  groupId: string | null
  url: string
  caption: string | null
  isPrivate: boolean
  sharedWithParents: boolean
  date: string
  child: { id: string; fullName: string } | null
}

export default function PhotosPage() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [preview, setPreview]     = useState<Photo | null>(null)
  const [saving, setSaving]       = useState(false)
  const [uploading, setUploading] = useState(false)
  const [filterChild, setFilterChild] = useState('')
  const [form, setForm] = useState({
    url: '', caption: '', childId: '', isPrivate: false, sharedWithParents: false,
  })

  const { data: photos = [], isLoading } = useQuery<Photo[]>({
    queryKey: ['photos', filterChild],
    queryFn: () => fetch(`/api/photos${filterChild ? `?childId=${filterChild}` : ''}`).then(r => r.json()),
  })

  const { data: children = [] } = useQuery<{ id: string; fullName: string }[]>({
    queryKey: ['children-list'],
    queryFn: () => fetch('/api/children').then(r => r.json()),
  })

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/$/, '')
      const token = (session as any)?.accessToken
      const res = await fetch(`${apiUrl}/upload/image`, { 
        method: 'POST', 
        body: formData,
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      const data = await res.json()
      if (data.url) { setForm(p => ({ ...p, url: data.url })); toast.success('Upload concluído!') }
      else toast.error('Erro no upload')
    } catch { toast.error('Falha ao enviar') }
    finally { setUploading(false) }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.url) { toast.error('Selecione uma foto'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: form.url,
          caption: form.caption || undefined,
          childId: form.childId || undefined,
          isPrivate: form.isPrivate,
          sharedWithParents: form.sharedWithParents,
        }),
      })
      if (res.ok) {
        toast.success('Foto adicionada!')
        setShowModal(false)
        setForm({ url: '', caption: '', childId: '', isPrivate: false, sharedWithParents: false })
        queryClient.invalidateQueries({ queryKey: ['photos'] })
      } else toast.error('Erro ao salvar')
    } catch { toast.error('Erro ao salvar') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta foto?')) return
    try {
      const res = await fetch(`/api/photos/${id}`, { method: 'DELETE' })
      if (res.ok) { toast.success('Foto excluída'); setPreview(null); queryClient.invalidateQueries({ queryKey: ['photos'] }) }
    } catch { toast.error('Erro ao excluir') }
  }

  const handleToggleShare = async (photo: Photo) => {
    try {
      const res = await fetch(`/api/photos/${photo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sharedWithParents: !photo.sharedWithParents }),
      })
      if (res.ok) {
        toast.success(photo.sharedWithParents ? 'Foto ocultada' : 'Foto compartilhada!')
        if (preview?.id === photo.id) setPreview(p => p ? { ...p, sharedWithParents: !p.sharedWithParents } : null)
        queryClient.invalidateQueries({ queryKey: ['photos'] })
      }
    } catch { toast.error('Erro ao atualizar') }
  }

  return (
    <div className="page animate-in pb-24">
      <PageHeader
        title="Galeria de Fotos"
        subtitle="Registre e compartilhe momentos especiais com as famílias."
        icon={<Camera size={24} />}
        actions={
          <button onClick={() => setShowModal(true)} className="btn-primary gap-2">
            <Plus size={18} /> Adicionar Foto
          </button>
        }
      />

      {/* Filtro + Stats */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <select
            value={filterChild}
            onChange={e => setFilterChild(e.target.value)}
            className="select sm:w-64"
          >
            <option value="">Todas as crianças</option>
            {Array.isArray(children) && (children as { id: string; fullName: string }[]).map(c => (
              <option key={c.id} value={c.id}>{c.fullName}</option>
            ))}
          </select>
          <div className="flex gap-4 text-sm">
            <span className="font-black text-foreground">{Array.isArray(photos) ? photos.length : 0} <span className="text-muted-foreground font-bold text-xs">fotos</span></span>
            <span className="font-black text-emerald-500">{Array.isArray(photos) ? photos.filter(p => p.sharedWithParents).length : 0} <span className="text-muted-foreground font-bold text-xs">compartilhadas</span></span>
            <span className="font-black text-muted-foreground">{Array.isArray(photos) ? photos.filter(p => p.isPrivate).length : 0} <span className="text-xs">privadas</span></span>
          </div>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <LoadingState label="Carregando fotos..." />
      ) : (!Array.isArray(photos) || photos.length === 0) ? (
        <EmptyState
          icon={<Camera size={32} />}
          title="Nenhuma foto cadastrada"
          description="Adicione fotos para compartilhar momentos com as famílias."
          action={<button onClick={() => setShowModal(true)} className="btn-primary gap-2"><Plus size={16} /> Adicionar primeira foto</button>}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.isArray(photos) && photos.map(photo => (
            <div
              key={photo.id}
              className="relative group cursor-pointer rounded-2xl overflow-hidden aspect-square bg-accent"
              onClick={() => setPreview(photo)}
            >
              <img
                src={photo.url}
                alt={photo.caption ?? 'Foto'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/400x400?text=Foto' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                {photo.caption && <p className="text-white text-xs font-bold truncate">{photo.caption}</p>}
                {photo.child && <p className="text-white/70 text-[10px] font-bold truncate">{photo.child.fullName}</p>}
              </div>
              {photo.isPrivate && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center">
                  <EyeOff size={11} className="text-white" />
                </div>
              )}
              {photo.sharedWithParents && (
                <div className="absolute top-2 left-2 w-6 h-6 bg-emerald-500/90 rounded-full flex items-center justify-center">
                  <Share2 size={10} className="text-white" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal: Adicionar Foto */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Adicionar Foto" subtitle="Registre um momento especial">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="label">Foto *</label>
            {!form.url ? (
              <div className="relative group">
                <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full" />
                <div className="w-full aspect-video border-2 border-dashed border-border rounded-3xl flex flex-col items-center justify-center gap-3 bg-accent/20 hover:bg-accent/40 hover:border-primary/50 transition-all">
                  {uploading
                    ? <Loader2 className="text-primary animate-spin" size={32} />
                    : <><Camera className="text-muted-foreground" size={28} /><p className="text-sm font-bold text-muted-foreground">Clique para enviar</p></>
                  }
                </div>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden aspect-video bg-accent group">
                <img src={form.url} alt="Preview" className="w-full h-full object-cover" />
                <button type="button" onClick={() => setForm(p => ({ ...p, url: '' }))} className="absolute top-3 right-3 p-2 bg-rose-500 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 size={14} />
                </button>
              </div>
            )}
            <div className="mt-2">
              <input type="url" value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} placeholder="Ou cole uma URL de imagem..." className="input text-sm" />
            </div>
          </div>

          <div>
            <label className="label">Legenda</label>
            <input type="text" value={form.caption} onChange={e => setForm(p => ({ ...p, caption: e.target.value }))} placeholder="Momento especial..." className="input" />
          </div>

          <div>
            <label className="label">Criança (opcional)</label>
            <select value={form.childId} onChange={e => setForm(p => ({ ...p, childId: e.target.value }))} className="select">
              <option value="">Geral / Toda a turma</option>
              {Array.isArray(children) && (children as { id: string; fullName: string }[]).map(c => (
                <option key={c.id} value={c.id}>{c.fullName}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setForm(p => ({ ...p, sharedWithParents: !p.sharedWithParents }))}
                className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 ${form.sharedWithParents ? 'bg-primary justify-end' : 'bg-border justify-start'}`}
              >
                <div className="w-5 h-5 bg-white rounded-full shadow" />
              </div>
              <span className="text-sm font-bold text-foreground">Compartilhar com responsáveis</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setForm(p => ({ ...p, isPrivate: !p.isPrivate }))}
                className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 ${form.isPrivate ? 'bg-primary justify-end' : 'bg-border justify-start'}`}
              >
                <div className="w-5 h-5 bg-white rounded-full shadow" />
              </div>
              <span className="text-sm font-bold text-foreground">Foto privada (apenas equipe)</span>
            </label>
          </div>

          <div className="flex gap-3 pt-2 border-t border-border">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 gap-2">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Adicionar
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Preview */}
      {preview && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setPreview(null)} />
          <div className="relative z-10 max-w-3xl w-full animate-in zoom-in-95 duration-200">
            <div className="bg-card rounded-[2rem] overflow-hidden border border-border shadow-2xl">
              <div className="relative bg-black flex items-center justify-center" style={{ maxHeight: '60vh' }}>
                <img
                  src={preview.url}
                  alt={preview.caption ?? 'Foto'}
                  className="max-w-full max-h-[60vh] object-contain"
                  onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/1200x800?text=Erro' }}
                />
                <button onClick={() => setPreview(null)} className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/60 text-white rounded-xl backdrop-blur-sm transition-all">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                    {format(new Date(preview.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                  <p className="font-black text-foreground text-base">{preview.caption || 'Sem legenda'}</p>
                  {preview.child && (
                    <p className="text-xs text-muted-foreground font-bold flex items-center gap-1.5 mt-1">
                      <Users size={12} /> {preview.child.fullName}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleShare(preview)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs transition-all ${preview.sharedWithParents ? 'bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25' : 'btn-secondary'}`}
                  >
                    <Share2 size={14} /> {preview.sharedWithParents ? 'Ocultar' : 'Compartilhar'}
                  </button>
                  <button onClick={() => handleDelete(preview.id)} className="p-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
