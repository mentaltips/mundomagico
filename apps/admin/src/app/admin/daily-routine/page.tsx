'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, Filter, Plus, Send, 
  Moon, Utensils, Bath, Heart, 
  Smile, Camera, MoreVertical, 
  CheckCircle2, AlertCircle, Clock, X
} from 'lucide-react'
import { DailyRoutineForm } from './_components/DailyRoutineForm'
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

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 animate-in relative min-h-screen pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Diário de <span className="text-primary">Rotina</span></h1>
          <p className="text-gray-500 font-medium">Acompanhe e registre o dia a dia das crianças em tempo real.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar criança..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary outline-none transition-all shadow-sm"
            />
          </div>
          <button className="p-3 bg-white border border-gray-100 rounded-xl text-gray-500 hover:bg-gray-50 transition-all shadow-sm">
            <Filter size={20} />
          </button>
        </div>
      </div>

      {/* Tabs / Filters */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { id: 'todos', label: 'Todos' },
          { id: 'pendentes', label: 'Pendentes' },
          { id: 'finalizados', label: 'Finalizados' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id)}
            className={`px-6 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition-all shadow-sm ${
              filter === t.id 
                ? 'bg-primary text-white shadow-lg shadow-lime-100' 
                : 'bg-white border border-gray-100 text-gray-500 hover:bg-gray-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Grid of Children Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredChildren.map((child, i) => {
          const report = child.dailyReports?.[0]
          const isFinished = report && !report.isDraft

          return (
            <motion.div
              key={child.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col group"
            >
              {/* Card Header */}
              <div className="p-6 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {child.photoUrl ? (
                    <img src={child.photoUrl} className="w-12 h-12 rounded-2xl object-cover" alt="" />
                  ) : (
                    <div className="w-12 h-12 bg-lime-100 rounded-2xl flex items-center justify-center text-primary font-black">
                      {child.fullName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="font-black text-gray-900 leading-none mb-1 group-hover:text-primary transition-colors truncate max-w-[120px]">
                      {child.fullName.split(' ')[0]} {child.fullName.split(' ')[1] || ''}
                    </div>
                    <div className="text-xs font-bold text-gray-400">Turma {child.group?.name || '---'}</div>
                  </div>
                </div>
                <button className="p-2 text-gray-300 hover:text-gray-600 hover:bg-gray-50 rounded-xl">
                  <MoreVertical size={20} />
                </button>
              </div>

              {/* Icons Bar */}
              <div className="px-6 py-4 flex justify-between border-t border-gray-50 bg-gray-50/30">
                <div className="flex gap-4">
                  <Utensils size={18} className={report?.meals?.length > 0 ? 'text-emerald-500' : 'text-gray-200'} />
                  <Moon size={18} className={report?.sleep ? 'text-primary' : 'text-gray-200'} />
                  <Bath size={18} className={report?.hygiene ? 'text-blue-500' : 'text-gray-200'} />
                </div>
                {!isFinished && (
                  <div className="flex items-center gap-1 text-amber-500 font-black text-[10px] uppercase tracking-tighter">
                    <Clock size={12} />
                    Pendente
                  </div>
                )}
                {isFinished && (
                  <div className="flex items-center gap-1 text-emerald-500 font-black text-[10px] uppercase tracking-tighter">
                    <CheckCircle2 size={12} />
                    Pronto
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="p-4 pt-4 mt-auto border-t border-gray-50">
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setSelectedChild(child)}
                    className="py-3 bg-white border border-gray-100 text-gray-700 rounded-xl font-bold text-xs hover:bg-gray-50 transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Plus size={16} />
                    Lançar
                  </button>
                  <button className={`py-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 shadow-sm ${
                    isFinished 
                      ? 'bg-emerald-50 text-emerald-600' 
                      : 'bg-primary text-white hover:bg-lime-600'
                  }`}>
                    {isFinished ? (
                      <>
                        <CheckCircle2 size={16} />
                        Enviado
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        Enviar
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Modal for Daily Routine Form */}
      <AnimatePresence>
        {selectedChild && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedChild(null)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] shadow-2xl relative z-10"
            >
              <div className="sticky top-0 bg-white p-6 border-b border-gray-100 flex justify-between items-center z-20">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-lime-100 rounded-2xl flex items-center justify-center text-primary font-black">
                    {selectedChild.fullName.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">{selectedChild.fullName}</h2>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Diário de Hoje • {new Date().toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedChild(null)}
                  className="p-3 bg-gray-50 rounded-full text-gray-400 hover:text-gray-900 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-2 md:p-6">
                <DailyRoutineForm 
                  childId={selectedChild.id}
                  date={new Date().toISOString()}
                  usesDiapers={selectedChild.usesDiapers || false}
                  usesBottle={selectedChild.usesBottle || false}
                  existingReport={selectedChild.dailyReports?.[0] || null}
                  guardians={[]} // Can fetch if needed
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
