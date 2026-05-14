'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, 
  Plus, Clock, MapPin, Users, Info, X, Check,
  Star, Coffee, PartyPopper, GraduationCap, AlertCircle, Loader2, Trash2
} from 'lucide-react'
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, 
  eachDayOfInterval, isToday, parseISO 
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Modal, PageHeader, EmptyState, Badge, LoadingState } from '@/components/ui'
import toast from 'react-hot-toast'

export default function CalendarClient() {
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
    type: 'EVENTO',
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
        toast.success('Evento criado! 🎉')
        setShowModal(false)
        setNewEvent({ title: '', description: '', date: format(new Date(), 'yyyy-MM-dd'), startTime: '', endTime: '', type: 'EVENTO', color: '#38bdf8' })
        fetchEvents(currentMonth)
      } else {
        toast.error('Erro ao salvar evento')
      }
    } catch { toast.error('Erro ao salvar evento') }
    finally { setSaving(false) }
  }
  
  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Deseja realmente excluir este evento?')) return
    try {
      const res = await fetch(`/api/calendar/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Evento excluído')
        fetchEvents(currentMonth)
      } else {
        toast.error('Erro ao excluir evento')
      }
    } catch {
      toast.error('Erro ao excluir evento')
    }
  }

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate })

  return (
    <div className="page animate-in">
      <PageHeader 
        title="Calendário Escolar" 
        subtitle="Eventos, reuniões e datas importantes da escola."
        icon={<CalendarIcon size={24} />}
        actions={
          <button 
            onClick={() => {
              setNewEvent(prev => ({ ...prev, date: format(selectedDate, 'yyyy-MM-dd') }))
              setShowModal(true)
            }} 
            className="btn-primary"
          >
            <Plus size={18} /> Novo Evento
          </button>
        }
      />

      {/* Month Navigator */}
      <div className="flex items-center justify-between bg-card p-4 rounded-3xl border border-border shadow-sm">
        <button onClick={prevMonth} className="btn-ghost p-2 rounded-xl">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-xl font-black text-foreground capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </h2>
        <button onClick={nextMonth} className="btn-ghost p-2 rounded-xl">
          <ChevronRight size={24} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Calendar Grid */}
        <div className="lg:col-span-3">
          <div className="bg-card p-4 rounded-[2rem] border border-border shadow-sm">
            {/* Days Header */}
            <div className="grid grid-cols-7 mb-2">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                <div key={day} className="text-center text-[10px] font-black text-muted-foreground uppercase tracking-widest py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Cells */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {calendarDays.map((day, i) => {
                const dayEvents = events.filter(e => isSameDay(parseISO(e.date), day))
                const isSelected = isSameDay(day, selectedDate)
                const isCurrentMonth = isSameMonth(day, monthStart)
                
                return (
                  <motion.div
                    key={day.toString()}
                    onClick={() => setSelectedDate(day)}
                    className={`min-h-[60px] sm:min-h-[100px] p-2 sm:p-3 rounded-2xl border transition-all cursor-pointer relative group
                      ${!isCurrentMonth ? 'bg-accent/10 border-transparent opacity-30' : 'bg-accent/20 border-border/50 hover:border-primary/50'}
                      ${isSelected ? 'ring-2 ring-primary border-primary bg-primary/5' : ''}
                      ${isToday(day) ? 'bg-primary/5 border-primary/20' : ''}
                    `}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-xs sm:text-sm font-black ${isToday(day) ? 'text-primary' : isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {format(day, 'd')}
                      </span>
                      {isToday(day) && (
                        <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                      )}
                    </div>

                    <div className="hidden sm:block space-y-1">
                      {dayEvents.slice(0, 2).map(event => (
                        <div
                          key={event.id}
                          className="text-[9px] font-black px-1.5 py-0.5 rounded-lg truncate text-white uppercase tracking-tighter"
                          style={{ backgroundColor: event.color || '#38bdf8' }}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <p className="text-[9px] font-black text-muted-foreground ml-1">+{dayEvents.length - 2} mais</p>
                      )}
                    </div>
                    
                    <div className="sm:hidden flex flex-wrap gap-0.5 mt-1">
                      {dayEvents.map(event => (
                        <span key={event.id} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: event.color || '#38bdf8' }} />
                      ))}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Sidebar: Day Details */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card p-6 rounded-[2rem] border border-border shadow-sm h-full">
            <div className="text-center mb-6">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                {format(selectedDate, "MMMM", { locale: ptBR })}
              </p>
              <h2 className="text-3xl font-black text-foreground">
                {format(selectedDate, "d")}
              </h2>
              <p className="text-xs font-bold text-primary capitalize">
                {format(selectedDate, "EEEE", { locale: ptBR })}
              </p>
            </div>

            <div className="space-y-4">
              {events.filter(e => isSameDay(parseISO(e.date), selectedDate)).length === 0 ? (
                <div className="py-12 text-center">
                  <CalendarIcon className="text-muted-foreground/20 mx-auto mb-4" size={40} />
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-4">
                    Nenhum evento agendado.
                  </p>
                </div>
              ) : (
                events.filter(e => isSameDay(parseISO(e.date), selectedDate)).map(event => (
                  <div 
                    key={event.id}
                    className="p-4 rounded-2xl border border-border bg-accent/20 hover:bg-accent/40 transition-colors group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: event.color }} />
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{event.type}</span>
                      </div>
                      <button 
                        onClick={() => handleDeleteEvent(event.id)}
                        className="p-1.5 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <h4 className="font-black text-sm text-foreground mb-1">{event.title}</h4>
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{event.description}</p>
                    <div className="flex items-center gap-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                      <Clock size={12} className="text-primary" />
                      {event.startTime || '—'} - {event.endTime || '—'}
                    </div>
                  </div>
                ))
              )}
            </div>

            <button 
              onClick={() => {
                setNewEvent(prev => ({ ...prev, date: format(selectedDate, 'yyyy-MM-dd') }))
                setShowModal(true)
              }}
              className="btn-primary w-full mt-8 py-4 text-xs tracking-widest"
            >
              <Plus size={18} /> Novo Evento
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Novo Evento */}
      <Modal 
        open={showModal} 
        onClose={() => setShowModal(false)}
        title="Agendar Evento"
        subtitle="Adicione uma data importante ao calendário escolar."
      >
        <form onSubmit={handleSaveEvent} className="space-y-5">
          <div>
            <label className="label">Título do Evento *</label>
            <input
              type="text"
              placeholder="Ex: Reunião de Pais"
              value={newEvent.title}
              onChange={e => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
              className="input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Data</label>
              <input
                type="date"
                value={newEvent.date}
                onChange={e => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                className="input"
              />
            </div>
            <div>
              <label className="label">Tipo</label>
              <select
                value={newEvent.type}
                onChange={e => setNewEvent(prev => ({ ...prev, type: e.target.value }))}
                className="select"
              >
                <option value="EVENTO">📅 Evento Geral</option>
                <option value="REUNIAO">👥 Reunião</option>
                <option value="FESTIVIDADE">🎉 Festividade</option>
                <option value="FERIADO">🏖️ Feriado</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Início</label>
              <input
                type="time"
                value={newEvent.startTime}
                onChange={e => setNewEvent(prev => ({ ...prev, startTime: e.target.value }))}
                className="input"
              />
            </div>
            <div>
              <label className="label">Fim</label>
              <input
                type="time"
                value={newEvent.endTime}
                onChange={e => setNewEvent(prev => ({ ...prev, endTime: e.target.value }))}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label">Cor do Destaque</label>
            <div className="flex gap-2.5 flex-wrap pt-1">
              {['#38bdf8', '#a78bfa', '#fb923c', '#f87171', '#4ade80', '#fbbf24'].map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewEvent(prev => ({ ...prev, color }))}
                  className={`w-8 h-8 rounded-full transition-all ${newEvent.color === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="label">Descrição</label>
            <textarea
              placeholder="Detalhes adicionais..."
              value={newEvent.description}
              onChange={e => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="input min-h-[80px]"
            />
          </div>

          <div className="pt-4 flex gap-3 border-t border-border">
            <button type="button" onClick={() => setShowModal(false)} className="btn-ghost flex-1">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 gap-2">
              {saving ? <Loader2 size={18} className="animate-spin" /> : <><Check size={18} /> Salvar Evento</>}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
