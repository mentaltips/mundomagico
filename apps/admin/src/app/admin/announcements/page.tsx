'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, Bell, MessageSquare, Trash2, 
  ChevronRight, Users, Globe, AlertTriangle,
  CheckCircle2, X, Send, Filter, MoreVertical, Clock, Loader2, Megaphone
} from 'lucide-react'
import { Modal, PageHeader, EmptyState, Badge, LoadingState, StatCard } from '@/components/ui'
import toast from 'react-hot-toast'

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [groups, setGroups] = useState<any[]>([])
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'GERAL',
    groupId: '',
    priority: 'NORMAL'
  })

  const fetchAnnouncements = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/announcements')
      if (res.ok) {
        const data = await res.json()
        setAnnouncements(data)
      }
    } catch (error) {
      toast.error('Erro ao carregar comunicados')
    } finally {
      setLoading(false)
    }
  }

  const fetchGroups = async () => {
    const res = await fetch('/api/groups')
    if (res.ok) {
      const data = await res.json()
      setGroups(data)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este comunicado?')) return
    try {
      const res = await fetch(`/api/announcements?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Comunicado excluído')
        fetchAnnouncements()
      } else {
        toast.error('Erro ao excluir comunicado')
      }
    } catch {
      toast.error('Erro ao excluir comunicado')
    }
  }

  useEffect(() => {
    fetchAnnouncements()
    fetchGroups()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.content) {
      toast.error('Preencha título e conteúdo')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        toast.success('Comunicado enviado! 🎉')
        setShowModal(false)
        setFormData({ title: '', content: '', type: 'GERAL', groupId: '', priority: 'NORMAL' })
        fetchAnnouncements()
      }
    } catch (error) {
      toast.error('Erro ao enviar comunicado')
    } finally {
      setSaving(true)
    }
  }

  const generalCount = announcements.filter(a => a.type === 'GERAL').length
  const groupCount = announcements.filter(a => a.type === 'TURMA').length
  const urgentCount = announcements.filter(a => a.priority === 'URGENTE').length

  return (
    <div className="page animate-in">
      <PageHeader 
        title="Comunicados" 
        subtitle="Mantenha os pais informados com avisos importantes e atualizações."
        icon={<Megaphone size={24} />}
        actions={
          <button 
            onClick={() => setShowModal(true)}
            className="btn-primary"
          >
            <Plus size={18} /> Novo Comunicado
          </button>
        }
      />

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard 
          label="Comunicados Gerais" 
          value={generalCount.toString()} 
          icon={<Globe size={20} />} 
          color="text-primary bg-primary/10" 
        />
        <StatCard 
          label="Por Turma" 
          value={groupCount.toString()} 
          icon={<Users size={20} />} 
          color="text-blue-500 bg-blue-500/10" 
        />
        <StatCard 
          label="Urgentes" 
          value={urgentCount.toString()} 
          icon={<AlertTriangle size={20} />} 
          color="text-rose-500 bg-rose-500/10" 
          trendUp={false}
        />
      </div>

      {loading ? (
        <LoadingState label="Carregando comunicados..." />
      ) : announcements.length === 0 ? (
        <EmptyState 
          icon={<MessageSquare size={32} />}
          title="Nenhum comunicado enviado"
          description="Você ainda não enviou nenhum aviso aos pais."
          action={
            <button onClick={() => setShowModal(true)} className="btn-primary">
              Enviar Primeiro Aviso
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {announcements.map((ann, i) => (
            <motion.div 
              key={ann.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card-hover p-6 flex flex-col group relative"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${ann.type === 'GERAL' ? 'bg-primary/10 text-primary' : 'bg-blue-500/10 text-blue-500'}`}>
                    {ann.type === 'GERAL' ? <Globe size={20} /> : <Users size={20} />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest truncate">
                        {ann.type === 'GERAL' ? 'Público Geral' : `Turma: ${ann.group?.name}`}
                      </p>
                      {ann.priority === 'URGENTE' && (
                        <Badge label="Urgente" variant="red" size="sm" />
                      )}
                    </div>
                    <h3 className="text-lg font-black text-foreground truncate max-w-[200px]">{ann.title}</h3>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(ann.id)}
                  className="p-2 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <p className="text-sm text-muted-foreground font-medium leading-relaxed mb-6 line-clamp-3">
                {ann.content}
              </p>

              <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  <Clock size={14} />
                  {new Date(ann.createdAt).toLocaleDateString('pt-BR')} às {new Date(ann.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <button className="text-xs font-black text-primary flex items-center gap-1 hover:underline">
                  Ver Mais <ChevronRight size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal for New Announcement */}
      <Modal 
        open={showModal} 
        onClose={() => setShowModal(false)}
        title="Novo Comunicado"
        subtitle="Envie uma mensagem importante para os pais e responsáveis."
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">Título do Comunicado *</label>
            <input 
              type="text" 
              placeholder="Ex: Reunião de Pais e Mestres"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              className="input"
            />
          </div>

          <div>
            <label className="label">Mensagem *</label>
            <textarea 
              rows={4}
              placeholder="Descreva aqui o aviso completo..."
              value={formData.content}
              onChange={e => setFormData({...formData, content: e.target.value})}
              className="input min-h-[120px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Destinatário</label>
              <select 
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value, groupId: e.target.value === 'GERAL' ? '' : formData.groupId})}
                className="select"
              >
                <option value="GERAL">Todos os Pais</option>
                <option value="TURMA">Turma Específica</option>
              </select>
            </div>
            <div>
              <label className="label">Prioridade</label>
              <select 
                value={formData.priority}
                onChange={e => setFormData({...formData, priority: e.target.value})}
                className="select"
              >
                <option value="NORMAL">Normal</option>
                <option value="URGENTE">Urgente 🚨</option>
              </select>
            </div>
          </div>

          {formData.type === 'TURMA' && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
              <label className="label">Selecionar Turma</label>
              <select 
                value={formData.groupId}
                onChange={e => setFormData({...formData, groupId: e.target.value})}
                className="select"
              >
                <option value="">Selecione a turma...</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </motion.div>
          )}

          <div className="pt-4 flex gap-3 border-t border-border">
            <button type="button" onClick={() => setShowModal(false)} className="btn-ghost flex-1">Cancelar</button>
            <button 
              type="submit"
              disabled={saving}
              className="btn-primary flex-1 gap-2"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <><Send size={18} /> Enviar Aviso</>}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
