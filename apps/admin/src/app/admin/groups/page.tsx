'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Plus, MoreVertical, X, Check,
  Clock, MapPin, ChevronRight,
  TrendingUp, Loader2
} from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

export default function GroupsPage() {
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', shift: 'MANHA', capacity: '', room: '' })

  const { data: groups, isLoading, error } = useQuery({
    queryKey: ['groups'],
    queryFn: () => fetch('/api/groups').then(r => r.json())
  })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Informe o nome da turma'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          shift: form.shift,
          capacity: form.capacity ? Number(form.capacity) : undefined,
          room: form.room || undefined,
        }),
      })
      if (res.ok) {
        toast.success('Turma criada com sucesso! 🎉')
        setShowModal(false)
        setForm({ name: '', shift: 'MANHA', capacity: '', room: '' })
        queryClient.invalidateQueries({ queryKey: ['groups'] })
      } else {
        toast.error('Erro ao criar turma')
      }
    } catch { toast.error('Erro ao criar turma') }
    finally { setSaving(false) }
  }

  return (
    <div className="p-3 sm:p-4 md:p-8 animate-in pb-24 lg:pb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Gestão de <span className="text-indigo-600">Turmas</span></h1>
          <p className="text-gray-500 font-medium">Organize salas, horários e capacidade de atendimento.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all w-full md:w-auto"
        >
          <Plus size={18} />
          Nova Turma
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Users size={20} />
            </div>
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Total de Turmas</span>
          </div>
          <div className="text-3xl font-black text-gray-900">{groups?.length || 0}</div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <TrendingUp size={20} />
            </div>
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Ocupação Média</span>
          </div>
          <div className="text-3xl font-black text-gray-900">84%</div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-gray-100 shadow-sm">
          <Loader2 className="text-indigo-600 animate-spin mb-4" size={40} />
          <p className="text-gray-400 font-black uppercase text-xs tracking-widest">Carregando Turmas...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-12 text-center bg-rose-50 rounded-[2rem] border border-rose-100 text-rose-600">
          <p className="font-black">Erro ao carregar turmas.</p>
        </div>
      )}

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {groups?.map((group, i) => (
          <motion.div 
            key={group.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all p-8 group relative overflow-hidden"
          >
            {/* Color Accent */}
            <div className={`absolute top-0 left-0 w-full h-2 ${
              i % 3 === 0 ? 'bg-rose-400' : i % 3 === 1 ? 'bg-indigo-400' : 'bg-emerald-400'
            }`} />

            <div className="flex justify-between items-start mb-6">
              <div className="p-4 bg-gray-50 rounded-2xl text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                <Users size={24} />
              </div>
              <button className="text-gray-300 hover:text-gray-600 transition-colors">
                <MoreVertical size={20} />
              </button>
            </div>

            <h3 className="text-2xl font-black text-gray-900 mb-2">{group.name}</h3>
            <p className="text-gray-400 font-medium text-sm mb-6 flex items-center gap-2">
              <MapPin size={14} />
              {group.room || 'Sem sala definida'}
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-bold">Capacidade</span>
                <span className="font-black text-gray-900">{group._count.students + group._count.children}/{group.capacity || '∞'}</span>
              </div>
              <div className="w-full h-2 bg-gray-50 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${
                    i % 3 === 0 ? 'bg-rose-400' : i % 3 === 1 ? 'bg-indigo-400' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${Math.min(((group._count.students + group._count.children) / (group.capacity || 1)) * 100, 100)}%` }}
                />
              </div>
              <div className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest">
                <Clock size={14} />
                {group.shift}
              </div>
            </div>

            <button className="w-full py-4 bg-gray-50 text-gray-600 rounded-2xl font-black text-sm flex items-center justify-center gap-2 group-hover:bg-indigo-600 group-hover:text-white transition-all">
              Ver Alunos
              <ChevronRight size={18} />
            </button>
          </motion.div>
        ))}
      </div>

      {/* Modal: Nova Turma */}
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
              className="bg-white w-full sm:max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl relative z-10 p-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6 sm:hidden" />
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-gray-900">Nova Turma</h2>
                <button onClick={() => setShowModal(false)} className="p-2.5 hover:bg-gray-100 rounded-2xl transition-colors text-gray-400">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-5">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Nome da Turma *</label>
                  <input
                    type="text"
                    placeholder="Ex: Jardim I"
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full px-5 py-4 rounded-2xl border border-gray-200 bg-gray-50 text-sm font-bold text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Turno</label>
                  <select
                    value={form.shift}
                    onChange={e => setForm(p => ({ ...p, shift: e.target.value }))}
                    className="w-full px-5 py-4 rounded-2xl border border-gray-200 bg-gray-50 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all appearance-none"
                  >
                    <option value="MANHA">☀️ Manhã</option>
                    <option value="TARDE">🌤️ Tarde</option>
                    <option value="INTEGRAL">📅 Integral</option>
                    <option value="NOTURNO">🌙 Noturno</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Capacidade</label>
                    <input
                      type="number"
                      placeholder="Ex: 20"
                      min={1}
                      value={form.capacity}
                      onChange={e => setForm(p => ({ ...p, capacity: e.target.value }))}
                      className="w-full px-4 py-4 rounded-2xl border border-gray-200 bg-gray-50 text-sm font-bold text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Sala</label>
                    <input
                      type="text"
                      placeholder="Ex: Sala 3"
                      value={form.room}
                      onChange={e => setForm(p => ({ ...p, room: e.target.value }))}
                      className="w-full px-4 py-4 rounded-2xl border border-gray-200 bg-gray-50 text-sm font-bold text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 rounded-2xl border border-gray-200 font-black text-sm text-gray-500 hover:bg-gray-50 transition-all">
                    Cancelar
                  </button>
                  <button type="submit" disabled={saving} className="flex-1 py-4 rounded-2xl bg-indigo-600 text-white font-black text-sm hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={16} />}
                    {saving ? 'Salvando...' : 'Criar Turma'}
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
