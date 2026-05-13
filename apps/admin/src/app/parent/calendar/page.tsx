'use client'

import { useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, getDay } from 'date-fns'
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

const EVENT_COLORS: Record<string, string> = {
  EVENTO:      'bg-blue-100 text-blue-700',
  REUNIAO:     'bg-purple-100 text-purple-700',
  FERIADO:     'bg-red-100 text-red-700',
  FESTIVIDADE: 'bg-amber-100 text-amber-700',
  OUTRO:       'bg-gray-100 text-gray-600',
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
    queryFn: () => fetch(`/api/calendar?month=${month}`).then((r) => r.json()),
  })

  const days = eachDayOfInterval({ start: startOfMonth(current), end: endOfMonth(current) })
  const startWeekday = getDay(startOfMonth(current))

  const eventsForDay = (day: Date) =>
    events.filter((e) => isSameDay(new Date(e.date), day))

  const upcoming = events
    .filter((e) => new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5)

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <Calendar className="text-sky-500" size={24} />
          Calendário Escolar
        </h1>
        <p className="text-sm text-gray-500 mt-1">Eventos, reuniões e feriados da escola</p>
      </div>

      {/* Navegação do mês */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setCurrent((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className="font-black text-gray-900 text-lg capitalize">
            {format(current, 'MMMM yyyy', { locale: ptBR })}
          </h2>
          <button
            onClick={() => setCurrent((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Grade dos dias */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAYS.map((w) => (
            <div key={w} className="text-center text-[10px] font-black text-gray-400 uppercase tracking-wider py-1">
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startWeekday }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {days.map((day) => {
            const dayEvents = eventsForDay(day)
            const today = isToday(day)
            return (
              <div
                key={day.toISOString()}
                className={`aspect-square flex flex-col items-center justify-start pt-1.5 rounded-xl text-sm font-bold transition-colors ${
                  today ? 'bg-sky-500 text-white' : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <span>{format(day, 'd')}</span>
                {dayEvents.length > 0 && (
                  <div className="flex gap-0.5 mt-1">
                    {dayEvents.slice(0, 3).map((_, i) => (
                      <span key={i} className={`w-1.5 h-1.5 rounded-full ${today ? 'bg-white/70' : 'bg-sky-400'}`} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Próximos eventos */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-black text-gray-900 mb-4">Próximos Eventos</h2>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="text-sky-500 animate-spin" size={28} />
          </div>
        ) : upcoming.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm font-medium">Nenhum evento próximo</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((event) => (
              <div key={event.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl">
                <div className="text-center shrink-0 w-12">
                  <p className="text-xs font-black text-gray-400 uppercase">
                    {format(new Date(event.date), 'MMM', { locale: ptBR })}
                  </p>
                  <p className="text-2xl font-black text-gray-900 leading-none">
                    {format(new Date(event.date), 'd')}
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-gray-900 truncate">{event.title}</p>
                  {event.description && (
                    <p className="text-xs text-gray-500 font-medium mt-0.5 line-clamp-2">{event.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${EVENT_COLORS[event.type] ?? 'bg-gray-100 text-gray-500'}`}>
                      {EVENT_LABELS[event.type] ?? event.type}
                    </span>
                    {event.startTime && (
                      <span className="text-[10px] font-bold text-gray-400">{event.startTime}{event.endTime ? ` – ${event.endTime}` : ''}</span>
                    )}
                    {event.location && (
                      <span className="text-[10px] font-bold text-gray-400">📍 {event.location}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
