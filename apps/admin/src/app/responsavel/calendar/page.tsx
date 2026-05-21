'use client'

import { useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight, Loader2, Heart, ShieldCheck, LogIn, LogOut, AlertTriangle, Utensils, Moon } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, getDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type CalendarEvent = {
  id: string
  title: string
  description: string | null
  date: string
  startTime: string | null
  endTime: string | null
  type: string
  location: string | null
  color: string | null
}

const EVENT_LABELS: Record<string, string> = {
  EVENTO:      'Evento',
  REUNIAO:     'Reunião',
  FERIADO:     'Feriado',
  FESTIVIDADE: 'Festividade',
  OUTRO:       'Outro',
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export default function GuardianCalendarPage() {
  const [current, setCurrent] = useState(new Date())

  const month = format(current, 'yyyy-MM')

  const { data: events = [], isLoading } = useQuery<CalendarEvent[]>({
    queryKey: ['guardian-calendar', month],
    queryFn: async () => {
      const res = await fetch(`/api/responsavel/calendar?month=${month}`)
      if (!res.ok) return []
      const data = await res.json()
      return Array.isArray(data) ? data : []
    },
  })

  const days = eachDayOfInterval({ start: startOfMonth(current), end: endOfMonth(current) })
  const startWeekday = getDay(startOfMonth(current))

  const normalizeDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return new Date(d.getTime() + d.getTimezoneOffset() * 60000)
  }

  const eventsForDay = (day: Date) =>
    events.filter((e) => isSameDay(normalizeDate(e.date), day))

  const upcoming = events
    .filter((e) => normalizeDate(e.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5)

  return (
    <div className="space-y-6 max-w-2xl mx-auto p-4 sm:p-0 text-foreground">
      <div>
        <h1 className="text-2xl font-black flex items-center gap-2">
          <Calendar className="text-primary" size={24} />
          Calendário Escolar
        </h1>
        <p className="text-sm text-muted-foreground mt-1 font-medium">Eventos, reuniões e feriados da escola</p>
      </div>

      {/* Navegação do mês */}
      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => setCurrent((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
            className="p-2.5 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-all"
          >
            <ChevronLeft size={22} />
          </button>
          <h2 className="font-black text-xl capitalize tracking-tight">
            {format(current, 'MMMM yyyy', { locale: ptBR })}
          </h2>
          <button
            onClick={() => setCurrent((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
            className="p-2.5 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-all"
          >
            <ChevronRight size={22} />
          </button>
        </div>

        {/* Grade dos dias */}
        <div className="grid grid-cols-7 gap-2 mb-3">
          {WEEKDAYS.map((w) => (
            <div key={w} className="text-center text-[11px] font-black text-muted-foreground/50 uppercase tracking-widest py-1">
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: startWeekday }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {days.map((day) => {
            const dayEvents = eventsForDay(day)
            const today = isToday(day)
            return (
              <div
                key={day.toISOString()}
                className={`aspect-square flex flex-col items-center justify-center rounded-2xl text-sm font-bold transition-all ${
                  today 
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105 z-10' 
                    : 'hover:bg-accent'
                }`}
              >
                <span>{format(day, 'd')}</span>
                {dayEvents.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {dayEvents.slice(0, 3).map((_, i) => (
                      <span key={i} className={`w-1.5 h-1.5 rounded-full ${today ? 'bg-primary-foreground/60' : 'bg-primary/50'}`} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Próximos eventos */}
      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
        <h2 className="text-lg font-black mb-6 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-primary rounded-full" />
          Próximos Eventos
        </h2>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="text-primary animate-spin" size={32} />
          </div>
        ) : upcoming.length === 0 ? (
          <div className="text-center py-12 bg-accent/30 rounded-3xl border-2 border-dashed border-border/50">
            <Calendar className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-muted-foreground text-sm font-black uppercase tracking-widest">Nenhum evento próximo</p>
          </div>
        ) : (
          <div className="space-y-4">
            {upcoming.map((event) => {
              const eventDate = normalizeDate(event.date)
              return (
                <div key={event.id} className="flex items-center gap-5 p-5 bg-accent/40 rounded-[2rem] border border-border/50 hover:bg-accent/60 transition-colors">
                  <div className="text-center shrink-0 w-14 py-2 bg-background rounded-2xl border border-border shadow-sm">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                      {format(eventDate, 'MMM', { locale: ptBR })}
                    </p>
                    <p className="text-2xl font-black leading-none mt-1">
                      {format(eventDate, 'd')}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-base tracking-tight truncate">{event.title}</p>
                    {event.description && (
                      <p className="text-xs text-muted-foreground font-medium mt-1 line-clamp-1 italic">{event.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        event.type === 'FERIADO' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                        event.type === 'REUNIAO' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' :
                        'bg-primary/10 text-primary border-primary/20'
                      }`}>
                        {EVENT_LABELS[event.type] ?? event.type}
                      </span>
                      {event.startTime && (
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter opacity-60">
                          🕒 {event.startTime}{event.endTime ? ` – ${event.endTime}` : ''}
                        </span>
                      )}
                      {event.location && (
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter opacity-60">
                          📍 {event.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
