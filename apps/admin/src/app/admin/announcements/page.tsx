'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, Bell, MessageSquare, Trash2, 
  ChevronRight, Users, Globe, AlertTriangle,
  CheckCircle2, X, Send, Filter, MoreVertical, Clock
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
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

    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        toast.success('Comunicado enviado com sucesso! 🎉')
        setShowModal(false)
        setFormData({ title: '', content: '', type: 'GERAL', groupId: '', priority: 'NORMAL' })
        fetchAnnouncements()
      }
    } catch (error) {
      toast.error('Erro ao enviar comunicado')
    }
  }

  return (
    <div className="p-3 sm:p-4 md:p-8 animate-in min-h-screen bg-[#FDFCFE] pb-24 lg:pb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <Bell className="text-rose-500" size={32} />
            Central de <span className="text-primary">Comunicados</span>
          </h1>
          <p className="text-gray-500 font-medium">Mantenha os pais informados com avisos importantes e atualizações.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2 px-8 py-4 rounded-[2rem] shadow-xl shadow-lime-100"
        >
          <Plus size={20} />
          Novo Comunicado
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Statistics or Quick Filters */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
            <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs mb-6">Resumo</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-lime-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <Globe className="text-primary" size={20} />
                  <span className="text-sm font-bold text-gray-700">Gerais</span>
                </div>
                <span className="font-black text-primary">{announcements.filter(a => a.type === 'GERAL').length}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <Users className="text-blue-500" size={20} />
                  <span className="text-sm font-bold text-gray-700">Por Turma</span>
                </div>
                <span className="font-black text-blue-500">{announcements.filter(a => a.type === 'TURMA').length}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-rose-500 to-rose-600 p-8 rounded-[3rem] text-white shadow-xl shadow-rose-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
            <h3 className="font-black uppercase tracking-widest text-xs mb-2 opacity-80">Aviso Crítico</h3>
            <p className="text-sm font-medium leading-relaxed">
              Comunicados marcados como <span className="font-black underline">Urgentes</span> aparecem com destaque no topo do portal dos pais.
            </p>
          </div>
        </div>

        {/* List of Announcements */}
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
          ) : announcements.length === 0 ? (
            <div className="bg-white p-20 rounded-[3rem] border-2 border-dashed border-gray-100 text-center">
              <MessageSquare className="text-gray-200 mx-auto mb-4" size={48} />
              <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Nenhum comunicado enviado</p>
              <button onClick={() => setShowModal(true)} className="text-primary font-black mt-4 hover:underline">Clique para criar o primeiro</button>
            </div>
          ) : (
            <div className="space-y-6">
              {announcements.map((ann, i) => (
                <motion.div 
                  key={ann.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${ann.type === 'GERAL' ? 'bg-lime-100 text-primary' : 'bg-blue-100 text-blue-500'}`}>
                        {ann.type === 'GERAL' ? <Globe size={20} /> : <Users size={20} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            {ann.type === 'GERAL' ? 'Para Todos' : `Turma: ${ann.group?.name}`}
                          </span>
                          {ann.priority === 'URGENTE' && (
                            <span className="bg-rose-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase">Urgente</span>
                          )}
                        </div>
                        <h3 className="text-xl font-black text-gray-900 group-hover:text-primary transition-colors">{ann.title}</h3>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(ann.id)}
                      className="p-2 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                  <p className="text-gray-500 font-medium leading-relaxed mb-6">
                    {ann.content}
                  </p>
                  <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                    <div className="flex items-center gap-2 text-gray-400 text-xs font-bold">
                      <Clock size={14} />
                      {new Date(ann.createdAt).toLocaleDateString('pt-BR')} às {new Date(ann.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="flex items-center gap-2 text-primary font-black text-sm cursor-pointer hover:translate-x-1 transition-transform">
                      Ver detalhes
                      <ChevronRight size={18} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal for New Announcement */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className="bg-white w-full sm:max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-4 sm:hidden" />
              <div className="p-8 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-lime-100">
                    <Send size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">Novo Comunicado</h2>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Preencha os detalhes abaixo</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-3 bg-white rounded-full text-gray-400 hover:text-gray-900 transition-colors shadow-sm"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Título do Comunicado</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Reunião de Pais e Mestres"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    className="w-full px-6 py-4 bg-gray-50 border-transparent border-2 rounded-2xl focus:bg-white focus:border-primary outline-none text-sm font-bold transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Conteúdo</label>
                  <textarea 
                    rows={4}
                    placeholder="Escreva aqui a mensagem completa..."
                    value={formData.content}
                    onChange={e => setFormData({...formData, content: e.target.value})}
                    className="w-full px-6 py-4 bg-gray-50 border-transparent border-2 rounded-2xl focus:bg-white focus:border-primary outline-none text-sm font-bold transition-all min-h-[120px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Alvo</label>
                    <select 
                      value={formData.type}
                      onChange={e => setFormData({...formData, type: e.target.value, groupId: e.target.value === 'GERAL' ? '' : formData.groupId})}
                      className="w-full px-6 py-4 bg-gray-50 border-transparent border-2 rounded-2xl focus:bg-white focus:border-primary outline-none text-sm font-bold transition-all appearance-none"
                    >
                      <option value="GERAL">Todos os Pais</option>
                      <option value="TURMA">Turma Específica</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Prioridade</label>
                    <select 
                      value={formData.priority}
                      onChange={e => setFormData({...formData, priority: e.target.value})}
                      className="w-full px-6 py-4 bg-gray-50 border-transparent border-2 rounded-2xl focus:bg-white focus:border-primary outline-none text-sm font-bold transition-all appearance-none"
                    >
                      <option value="NORMAL">Normal</option>
                      <option value="URGENTE">Urgente 🚨</option>
                    </select>
                  </div>
                </div>

                {formData.type === 'TURMA' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Selecionar Turma</label>
                    <select 
                      value={formData.groupId}
                      onChange={e => setFormData({...formData, groupId: e.target.value})}
                      className="w-full px-6 py-4 bg-gray-50 border-transparent border-2 rounded-2xl focus:bg-white focus:border-primary outline-none text-sm font-bold transition-all appearance-none"
                    >
                      <option value="">Selecione a turma...</option>
                      {groups.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </motion.div>
                )}

                <div className="pt-4">
                  <button 
                    type="submit"
                    className="w-full bg-primary text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-lime-100 hover:bg-lime-600 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                  >
                    <Send size={18} />
                    Enviar Comunicado
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
