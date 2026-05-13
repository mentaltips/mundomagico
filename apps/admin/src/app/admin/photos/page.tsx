'use client'

import { useState } from 'react'
import { Camera, Plus, X, Check, Loader2, Trash2, Eye, EyeOff, Share2, Users } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

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
  const queryClient = useQueryClient()
  const [showModal, setShowModal]   = useState(false)
  const [preview, setPreview]       = useState<Photo | null>(null)
  const [saving, setSaving]         = useState(false)
  const [uploading, setUploading]   = useState(false)
  const [filterChild, setFilterChild] = useState('')
  const [form, setForm]             = useState({
    url: '', caption: '', childId: '', isPrivate: false, sharedWithParents: false,
  })

  const { data: photos = [], isLoading } = useQuery<Photo[]>({
    queryKey: ['photos', filterChild],
    queryFn: () => fetch(`/api/photos${filterChild ? `?childId=${filterChild}` : ''}`).then((r) => r.json()),
  })

  const { data: children = [] } = useQuery<{ id: string; fullName: string }[]>({
    queryKey: ['children-list'],
    queryFn: () => fetch('/api/children').then((r) => r.json()),
  })

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (data.url) {
        setForm((p) => ({ ...p, url: data.url }))
        toast.success('Upload concluído!')
      } else {
        toast.error('Erro no upload')
      }
    } catch {
      toast.error('Falha ao enviar arquivo')
    } finally {
      setUploading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.url) { toast.error('Informe a URL da foto'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url:               form.url,
          caption:           form.caption || undefined,
          childId:           form.childId || undefined,
          isPrivate:         form.isPrivate,
          sharedWithParents: form.sharedWithParents,
        }),
      })
      if (res.ok) {
        toast.success('Foto adicionada!')
        setShowModal(false)
        setForm({ url: '', caption: '', childId: '', isPrivate: false, sharedWithParents: false })
        queryClient.invalidateQueries({ queryKey: ['photos'] })
      } else {
        toast.error('Erro ao adicionar foto')
      }
    } catch { toast.error('Erro ao adicionar foto') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta foto?')) return
    try {
      const res = await fetch(`/api/photos/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Foto excluída!')
        setPreview(null)
        queryClient.invalidateQueries({ queryKey: ['photos'] })
      } else {
        toast.error('Erro ao excluir')
      }
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
        toast.success(photo.sharedWithParents ? 'Foto ocultada dos responsáveis' : 'Foto compartilhada com responsáveis!')
        queryClient.invalidateQueries({ queryKey: ['photos'] })
      }
    } catch { toast.error('Erro ao atualizar') }
  }

  return (
    <div className="p-4 md:p-8 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <Camera className="text-primary" size={28} />
            Galeria de Fotos
          </h1>
          <p className="text-sm text-gray-500 mt-1">Registre e compartilhe momentos especiais com as famílias</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-black shadow-lg shadow-lime-100 hover:bg-lime-600 transition-all"
        >
          <Plus size={18} />
          Adicionar Foto
        </button>
      </div>

      {/* Filtro */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4">
        <select
          value={filterChild}
          onChange={(e) => setFilterChild(e.target.value)}
          className="px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-lime-200 min-w-[220px]"
        >
          <option value="">Todas as crianças</option>
          {(children as { id: string; fullName: string }[]).map((c) => (
            <option key={c.id} value={c.id}>{c.fullName}</option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
          <p className="text-2xl font-black text-gray-900">{photos.length}</p>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Total de fotos</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
          <p className="text-2xl font-black text-emerald-600">{photos.filter((p) => p.sharedWithParents).length}</p>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Compartilhadas</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
          <p className="text-2xl font-black text-gray-400">{photos.filter((p) => p.isPrivate).length}</p>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Privadas</p>
        </div>
      </div>

      {/* Grid de fotos */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="text-primary animate-spin" size={32} />
        </div>
      ) : photos.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-16 text-center">
          <Camera className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-bold">Nenhuma foto cadastrada</p>
          <button onClick={() => setShowModal(true)} className="mt-4 text-primary font-black text-sm hover:underline">
            + Adicionar primeira foto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="relative group cursor-pointer rounded-2xl overflow-hidden aspect-square bg-gray-100"
              onClick={() => setPreview(photo)}
            >
              <img
                src={photo.url}
                alt={photo.caption ?? 'Foto'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/400x400?text=Foto' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                {photo.caption && <p className="text-white text-xs font-bold truncate">{photo.caption}</p>}
                {photo.child && <p className="text-white/70 text-[10px] font-bold">{photo.child.fullName}</p>}
              </div>
              {photo.isPrivate && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-gray-900/60 rounded-full flex items-center justify-center">
                  <EyeOff size={12} className="text-white" />
                </div>
              )}
              {photo.sharedWithParents && (
                <div className="absolute top-2 left-2 w-6 h-6 bg-emerald-500/80 rounded-full flex items-center justify-center">
                  <Share2 size={11} className="text-white" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal: Adicionar Foto */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="bg-white w-full sm:max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl relative z-10 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-gray-900">Adicionar Foto</h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Selecione a Foto *</label>
                {!form.url ? (
                  <div className="relative group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      disabled={uploading}
                    />
                    <div className="w-full aspect-video border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center gap-3 bg-gray-50 group-hover:bg-gray-100 group-hover:border-primary/50 transition-all">
                      {uploading ? (
                        <Loader2 className="text-primary animate-spin" size={32} />
                      ) : (
                        <>
                          <div className="p-4 bg-white rounded-2xl shadow-sm">
                            <Plus className="text-gray-400" size={24} />
                          </div>
                          <p className="text-sm font-bold text-gray-500">Clique para enviar</p>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="relative rounded-3xl overflow-hidden aspect-video bg-gray-100 group">
                    <img src={form.url} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, url: '' }))}
                      className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
                <div className="mt-2 text-center">
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Ou cole uma URL</p>
                  <input
                    type="url" value={form.url}
                    onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
                    placeholder="https://..."
                    className="w-full mt-2 px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-lime-200"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Legenda</label>
                <input
                  type="text" value={form.caption}
                  onChange={(e) => setForm((p) => ({ ...p, caption: e.target.value }))}
                  placeholder="Momento especial..."
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-lime-200"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Criança (opcional)</label>
                <select
                  value={form.childId}
                  onChange={(e) => setForm((p) => ({ ...p, childId: e.target.value }))}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-lime-200"
                >
                  <option value="">Geral / Toda a turma</option>
                  {(children as { id: string; fullName: string }[]).map((c) => (
                    <option key={c.id} value={c.id}>{c.fullName}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox" checked={form.sharedWithParents}
                    onChange={(e) => setForm((p) => ({ ...p, sharedWithParents: e.target.checked }))}
                    className="rounded text-primary"
                  />
                  <span className="text-sm font-bold text-gray-700">Compartilhar com responsáveis</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox" checked={form.isPrivate}
                    onChange={(e) => setForm((p) => ({ ...p, isPrivate: e.target.checked }))}
                    className="rounded text-primary"
                  />
                  <span className="text-sm font-bold text-gray-700">Foto privada (apenas equipe)</span>
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-2xl border border-gray-200 font-black text-sm text-gray-500">Cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 py-3 rounded-2xl bg-primary text-white font-black text-sm hover:bg-lime-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Preview */}
      {preview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/90 backdrop-blur-sm" onClick={() => setPreview(null)} />
          <div className="relative z-10 max-w-4xl w-full animate-in zoom-in-95 duration-300">
            <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/20">
              <div className="relative aspect-video sm:aspect-auto sm:h-[70vh] bg-gray-950 flex items-center justify-center">
                <img
                  src={preview.url}
                  alt={preview.caption ?? 'Foto'}
                  className="max-w-full max-h-full object-contain shadow-2xl"
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/1200x800?text=Erro+ao+carregar+imagem' }}
                />
                <button 
                  onClick={() => setPreview(null)}
                  className="absolute top-6 right-6 p-3 bg-black/20 hover:bg-black/40 text-white rounded-2xl backdrop-blur-md transition-all z-20"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-8 md:p-10 bg-white">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-wider">
                        {format(new Date(preview.date), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                      {preview.sharedWithParents && (
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                          <Share2 size={10} /> Compartilhada
                        </span>
                      )}
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                      {preview.caption || 'Sem legenda'}
                    </h3>
                    {preview.child && (
                      <p className="text-gray-500 font-bold flex items-center gap-2">
                        <Users size={16} className="text-gray-400" />
                        {preview.child.fullName}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleShare(preview)}
                      className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-sm transition-all ${
                        preview.sharedWithParents 
                          ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' 
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      <Share2 size={18} />
                      {preview.sharedWithParents ? 'Ocultar' : 'Compartilhar'}
                    </button>
                    <button
                      onClick={() => handleDelete(preview.id)}
                      className="p-3 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl transition-all"
                      title="Excluir Foto"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
