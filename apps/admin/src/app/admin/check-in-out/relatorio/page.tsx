'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Calendar, ChevronLeft, ChevronRight, Download,
  Users, CheckCircle2, Clock, Printer, BarChart2
} from 'lucide-react'
import { PageHeader, LoadingState, Avatar } from '@/components/ui'
import toast from 'react-hot-toast'

const MONTH_NAMES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
]

interface DayRecord {
  date: string
  status: string
  checkInTime: string | null
  checkOutTime: string | null
  broughtBy: string | null
  pickedUpBy: string | null
}

interface ChildReport {
  id: string
  fullName: string
  nickname: string | null
  photoUrl: string | null
  groupName: string | null
  presentDays: number
  absentDays: number
  attendanceRate: number
  totalBusinessDays: number
  days: DayRecord[]
}

interface ReportData {
  year: number
  month: number
  businessDays: string[]
  totalChildren: number
  report: ChildReport[]
}

export default function RelatorioMensalPage() {
  const now = new Date()
  const [year, setYear]   = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [groupId, setGroupId] = useState('')
  const [groups, setGroups]   = useState<any[]>([])
  const [data, setData]       = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')

  useEffect(() => {
    fetch('/api/groups?active=true').then(r => r.json()).then(setGroups).catch(() => {})
  }, [])

  const fetchReport = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ year: String(year), month: String(month) })
      if (groupId) params.set('groupId', groupId)
      const res = await fetch(`/api/check-in-out/report/monthly?${params}`)
      if (!res.ok) throw new Error()
      setData(await res.json())
    } catch {
      toast.error('Erro ao carregar relatório')
    } finally {
      setLoading(false)
    }
  }, [groupId, month, year])

  useEffect(() => { fetchReport() }, [fetchReport])

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y-1) } else setMonth(m => m-1) }
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y+1) } else setMonth(m => m+1) }

  const filtered = (data?.report ?? []).filter(c =>
    (c.fullName||'').toLowerCase().includes(search.toLowerCase()) ||
    (c.groupName||'').toLowerCase().includes(search.toLowerCase())
  )

  const avgAttendance = filtered.length > 0
    ? Math.round(filtered.reduce((s,c) => s + c.attendanceRate, 0) / filtered.length)
    : 0
  const totalAbsent = filtered.reduce((s,c) => s + c.absentDays, 0)
  const businessDays = data?.businessDays ?? []

  const handleExportCSV = () => {
    if (!data) return
    const rows = [
      ['Nome','Turma','Dias Úteis','Presenças','Faltas','Frequência %',
       ...businessDays.map(d => new Date(d+'T00:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}))
      ],
      ...filtered.map(c => [
        c.fullName, c.groupName??'', c.totalBusinessDays, c.presentDays, c.absentDays, c.attendanceRate+'%',
        ...c.days.map(d => d.status==='PRESENTE'||d.status==='AGUARDANDO_RETIRADA' ? 'P' : d.status==='SAIU_MAIS_CEDO' ? 'F' : 'A')
      ])
    ]
    const csv = rows.map(r => r.join(';')).join('\n')
    const blob = new Blob(['﻿'+csv], {type:'text/csv;charset=utf-8;'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `frequencia_${year}_${String(month).padStart(2,'0')}.csv`
    a.click(); URL.revokeObjectURL(url)
    toast.success('CSV exportado!')
  }

  return (
    <div className="page animate-in pb-24">

      {/* Header */}
      <PageHeader
        title="Relatório de Frequência"
        subtitle="Controle mensal de presenças e faltas por aluno"
        icon={<Calendar size={24} />}
        actions={
          <div className="flex gap-2">
            <button onClick={handleExportCSV} className="btn-secondary gap-2 text-[11px] px-4 py-2.5">
              <Download size={15} /> CSV
            </button>
            <button onClick={() => window.print()} className="btn-secondary gap-2 text-[11px] px-4 py-2.5">
              <Printer size={15} /> Imprimir
            </button>
          </div>
        }
      />

      {/* Filters — compact on mobile */}
      <div className="card p-4">
        {/* Month nav */}
        <div className="flex items-center gap-2 mb-3">
          <button onClick={prevMonth} className="btn-secondary p-2 shrink-0"><ChevronLeft size={16} /></button>
          <div className="flex-1 text-center font-black text-base">{MONTH_NAMES[month-1]} {year}</div>
          <button onClick={nextMonth} className="btn-secondary p-2 shrink-0"><ChevronRight size={16} /></button>
        </div>
        {/* Group + Search */}
        <div className="grid grid-cols-2 gap-2">
          <select value={groupId} onChange={e => setGroupId(e.target.value)} className="select text-sm">
            <option value="">Todas as turmas</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <input
            className="input text-sm"
            placeholder="Buscar aluno..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Summary stats — compact row */}
      {!loading && data && (
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Alunos',      value: filtered.length,      color: 'text-foreground' },
            { label: 'Dias úteis',  value: businessDays.length,  color: 'text-foreground' },
            { label: 'Freq. média', value: avgAttendance + '%',  color: avgAttendance >= 75 ? 'text-emerald-500' : 'text-rose-500' },
            { label: 'Faltas',      value: totalAbsent,          color: 'text-rose-500' },
          ].map(s => (
            <div key={s.label} className="card p-3 flex flex-col items-center text-center gap-0.5">
              <span className={`text-2xl font-black leading-none ${s.color}`}>{s.value}</span>
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider leading-tight">{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <LoadingState label="Carregando relatório..." />
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center text-muted-foreground text-sm">
          Nenhum aluno encontrado para este período.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-accent/30">
                  <th className="sticky left-0 z-10 bg-card/95 backdrop-blur-sm text-left px-4 py-3 font-black text-muted-foreground uppercase tracking-widest whitespace-nowrap min-w-[160px]">
                    Aluno
                  </th>
                  <th className="text-center px-2 py-3 font-black text-emerald-500 whitespace-nowrap">✓P</th>
                  <th className="text-center px-2 py-3 font-black text-rose-500 whitespace-nowrap">✗F</th>
                  <th className="text-center px-2 py-3 font-black text-muted-foreground whitespace-nowrap">%</th>
                  {businessDays.map(d => {
                    const dt = new Date(d+'T00:00:00')
                    return (
                      <th key={d} className="text-center px-1 py-2 font-black text-muted-foreground min-w-[28px]">
                        <div className="flex flex-col items-center gap-0">
                          <span className="text-[7px] opacity-60">{dt.toLocaleDateString('pt-BR',{weekday:'narrow'})}</span>
                          <span className="text-[9px]">{dt.getDate()}</span>
                        </div>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {filtered.map((child, i) => (
                  <tr key={child.id} className={`border-b border-border/40 ${i%2===0?'':'bg-accent/10'}`}>
                    <td className="sticky left-0 z-10 bg-card/95 backdrop-blur-sm px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Avatar photoUrl={child.photoUrl} name={child.fullName} size="xs" />
                        <div className="min-w-0">
                          <p className="font-black text-foreground text-xs leading-tight truncate max-w-[100px]">{child.fullName}</p>
                          {child.groupName && (
                            <p className="text-[9px] font-bold text-primary truncate">{child.groupName}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="text-center px-2 py-2 font-black text-emerald-500">{child.presentDays}</td>
                    <td className="text-center px-2 py-2 font-black text-rose-500">{child.absentDays}</td>
                    <td className="text-center px-2 py-2">
                      <span className={`font-black text-[10px] px-1.5 py-0.5 rounded-full ${
                        child.attendanceRate >= 75
                          ? 'bg-emerald-500/15 text-emerald-500'
                          : 'bg-rose-500/15 text-rose-500'
                      }`}>{child.attendanceRate}%</span>
                    </td>
                    {child.days.map(day => {
                      const isP = day.status==='PRESENTE'||day.status==='AGUARDANDO_RETIRADA'
                      const isF = day.status==='SAIU_MAIS_CEDO'
                      return (
                        <td key={day.date} className="text-center px-0.5 py-1">
                          <div
                            title={`${day.date}${day.checkInTime?' · '+new Date(day.checkInTime).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}):''}`}
                            className={`w-6 h-6 rounded mx-auto flex items-center justify-center font-black text-[9px] ${
                              isP ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                              : isF ? 'bg-amber-500/20 text-amber-600'
                              : 'bg-rose-500/10 text-rose-400'
                            }`}
                          >
                            {isP?'P':isF?'F':'A'}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legenda */}
          <div className="flex flex-wrap items-center gap-4 px-4 py-3 border-t border-border bg-accent/10 text-[10px] font-bold text-muted-foreground">
            <span className="font-black uppercase tracking-widest">Legenda:</span>
            <span className="flex items-center gap-1">
              <span className="w-5 h-5 rounded bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-[9px] font-black">P</span> Presente
            </span>
            <span className="flex items-center gap-1">
              <span className="w-5 h-5 rounded bg-amber-500/20 text-amber-600 flex items-center justify-center text-[9px] font-black">F</span> Saiu cedo
            </span>
            <span className="flex items-center gap-1">
              <span className="w-5 h-5 rounded bg-rose-500/10 text-rose-400 flex items-center justify-center text-[9px] font-black">A</span> Ausente
            </span>
            <span className="text-rose-500">· ≥75% = frequência ok</span>
          </div>
        </div>
      )}
    </div>
  )
}
