'use client'

import { useState } from 'react'
import { ClipboardList, Plus, X, Check, Loader2, Trash2, Send, ChevronRight } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { DEVELOPMENT_PERIOD_LABELS } from '@mundo-magico/types'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type DevReport = {
  id: string
  childId: string
  period: string
  startDate: string
  endDate: string
  isDraft: boolean
  publishedAt: string | null
  motorCoordination: string | null
  socialization: string | null
  language: string | null
  autonomy: string | null
  teamObservations: string | null
  parentRecommendations: string | null
  createdAt: string
  child: {
    id: string
    fullName: string
    photoUrl: string | null
    group: { name: string } | null
  }
}

const AREAS = [
  { key: 'motorCoordination',     label: 'Coordenação motora' },
  { key: 'socialization',         label: 'Socialização' },
  { key: 'language',              label: 'Linguagem' },
  { key: 'autonomy',              label: 'Autonomia' },
  { key: 'feeding',               label: 'Alimentação' },
  { key: 'sleep',                 label: 'Sono' },
  { key: 'participation',         label: 'Participação' },
  { key: 'adaptation',            label: 'Adaptação' },
  { key: 'peerInteraction',       label: 'Interação com colegas' },
]

const PERIOD_LABELS = DEVELOPMENT_PERIOD_LABELS

export default function DevelopmentReportsPage() {
  const queryClient = useQueryClient()
  const [showModal, setShowModal]     = useState(false)
  const [selected, setSelected]       = useState<DevReport | null>(null)
  const [saving, setSaving]           = useState(false)
  const [filterDraft, setFilterDraft] = useState<string>('')
  const [form, setForm]               = useState({
    childId: '', period: 'MENSAL',
    startDate: '', endDate: '',
    motorCoordination: '', socialization: '', language: '', autonomy: '',
    feeding: '', sleep: '', participation: '', adaptation: '', peerInteraction: '',
    teamObservations: '', parentRecommendations: '', isDraft: true,
  })

  const { data: reports = [], isLoading } = useQuery<DevReport[]>({
    queryKey: ['development-reports', filterDraft],
    queryFn: () => fetch(`/api/development-reports${filterDraft ? `?isDraft=${filterDraft}` : ''}`).then((r) => r.json()),
  })

  const { data: children = [] } = useQuery<{ id: string; fullName: string }[]>({
    queryKey: ['children-list'],
    queryFn: () => fetch('/api/children').then((r) => r.json()),
  })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.childId || !form.startDate || !form.endDate) {
      toast.error('Preencha criança, período de início e fim')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/development-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId:               form.childId,
          period:                form.period,
          startDate:             form.startDate,
          endDate:               form.endDate,
          motorCoordination:     form.motorCoordination || undefined,
          socialization:         form.socialization || undefined,
          language:              form.language || undefined,
          autonomy:              form.autonomy || undefined,
          feeding:               form.feeding || undefined,
          sleep:                 form.sleep || undefined,
          participation:         form.participation || undefined,
          adaptation:            form.adaptation || undefined,
          peerInteraction:       form.peerInteraction || undefined,
          teamObservations:      form.teamObservations || undefined,
          parentRecommendations: form.parentRecommendations || undefined,
          isDraft:               form.isDraft,
        }),
      })
      if (res.ok) {
        toast.success('Relatório criado!')
        setShowModal(false)
        resetForm()
        queryClient.invalidateQueries({ queryKey: ['development-reports'] })
      } else {
        toast.error('Erro ao criar relatório')
      }
    } catch { toast.error('Erro ao criar relatório') }
    finally { setSaving(false) }
  }

  const handlePublish = async (id: string) => {
    try {
      const res = await fetch(`/api/development-reports/${id}/publish`, { method: 'POST' })
      if (res.ok) {
        toast.success('Relatório publicado e enviado para os responsáveis!')
        setSelected(null)
        queryClient.invalidateQueries({ queryKey: ['development-reports'] })
      } else {
        toast.error('Erro ao publicar')
      }
    } catch { toast.error('Erro ao publicar') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este relatório?')) return
    try {
      const res = await fetch(`/api/development-reports/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Relatório excluído!')
        setSelected(null)
        queryClient.invalidateQueries({ queryKey: ['development-reports'] })
      } else {
        toast.error('Erro ao excluir')
      }
    } catch { toast.error('Erro ao excluir') }
  }

  const resetForm = () => setForm({
    childId: '', period: 'MENSAL', startDate: '', endDate: '',
    motorCoordination: '', socialization: '', language: '', autonomy: '',
    feeding: '', sleep: '', participation: '', adaptation: '', peerInteraction: '',
    teamObservations: '', parentRecommendations: '', isDraft: true,
  })

  return (
    <div className="p-4 md:p-8 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <ClipboardList className="text-primary" size={28} />
            Relatórios de Desenvolvimento
          </h1>
          <p className="text-sm text-gray-500 mt-1">Acompanhe a evolução de cada criança ao longo do tempo</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-black shadow-lg shadow-lime-100 hover:bg-lime-600 transition-all"
        >
          <Plus size={18} />
          Novo Relatório
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4">
        <select
          value={filterDraft}
          onChange={(e) => setFilterDraft(e.target.value)}
          className="px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-lime-200"
        >
          <option value="">Todos os relatórios</option>
          <option value="true">Rascunhos</option>
          <option value="false">Publicados</option>
        </select>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="text-primary animate-spin" size={32} />
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-16 text-center">
          <ClipboardList className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-bold">Nenhum relatório encontrado</p>
          <button onClick={() => setShowModal(true)} className="mt-4 text-primary font-black text-sm hover:underline">
            + Criar primeiro relatório
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div
              key={report.id}
              className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 cursor-pointer hover:border-primary/30 transition-colors"
              onClick={() => setSelected(report)}
            >
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-lg shrink-0">
                {report.child.fullName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-black text-gray-900">{report.child.fullName}</p>
                  {report.child.group && (
                    <span className="text-[10px] font-black text-primary uppercase tracking-wider bg-lime-50 px-2 py-0.5 rounded-lg">
                      {report.child.group.name}
                    </span>
                  )}
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg ${report.isDraft ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {report.isDraft ? 'Rascunho' : 'Publicado'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 font-medium mt-0.5">
                  {PERIOD_LABELS[report.period as keyof typeof PERIOD_LABELS] ?? report.period} ·{' '}
                  {format(new Date(report.startDate), "MMM/yyyy", { locale: ptBR })} →{' '}
                  {format(new Date(report.endDate), "MMM/yyyy", { locale: ptBR })}
                </p>
              </div>
              <ChevronRight size={20} className="text-gray-300 shrink-0" />
            </div>
          ))}
        </div>
      )}

      {/* Modal: Novo Relatório */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="bg-white w-full sm:max-w-2xl rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl relative z-10 p-8 max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-gray-900">Novo Relatório de Desenvolvimento</h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Criança *</label>
                  <select
                    required value={form.childId}
                    onChange={(e) => setForm((p) => ({ ...p, childId: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-lime-200"
                  >
                    <option value="">Selecione...</option>
                    {(children as { id: string; fullName: string }[]).map((c) => (
                      <option key={c.id} value={c.id}>{c.fullName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Período</label>
                  <select
                    value={form.period}
                    onChange={(e) => setForm((p) => ({ ...p, period: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-lime-200"
                  >
                    {Object.entries(PERIOD_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Data início *</label>
                  <input
                    type="date" required value={form.startDate}
                    onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-lime-200"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Data fim *</label>
                  <input
                    type="date" required value={form.endDate}
                    onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-lime-200"
                  />
                </div>
              </div>

              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Avaliação por área</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {AREAS.map(({ key, label }) => (
                  <div key={key}>
                    <label className="text-xs font-black text-gray-500 block mb-1.5">{label}</label>
                    <textarea
                      rows={2}
                      value={form[key as keyof typeof form] as string}
                      onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                      placeholder={`Observações sobre ${label.toLowerCase()}...`}
                      className="w-full px-3 py-2.5 rounded-2xl border border-gray-200 bg-gray-50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-lime-200 resize-none"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Observações da equipe</label>
                <textarea
                  rows={3} value={form.teamObservations}
                  onChange={(e) => setForm((p) => ({ ...p, teamObservations: e.target.value }))}
                  placeholder="Anotações gerais da equipe pedagógica..."
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-lime-200 resize-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Recomendações para os responsáveis</label>
                <textarea
                  rows={3} value={form.parentRecommendations}
                  onChange={(e) => setForm((p) => ({ ...p, parentRecommendations: e.target.value }))}
                  placeholder="O que a família pode fazer em casa para apoiar o desenvolvimento..."
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-lime-200 resize-none"
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox" checked={form.isDraft}
                  onChange={(e) => setForm((p) => ({ ...p, isDraft: e.target.checked }))}
                  className="rounded text-primary"
                />
                <span className="text-sm font-bold text-gray-700">Salvar como rascunho (não publicar ainda)</span>
              </label>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-2xl border border-gray-200 font-black text-sm text-gray-500">Cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 py-3 rounded-2xl bg-primary text-white font-black text-sm hover:bg-lime-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  {form.isDraft ? 'Salvar rascunho' : 'Criar e publicar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Visualizar relatório */}
      {selected && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="bg-white w-full sm:max-w-2xl rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl relative z-10 p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-black text-gray-900">{selected.child.fullName}</h2>
                <p className="text-sm text-gray-500 font-medium">
                  {PERIOD_LABELS[selected.period as keyof typeof PERIOD_LABELS]} ·{' '}
                  {format(new Date(selected.startDate), "d MMM yyyy", { locale: ptBR })} –{' '}
                  {format(new Date(selected.endDate), "d MMM yyyy", { locale: ptBR })}
                </p>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl"><X size={20} /></button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {AREAS.filter(({ key }) => selected[key as keyof DevReport]).map(({ key, label }) => (
                <div key={key} className="bg-gray-50 rounded-2xl p-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
                  <p className="text-sm font-bold text-gray-800">{String(selected[key as keyof DevReport])}</p>
                </div>
              ))}
            </div>

            {selected.teamObservations && (
              <div className="bg-blue-50 rounded-2xl p-4 mb-4">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Observações da equipe</p>
                <p className="text-sm font-bold text-blue-900">{selected.teamObservations}</p>
              </div>
            )}
            {selected.parentRecommendations && (
              <div className="bg-amber-50 rounded-2xl p-4 mb-6">
                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Recomendações para a família</p>
                <p className="text-sm font-bold text-amber-900">{selected.parentRecommendations}</p>
              </div>
            )}

            <div className="flex gap-3">
              {selected.isDraft && (
                <button
                  onClick={() => handlePublish(selected.id)}
                  className="flex-1 py-3 rounded-2xl bg-emerald-500 text-white font-black text-sm hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                >
                  <Send size={16} />
                  Publicar relatório
                </button>
              )}
              <button
                onClick={() => handleDelete(selected.id)}
                className="py-3 px-5 rounded-2xl border border-red-200 text-red-500 font-black text-sm hover:bg-red-50 transition-all flex items-center gap-2"
              >
                <Trash2 size={16} />
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
