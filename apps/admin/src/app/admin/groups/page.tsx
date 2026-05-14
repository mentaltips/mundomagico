'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, Users, Search, MoreVertical, 
  Trash2, Edit2, UserPlus, Clock, 
  CheckCircle2, AlertCircle, LayoutGrid,
  ChevronRight, Calendar, MapPin, Loader2, TrendingUp
} from 'lucide-react'
import { Modal, PageHeader, EmptyState, Badge, LoadingState, StatCard, Avatar } from '@/components/ui'
import toast from 'react-hot-toast'

export default function GroupsPage() {
  const [groups, setGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    capacity: 20,
    startTime: '07:00',
    endTime: '17:00'
  })

  const fetchGroups = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/groups')
      if (res.ok) {
        const data = await res.json()
        setGroups(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      toast.error('Erro ao carregar turmas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGroups()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) {
      toast.error('O nome da turma é obrigatório')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        toast.success('Turma criada com sucesso!')
        setShowModal(false)
        setFormData({ name: '', description: '', capacity: 20, startTime: '07:00', endTime: '17:00' })
        fetchGroups()
      } else {
        toast.error('Erro ao criar turma')
      }
    } catch (error) {
      toast.error('Erro ao criar turma')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta turma?')) return
    try {
      const res = await fetch(`/api/groups?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Turma excluída')
        fetchGroups()
      } else {
        toast.error('Erro ao excluir')
      }
    } catch {
      toast.error('Erro ao excluir')
    }
  }

  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(search.toLowerCase())
  )

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
          <button 
            onClick={() => setShowModal(true)}
            className="btn-primary"
          >
            <Plus size={18} /> Nova Turma
          </button>
        }
      />

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard 
          label="Total de Turmas" 
          value={groups.length.toString()} 
          icon={<LayoutGrid size={20} />} 
          color="text-primary bg-primary/10" 
        />
        <StatCard 
          label="Total de Alunos" 
          value={totalStudents.toString()} 
          icon={<Users size={20} />} 
          color="text-blue-500 bg-blue-500/10" 
        />
        <StatCard 
          label="Ocupação Média" 
          value={`${occupancyRate}%`} 
          icon={<TrendingUp size={20} />} 
          color={occupancyRate > 90 ? 'text-rose-500 bg-rose-500/10' : 'text-emerald-500 bg-emerald-500/10'} 
          trend={occupancyRate > 90 ? 'Quase lotado' : 'Capacidade estável'}
          trendUp={occupancyRate > 90}
        />
      </div>

      {/* Filters */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <input 
          type="text" 
          placeholder="Buscar por nome da turma..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-10"
        />
      </div>

      {loading ? (
        <LoadingState label="Carregando turmas..." />
      ) : filteredGroups.length === 0 ? (
        <EmptyState 
          icon={<LayoutGrid size={32} />}
          title="Nenhuma turma encontrada"
          description={search ? "Não encontramos turmas com esse nome." : "Você ainda não cadastrou nenhuma turma."}
          action={!search && (
            <button onClick={() => setShowModal(true)} className="btn-primary">
              Criar Primeira Turma
            </button>
          )}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map((group, i) => {
            const count = group._count?.children || 0
            const cap = group.capacity || 20
            const percent = Math.min(100, Math.round((count / cap) * 100))
            
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
                      <div className="flex items-center gap-2 mt-0.5">
                        <Clock size={12} className="text-muted-foreground" />
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                          {group.startTime}h - {group.endTime}h
                        </span>
                      </div>
                    </div>
                  </div>
                  <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl transition-colors">
                    <MoreVertical size={18} />
                  </button>
                </div>

                <div className="space-y-4 mb-8 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground">Ocupação</span>
                    <span className={`text-xs font-black ${percent > 90 ? 'text-rose-500' : 'text-foreground'}`}>
                      {count} / {cap} alunos
                    </span>
                  </div>
                  <div className="progress-track">
                    <div 
                      className={percent > 90 ? 'progress-fill-red' : 'progress-fill'}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground font-medium line-clamp-2">
                    {group.description || 'Nenhuma descrição informada para esta turma.'}
                  </p>
                </div>

                <div className="pt-4 border-t border-border flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(s => (
                      <div key={s} className="w-7 h-7 rounded-full bg-accent border-2 border-card flex items-center justify-center text-[10px] font-bold">
                        ?
                      </div>
                    ))}
                    {count > 3 && (
                      <div className="w-7 h-7 rounded-full bg-primary/10 border-2 border-card flex items-center justify-center text-[9px] font-black text-primary">
                        +{count - 3}
                      </div>
                    )}
                  </div>
                  <button className="text-xs font-black text-primary flex items-center gap-1 hover:underline">
                    Gerenciar Turma <ChevronRight size={14} />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Modal: Nova Turma */}
      <Modal 
        open={showModal} 
        onClose={() => setShowModal(false)}
        title="Nova Turma"
        subtitle="Cadastre uma nova sala de aula no sistema."
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">Nome da Turma *</label>
            <input 
              type="text" 
              placeholder="Ex: Maternal II - Manhã"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="input"
            />
          </div>

          <div>
            <label className="label">Descrição</label>
            <textarea 
              rows={3}
              placeholder="Breve descrição da turma..."
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="input"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <label className="label">Capacidade</label>
              <input 
                type="number" 
                value={formData.capacity}
                onChange={e => setFormData({...formData, capacity: parseInt(e.target.value)})}
                className="input"
              />
            </div>
            <div className="col-span-1">
              <label className="label">Início</label>
              <input 
                type="time" 
                value={formData.startTime}
                onChange={e => setFormData({...formData, startTime: e.target.value})}
                className="input"
              />
            </div>
            <div className="col-span-1">
              <label className="label">Fim</label>
              <input 
                type="time" 
                value={formData.endTime}
                onChange={e => setFormData({...formData, endTime: e.target.value})}
                className="input"
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3 border-t border-border">
            <button type="button" onClick={() => setShowModal(false)} className="btn-ghost flex-1">Cancelar</button>
            <button 
              type="submit"
              disabled={saving}
              className="btn-primary flex-1 gap-2"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : 'Criar Turma'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

