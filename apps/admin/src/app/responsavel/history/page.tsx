'use client'

import { useRouter } from 'next/navigation'
import { Calendar as CalendarIcon, ChevronRight, History } from 'lucide-react'
import { SectionLabel } from '@/components/ui/index'

export default function GuardianHistoryPage() {
  const router = useRouter()

  const days = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (i + 1))
    return d
  })

  const formatDate = (date: Date) =>
    date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })

  const handleDayClick = (date: Date) => {
    const isoDate = date.toISOString().split('T')[0]
    router.push(`/responsavel?date=${isoDate}`)
  }

  return (
    <div className="animate-in space-y-5 pb-8 max-w-lg mx-auto">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-500">
          <History className="h-5 w-5" />
        </div>
        <div>
          <h1 className="page-title">Histórico</h1>
          <p className="page-subtitle">Reveja a rotina de dias anteriores</p>
        </div>
      </div>

      <SectionLabel>Últimos 14 dias</SectionLabel>

      <div className="space-y-2">
        {days.map((day, idx) => (
          <button
            key={idx}
            onClick={() => handleDayClick(day)}
            className="card-interactive w-full flex items-center gap-4 p-4 text-left"
          >
            <div className="h-10 w-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-500 shrink-0">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-foreground capitalize text-sm">{formatDate(day)}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Toque para ver o diário completo</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </button>
        ))}
      </div>
    </div>
  )
}
