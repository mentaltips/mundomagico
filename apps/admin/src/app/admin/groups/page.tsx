'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Plus, Users, Search, MoreVertical,
  Trash2, Edit2, Clock,
  LayoutGrid, ChevronRight, Loader2, TrendingUp
} from 'lucide-react'
import { Modal, PageHeader, EmptyState, LoadingState, StatCard } from '@/components/ui'
import toast from 'react-hot-toast'
import Link from 'next/link'

import { getSafeUrl } from '@/lib/utils'

// Avatar simples para os alunos
function MiniAvatar({ name, photoUrl }: { name: string; photoUrl?: string | null }) {
  const initials = (name || '').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
  const colors = ['bg-primary/20 text-primary', 'bg-blue-500/20 text-blue-500', 'bg-emerald-500/20 text-emerald-500', 'bg-amber-500/20 text-amber-600', 'bg-rose-500/20 text-rose-500']
  const color = colors[name.charCodeAt(0) % colors.length]
  const safePhotoUrl = getSafeUrl(photoUrl)

  return (
    <div className="w-7 h-7 rounded-full border-2 border-card overflow-hidden shrink-0 flex items-center justify-center">
      {safePhotoUrl
        ? (
          <img 
            src={safePhotoUrl} 
            alt={name} 
            className="w-full h-full object-cover" 
            onError={(e) => {
              (e.target as any).style.display = 'none'
              const parent = (e.target as any).parentElement
              if (parent) {
                const div = document.createElement('div')
                div.className = `w-full h-full flex items-center justify-center text-[9px] font-black ${color}`
                div.innerText = initials
                parent.appendChild(div)
              }
            }}
          />
        )
        : <div className={`w-full h-full flex items-center justify-center text-[9px] font-black ${color}`}>{initials}</div>
      }
    </div>
  )
}

const SHIFT_LABEL: Record<string, string> = {
  MANHA: 'Manhã',
  TARDE: 'Tarde',
  INTEGRAL: 'Integral',
  NOTURNO: 'Noturno',
}

// Dropdown de ações do card
function GroupMenu({ group, onEdit, onDelete }: { group: any; onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o) }}
        className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl transition-colors"
      >
        <MoreVertical size={18} />
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-50 min-w-[160px] bg-card border border-border rounded-2xl shadow-xl overflow-hidden animate-in">
          <button
            onClick={() => { setOpen(false); onEdit() }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-foreground hover:bg-accent transition-colors"
          >
            <Edit2 size={14} className="text-primary" /> Editar Turma
          </button>
          <button
            onClick={() => { setOpen(false); onDelete() }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-rose-500 hover:bg-rose-500/10 transition-colors"
          >
            <Trash2 size={14} /> Excluir Turma
          </button>
        </div>
      )}
    </div>
  )
}

const emptyForm = { name: '', description: '', capacity: 20, shift: 'MANHA', room: '' }

export default function GroupsPage() {
  const [groups, setGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingGroup, setEditingGroup] = useState<any | null>(null)
  const [search, setSearch] = useState('')
  const [formData, setFormData] = useState(emptyForm)

  const fetchGroups = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/groups')
      if (res.ok) setGroups(await res.json())
    } catch {
      toast.error('Erro ao carregar turmas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchGroups() }, [])

  const handleOpenModal = (group?: any) => {
    if (group) {
      setEditingGroup(group)
      setFormData({ name: group.name, description: group.description || '', capacity: group.capacity || 20, shift: group.shift || 'MANHA', room: group.room || '' })
    } else {
      setEditingGroup(null)
      setFormData(emptyForm)
    }
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) { toast.error('Nome obrigatório'); return }
    setSaving(true)
    try {
      const url = editingGroup ? `/api/groups/${editingGroup.id}` : '/api/groups'
      const method = editingGroup ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        toast.success(editingGroup ? 'Turma atualizada!' : 'Turma criada!')
        setShowModal(false)
        fetchGroups()
      } else {
        toast.error('Erro ao salvar turma')
      }
    } catch {
      toast.error('Erro ao salvar turma')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta turma?')) return
    try {
      const res = await fetch(`/api/groups/${id}`, { method: 'DELETE' })
      if (res.ok || res.status === 204) {
        toast.success('Turma excluída')
        fetchGroups()
      } else {
        toast.error('Erro ao excluir')
      }
    } catch {
      toast.error('Erro ao excluir')
    }
  }

  const filtered = groups.filter(g => (g.name || '').toLowerCase().includes(search.toLowerCase()))
  const totalStudents = groups.reduce((acc, g) => acc + (g._count?.children || 0), 0)
  const totalCapacity = groups.reduce((acc, g) => acc + (g.capacity || 0), 0)
  const occupancyRate = totalCapacity > 0 ? Math.round((totalStudents / totalCapacity) * 100) : 0

  return (
    <div className="page animate-in">
      <PageHeader
        title="Gestão de Turmas"
        subtitle="Organize as salas, horários e capacidade de atendimento."
        icon={<LayoutGrid size={24} />}
        actions={
          <button onClick={() => handleOpenModal()} className="btn-primary">
            <Plus size={18} /> Nova Turma
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total de Turmas" value={groups.length.toString()} icon={<LayoutGrid size={20} />} color="text-primary bg-primary/10" />
        <StatCard label="Total de Alunos" value={totalStudents.toString()} icon={<Users size={20} />} color="text-blue-500 bg-blue-500/10" />
        <StatCard label="Ocupação Média" value={`${occupancyRate}%`} icon={<TrendingUp size={20} />} color={occupancyRate > 90 ? 'text-rose-500 bg-rose-500/10' : 'text-emerald-500 bg-emerald-500/10'} trend={occupancyRate > 90 ? 'Quase lotado' : 'Capacidade estável'} trendUp={occupancyRate > 90} />
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <input type="text" placeholder="Buscar por nome da turma..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-10" />
      </div>

      {loading ? (
        <LoadingState label="Carregando turmas..." />
      ) : filtered.length === 0 ? (
        <EmptyState icon={<LayoutGrid size={32} />} title="Nenhuma turma encontrada" description={search ? 'Não encontramos turmas com esse nome.' : 'Você ainda não cadastrou nenhuma turma.'} action={!search && <button onClick={() => handleOpenModal()} className="btn-primary">Criar Primeira Turma</button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((group, i) => {
            const count = group._count?.children || 0
            const cap = group.capacity || 20
            const percent = Math.min(100, Math.round((count / cap) * 100))
            const previews: any[] = group.children || []

            return (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="card-hover p-6 flex flex-col group relative"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-xl">
                      {group.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-foreground group-hover:text-primary transition-colors">
                        {group.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Clock size={11} className="text-muted-foreground" />
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                          {SHIFT_LABEL[group.shift] || group.shift || '—'}
                          {group.room ? ` · ${group.room}` : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  <GroupMenu group={group} onEdit={() => handleOpenModal(group)} onDelete={() => handleDelete(group.id)} />
                </div>

                <div className="space-y-4 mb-8 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground">Ocupação</span>
                    <span className={`text-xs font-black ${percent > 90 ? 'text-rose-500' : 'text-foreground'}`}>
                      {count} / {cap} alunos
                    </span>
                  </div>
                  <div className="progress-track">
                    <div className={percent > 90 ? 'progress-fill-red' : 'progress-fill'} style={{ width: `${percent}%` }} />
                  </div>
                  <p className="text-sm text-muted-foreground font-medium line-clamp-2">
                    {group.description || 'Nenhuma descrição informada.'}
                  </p>
                </div>

                <div className="pt-4 border-t border-border flex items-center justify-between">
                  {/* Avatares reais dos alunos */}
                  <div className="flex -space-x-2">
                    {previews.length === 0 ? (
                      <span className="text-xs text-muted-foreground italic">Sem alunos</span>
                    ) : (
                      <>
                        {previews.map(child => (
                          <MiniAvatar key={child.id} name={child.fullName} photoUrl={child.photoUrl} />
                        ))}
                        {count > 3 && (
                          <div className="w-7 h-7 rounded-full bg-primary/10 border-2 border-card flex items-center justify-center text-[9px] font-black text-primary">
                            +{count - 3}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <Link href={`/admin/children?groupId=${group.id}`} className="text-xs font-black text-primary flex items-center gap-1 hover:underline">
                    Gerenciar Turma <ChevronRight size={14} />
                  </Link>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Modal: Nova / Editar Turma */}
      <Modal open={showModal} onClose={() => !saving && setShowModal(false)} title={editingGroup ? 'Editar Turma' : 'Nova Turma'} subtitle={editingGroup ? 'Atualize as informações da turma.' : 'Cadastre uma nova sala de aula.'}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">Nome da Turma *</label>
            <input type="text" placeholder="Ex: Maternal II - Manhã" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="input" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Turno</label>
              <select value={formData.shift} onChange={e => setFormData({...formData, shift: e.target.value})} className="input">
                <option value="MANHA">Manhã</option>
                <option value="TARDE">Tarde</option>
                <option value="INTEGRAL">Integral</option>
                <option value="NOTURNO">Noturno</option>
              </select>
            </div>
            <div>
              <label className="label">Capacidade</label>
              <input type="number" min={1} value={formData.capacity} onChange={e => setFormData({...formData, capacity: parseInt(e.target.value) || 1})} className="input" />
            </div>
          </div>
          <div>
            <label className="label">Sala / Local</label>
            <input type="text" placeholder="Ex: Sala 3, Ala B" value={formData.room} onChange={e => setFormData({...formData, room: e.target.value})} className="input" />
          </div>
          <div>
            <label className="label">Descrição</label>
            <textarea rows={3} placeholder="Breve descrição da turma..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="input" />
          </div>
          <div className="pt-4 flex gap-3 border-t border-border">
            <button type="button" onClick={() => setShowModal(false)} className="btn-ghost flex-1">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 gap-2">
              {saving ? <Loader2 size={18} className="animate-spin" /> : editingGroup ? 'Salvar' : 'Criar Turma'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
