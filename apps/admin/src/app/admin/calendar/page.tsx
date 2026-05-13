'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, 
  Plus, Clock, MapPin, Users, Info, X, Check,
  Star, Coffee, PartyPopper, GraduationCap, AlertCircle
} from 'lucide-react'
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, 
  eachDayOfInterval, isToday, parseISO 
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import toast from 'react-hot-toast'

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '',
    endTime: '',
    type: 'EVENTO' as string,
    color: '#38bdf8',
  })

  const fetchEvents = async (month: Date) => {
    setLoading(true)
    try {
      const monthStr = format(month, 'yyyy-MM')
      const res = await fetch(`/api/calendar?month=${monthStr}`)
      if (res.ok) {
        const data = await res.json()
        setEvents(data.map((e: any) => ({
          ...e,
          date: format(new Date(e.date), 'yyyy-MM-dd'),
        })))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchEvents(currentMonth) }, [currentMonth])

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEvent.title) { toast.error('Informe o título do evento'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent),
      })
      if (res.ok) {
        toast.success('Evento criado com sucesso! 🎉')
        setShowModal(false)
        setNewEvent({ title: '', description: '', date: format(new Date(), 'yyyy-MM-dd'), startTime: '', endTime: '', type: 'EVENTO', color: '#38bdf8' })
        fetchEvents(currentMonth)
      } else {
        toast.error('Erro ao salvar evento')
      }
    } catch { toast.error('Erro ao salvar evento') }
    finally { setSaving(false) }
  }

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))

  const onDateClick = (day: Date) => {
    setSelectedDate(day)
  }

  const renderHeader = () => {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2 sm:gap-3">
            <CalendarIcon className="text-primary" size={28} />
            Calendário <span className="text-primary">Escolar</span>
          </h1>
          <p className="text-gray-500 font-medium text-sm">Eventos, reuniões e datas importantes.</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl sm:rounded-[2rem] border border-gray-100 shadow-sm self-start sm:self-auto">
          <button onClick={prevMonth} className="p-2 sm:p-3 hover:bg-gray-50 rounded-full transition-colors text-gray-400 hover:text-primary">
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm sm:text-lg font-black text-gray-900 min-w-[120px] sm:min-w-[150px] text-center capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </span>
          <button onClick={nextMonth} className="p-2 sm:p-3 hover:bg-gray-50 rounded-full transition-colors text-gray-400 hover:text-primary">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    )
  }

  const renderDays = () => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    return (
      <div className="grid grid-cols-7 mb-4">
        {days.map((day, i) => (
          <div key={i} className="text-center text-[10px] font-black text-gray-400 uppercase tracking-widest py-2">
            {day}
          </div>
        ))}
      </div>
    )
  }

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)

    const calendarDays = eachDayOfInterval({
      start: startDate,
      end: endDate,
    })

    return (
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((day, i) => {
          const dayEvents = events.filter(e => isSameDay(parseISO(e.date), day))
          const isSelected = isSameDay(day, selectedDate)
          const isCurrentMonth = isSameMonth(day, monthStart)
          
          return (
            <motion.div
              key={day.toString()}
              whileHover={{ scale: 1.02 }}
              onClick={() => onDateClick(day)}
              className={`min-h-[52px] sm:min-h-[100px] p-1.5 sm:p-3 rounded-xl sm:rounded-[1.5rem] border transition-all cursor-pointer relative group
                ${!isCurrentMonth ? 'bg-gray-50/50 border-transparent opacity-40' : 'bg-white border-gray-100 shadow-sm'}
                ${isSelected ? 'ring-2 ring-primary border-primary bg-lime-50/30' : 'hover:border-primary/30'}
                ${isToday(day) ? 'ring-1 ring-primary/20' : ''}
              `}
            >
              <div className="flex justify-between items-start mb-1 sm:mb-2">
                <span className={`text-xs sm:text-sm font-black ${isToday(day) ? 'text-primary' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}`}>
                  {format(day, 'd')}
                </span>
                {isToday(day) && (
                  <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                )}
              </div>

              {/* Mobile: dots only. Desktop: full labels */}
              <div className="hidden sm:block space-y-1">
                {dayEvents.map(event => (
                  <div
                    key={event.id}
                    className="text-[10px] font-bold px-2 py-1 rounded-lg truncate text-white"
                    style={{ backgroundColor: event.color || '#38bdf8' }}
                  >
                    {event.title}
                  </div>
                ))}
              </div>
              <div className="sm:hidden flex flex-wrap gap-0.5 mt-1">
                {dayEvents.slice(0, 3).map(event => (
                  <span
                    key={event.id}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: event.color || '#38bdf8' }}
                  />
                ))}
              </div>

              {isCurrentMonth && (
                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
                  <div className="p-1 bg-primary/10 text-primary rounded-full">
                    <Plus size={14} />
                  </div>
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-4 md:p-8 animate-in min-h-screen bg-[#FDFCFE] pb-24 lg:pb-8">
      {renderHeader()}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
        {/* Calendar Main Grid */}
        <div className="lg:col-span-3">
          <div className="bg-white p-3 sm:p-6 rounded-[2rem] sm:rounded-[3rem] border border-gray-100 shadow-sm">
            {renderDays()}
            {renderCells()}
          </div>
        </div>

        {/* Sidebar: Selected Date Details */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
            <div className="text-center mb-8">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Detalhes de</p>
              <h2 className="text-2xl font-black text-gray-900 capitalize">
                {format(selectedDate, "EEEE, d", { locale: ptBR })}
              </h2>
            </div>

            <div className="space-y-4">
              {events.filter(e => isSameDay(parseISO(e.date), selectedDate)).length === 0 ? (
                <div className="py-10 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                    <CalendarIcon size={24} />
                  </div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-relaxed px-4">
                    Nenhum evento agendado para este dia.
                  </p>
                </div>
              ) : (
                events.filter(e => isSameDay(parseISO(e.date), selectedDate)).map(event => (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={event.id}
                    className="p-5 rounded-[2rem] border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: event.color }} />
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{event.type}</span>
                    </div>
                    <h4 className="font-black text-gray-900 mb-2">{event.title}</h4>
                    <p className="text-xs text-gray-500 font-medium leading-relaxed mb-4">{event.description}</p>
                    <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400">
                      <div className="flex items-center gap-1">
                        <Clock size={12} className="text-primary" />
                        {event.startTime} - {event.endTime}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            <button 
              onClick={() => setShowModal(true)}
              className="w-full mt-8 bg-gray-900 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-primary transition-all active:scale-[0.98] flex items-center justify-center gap-3"
            >
              <Plus size={18} />
              Novo Evento
            </button>
          </div>

          {/* Quick Categories */}
          <div className="bg-primary p-8 rounded-[3rem] text-white shadow-xl shadow-lime-100">
            <h3 className="font-black uppercase tracking-widest text-xs mb-6 opacity-80">Categorias</h3>
            <div className="space-y-3">
              {[
                { icon: <Star size={14} />, label: 'Eventos Gerais', color: 'bg-blue-400' },
                { icon: <Users size={14} />, label: 'Reuniões', color: 'bg-amber-400' },
                { icon: <PartyPopper size={14} />, label: 'Festividades', color: 'bg-rose-400' },
                { icon: <GraduationCap size={14} />, label: 'Pedagógico', color: 'bg-lime-400' }
              ].map((cat, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-8 h-8 ${cat.color} rounded-xl flex items-center justify-center`}>
                    {cat.icon}
                  </div>
                  <span className="text-xs font-bold">{cat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Novo Evento */}
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
              className="bg-white w-full sm:max-w-lg rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl relative z-10 p-8 sm:p-10 max-h-[90vh] overflow-y-auto"
            >
              {/* Handle bar (mobile) */}
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6 sm:hidden" />

              <div className="flex items-center justify-between mb-8">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Calendário Escolar</p>
                  <h2 className="text-2xl font-black text-gray-900">Novo Evento</h2>
                </div>
                <button onClick={() => setShowModal(false)} className="p-3 hover:bg-gray-100 rounded-2xl transition-colors text-gray-400">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveEvent} className="space-y-5">
                {/* Título */}
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Título *</label>
                  <input
                    type="text"
                    placeholder="Ex: Reunião de Pais"
                    value={newEvent.title}
                    onChange={e => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-5 py-4 rounded-2xl border border-gray-200 bg-gray-50 text-sm font-bold text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>

                {/* Tipo */}
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Tipo</label>
                  <select
                    value={newEvent.type}
                    onChange={e => setNewEvent(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-5 py-4 rounded-2xl border border-gray-200 bg-gray-50 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all appearance-none"
                  >
                    <option value="EVENTO">📅 Evento Geral</option>
                    <option value="REUNIAO">👥 Reunião</option>
                    <option value="FESTIVIDADE">🎉 Festividade</option>
                    <option value="FERIADO">🏖️ Feriado</option>
                    <option value="OUTRO">📌 Outro</option>
                  </select>
                </div>

                {/* Data */}
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Data</label>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={e => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-5 py-4 rounded-2xl border border-gray-200 bg-gray-50 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>

                {/* Horário */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Início</label>
                    <input
                      type="time"
                      value={newEvent.startTime}
                      onChange={e => setNewEvent(prev => ({ ...prev, startTime: e.target.value }))}
                      className="w-full px-4 py-4 rounded-2xl border border-gray-200 bg-gray-50 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Término</label>
                    <input
                      type="time"
                      value={newEvent.endTime}
                      onChange={e => setNewEvent(prev => ({ ...prev, endTime: e.target.value }))}
                      className="w-full px-4 py-4 rounded-2xl border border-gray-200 bg-gray-50 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                  </div>
                </div>

                {/* Cor */}
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">Cor do Evento</label>
                  <div className="flex gap-3 flex-wrap">
                    {[
                      { color: '#38bdf8', label: 'Azul' },
                      { color: '#a78bfa', label: 'Roxo' },
                      { color: '#fb923c', label: 'Laranja' },
                      { color: '#f87171', label: 'Vermelho' },
                      { color: '#4ade80', label: 'Verde' },
                      { color: '#fbbf24', label: 'Amarelo' },
                      { color: '#94a3b8', label: 'Cinza' },
                    ].map(({ color, label }) => (
                      <button
                        key={color}
                        type="button"
                        title={label}
                        onClick={() => setNewEvent(prev => ({ ...prev, color }))}
                        className={`w-9 h-9 rounded-full transition-all ${newEvent.color === color ? 'ring-4 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Descrição */}
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Descrição (opcional)</label>
                  <textarea
                    placeholder="Detalhes do evento..."
                    value={newEvent.description}
                    onChange={e => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-5 py-4 rounded-2xl border border-gray-200 bg-gray-50 text-sm font-medium text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
                  />
                </div>

                {/* Botões */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-4 rounded-2xl border border-gray-200 font-black text-sm text-gray-500 hover:bg-gray-50 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-4 rounded-2xl bg-gray-900 text-white font-black text-sm uppercase tracking-[0.15em] hover:bg-primary transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Check size={16} />
                    )}
                    {saving ? 'Salvando...' : 'Salvar'}
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
