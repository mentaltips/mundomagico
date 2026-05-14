'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, Filter, Plus, Send, 
  Moon, Utensils, Bath, Heart, 
  Smile, Camera, MoreVertical, 
  CheckCircle2, AlertCircle, Clock, X, Loader2
} from 'lucide-react'
import { DailyRoutineForm } from './_components/DailyRoutineForm'
import { Modal, PageHeader, EmptyState, Avatar, Badge, LoadingState } from '@/components/ui'
import toast from 'react-hot-toast'

export default function DailyRoutinePage() {
  const [children, setChildren] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('todos')
  const [search, setSearch] = useState('')
  const [selectedChild, setSelectedChild] = useState<any | null>(null)

  const fetchChildren = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/daily-routine')
      if (res.ok) {
        const data = await res.json()
        setChildren(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      toast.error('Erro ao carregar crianças')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (reportId: string) => {
    try {
      const res = await fetch(`/api/daily-routine/${reportId}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Diário excluído com sucesso')
        fetchChildren()
      }
    } catch (error) {
      toast.error('Erro ao excluir diário')
    }
  }

  useEffect(() => {
    fetchChildren()
  }, [])

  const filteredChildren = children.filter(c => {
    const matchesSearch = (c.fullName || '').toLowerCase().includes(search.toLowerCase())
    if (filter === 'todos') return matchesSearch
    if (filter === 'pendentes') return matchesSearch && (c.dailyReports?.length || 0) === 0
    if (filter === 'finalizados') return matchesSearch && (c.dailyReports?.length || 0) > 0 && !c.dailyReports?.[0]?.isDraft
    return matchesSearch
  })

  return (
    <div className="page animate-in">
      <PageHeader 
        title="Diário de Rotina" 
        subtitle="Acompanhe e registre o dia a dia das crianças em tempo real."
        icon={<Utensils size={24} />}
      />

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nome da criança..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'pendentes', label: 'Pendentes' },
            { id: 'finalizados', label: 'Finalizados' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              className={`px-5 py-2 rounded-xl font-black text-xs whitespace-nowrap uppercase tracking-widest transition-all ${
                filter === t.id 
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                  : 'bg-card border border-border text-muted-foreground hover:border-primary/50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingState label="Carregando crianças..." />
      ) : filteredChildren.length === 0 ? (
        <EmptyState 
          icon={<Smile size={32} />}
          title="Nenhuma criança encontrada"
          description="Tente ajustar sua busca ou os filtros de status."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredChildren.map((child, i) => {
            const report = child.dailyReports?.[0]
            const isFinished = report && !report.isDraft

            return (
              <motion.div
                key={child.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="card-hover flex flex-col group overflow-hidden"
              >
                {/* Card Header */}
                <div className="p-6 pb-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar name={child.fullName} photoUrl={child.photoUrl} size="md" />
                    <div className="min-w-0">
                      <p className="font-black text-foreground truncate max-w-[160px] text-lg tracking-tight">
                        {child.fullName || 'Criança sem nome'}
                      </p>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.1em]">
                        {child.group?.name || 'Sem Turma'}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      const hasReport = child.dailyReports?.[0];
                      if (hasReport) {
                        if (confirm(`Excluir diário de ${child.fullName.split(' ')[0]}?`)) {
                          handleDelete(hasReport.id);
                        }
                      } else {
                        toast.error('Nenhum diário para excluir');
                      }
                    }}
                    className="p-2.5 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all active:scale-90"
                    title="Excluir Diário"
                  >
                    <MoreVertical size={20} />
                  </button>
                </div>

                {/* Icons Bar */}
                <div className="px-6 py-4 flex justify-between border-t border-border bg-accent/10">
                  <div className="flex gap-3">
                    <Utensils size={18} className={report?.meals?.length > 0 ? 'text-primary' : 'text-muted-foreground/20'} />
                    <Moon size={18} className={report?.sleep ? 'text-primary' : 'text-muted-foreground/20'} />
                    <Bath size={18} className={report?.hygiene ? 'text-primary' : 'text-muted-foreground/20'} />
                  </div>
                  <Badge 
                    label={isFinished ? 'Enviado' : 'Pendente'} 
                    variant={isFinished ? 'green' : 'amber'} 
                    dot={!isFinished}
                  />
                </div>

                {/* Footer Actions */}
                <div className="p-4 mt-auto border-t border-border bg-card">
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => setSelectedChild(child)}
                      className="btn-ghost py-2.5 rounded-xl text-[11px] flex items-center justify-center gap-2"
                    >
                      <Plus size={14} /> Registrar
                    </button>
                    <button 
                      onClick={() => setSelectedChild(child)}
                      className={`py-2.5 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                        isFinished 
                          ? 'bg-emerald-500/10 text-emerald-600' 
                          : 'bg-primary text-primary-foreground hover:bg-primary/90'
                      }`}
                    >
                      {isFinished ? (
                        <>
                          <CheckCircle2 size={14} /> Enviado
                        </>
                      ) : (
                        <>
                          <Send size={14} /> Enviar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Modal for Daily Routine Form */}
      <Modal 
        open={!!selectedChild} 
        onClose={() => setSelectedChild(null)}
        title={selectedChild?.fullName || 'Registrar Rotina'}
        subtitle={`Diário de Hoje • ${new Date().toLocaleDateString('pt-BR')}`}
        size="lg"
      >
        {selectedChild && (
          <DailyRoutineForm 
            onSuccess={() => {
              setSelectedChild(null)
              fetchChildren()
            }}
            childId={selectedChild.id}
            date={new Date().toISOString()}
            usesDiapers={selectedChild.usesDiapers || false}
            usesBottle={selectedChild.usesBottle || false}
            existingReport={selectedChild.dailyReports?.[0] || null}
            guardians={selectedChild.guardians?.map((g: any) => ({
              id: g.guardian.id,
              name: g.guardian.name,
              phone: g.guardian.phone
            })) || []}
          />
        )}
      </Modal>
    </div>
  )
}
