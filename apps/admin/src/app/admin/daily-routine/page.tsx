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
        setChildren(data)
      }
    } catch (error) {
      toast.error('Erro ao carregar crianças')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchChildren()
  }, [])

  const filteredChildren = children.filter(c => {
    const matchesSearch = c.fullName.toLowerCase().includes(search.toLowerCase())
    if (filter === 'todos') return matchesSearch
    if (filter === 'pendentes') return matchesSearch && c.dailyReports.length === 0
    if (filter === 'finalizados') return matchesSearch && c.dailyReports.length > 0 && !c.dailyReports[0].isDraft
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
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
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
                  <div className="flex items-center gap-3">
                    <Avatar name={child.fullName} photoUrl={child.photoUrl} size="md" />
                    <div className="min-w-0">
                      <p className="font-black text-foreground truncate max-w-[140px]">
                        {child.fullName.split(' ')[0]} {child.fullName.split(' ')[1] || ''}
                      </p>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        {child.group?.name || '---'}
                      </p>
                    </div>
                  </div>
                  <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl transition-colors">
                    <MoreVertical size={18} />
                  </button>
                </div>

                {/* Icons Bar */}
                <div className="px-6 py-4 flex justify-between border-t border-border bg-accent/20">
                  <div className="flex gap-3">
                    <Utensils size={18} className={report?.meals?.length > 0 ? 'text-emerald-500' : 'text-muted-foreground/30'} />
                    <Moon size={18} className={report?.sleep ? 'text-primary' : 'text-muted-foreground/30'} />
                    <Bath size={18} className={report?.hygiene ? 'text-blue-500' : 'text-muted-foreground/30'} />
                  </div>
                  <Badge 
                    label={isFinished ? 'Pronto' : 'Pendente'} 
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
                    <button className={`py-2.5 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                      isFinished 
                        ? 'bg-emerald-500/10 text-emerald-600' 
                        : 'bg-primary text-primary-foreground hover:bg-primary/90'
                    }`}>
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
          <div className="py-2">
            <DailyRoutineForm 
              childId={selectedChild.id}
              date={new Date().toISOString()}
              usesDiapers={selectedChild.usesDiapers || false}
              usesBottle={selectedChild.usesBottle || false}
              existingReport={selectedChild.dailyReports?.[0] || null}
              guardians={[]}
            />
          </div>
        )}
      </Modal>
    </div>
  )
}
