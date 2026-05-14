'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import {
  Utensils, Moon, Droplets, Heart, Smile, Star, MessageSquare, Send, Save, Check
} from 'lucide-react'
import {
  MEAL_TYPES, MEAL_RESULT_LABELS, MOOD_EMOJIS, MOOD_LABELS,
  ACTIVITY_TYPES, ITEM_TYPE_LABELS, type Mood, type MealResult, type SleepQuality
} from '@mundo-magico/types'

const TABS = [
  { id: 'meals',       label: 'Comida',  icon: Utensils,      emoji: '🍽️' },
  { id: 'sleep',       label: 'Sono',    icon: Moon,          emoji: '😴' },
  { id: 'hygiene',     label: 'Higiene', icon: Droplets,      emoji: '🧼' },
  { id: 'health',      label: 'Saúde',   icon: Heart,         emoji: '❤️' },
  { id: 'mood',        label: 'Humor',   icon: Smile,         emoji: '😊' },
  { id: 'activities',  label: 'Ativ.',   icon: Star,          emoji: '🎨' },
  { id: 'message',     label: 'Recado',  icon: MessageSquare, emoji: '📝' },
]

interface Props {
  childId: string
  date: string
  usesDiapers: boolean
  usesBottle: boolean
  existingReport: any | null
  guardians: { id: string; name: string; phone: string }[]
}

export function DailyRoutineForm({ childId, date, usesDiapers, usesBottle, existingReport, guardians }: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('meals')
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)

  // ─── Alimentação ───
  const [meals, setMeals] = useState<Record<string, { result: MealResult; observation: string; amount: string }>>(
    () => {
      const init: any = {}
      MEAL_TYPES.forEach((m) => {
        const existing = existingReport?.meals?.find((r: any) => r.mealType === m.key)
        init[m.key] = {
          result: existing?.result ?? 'BEM',
          observation: existing?.observation ?? '',
          amount: existing?.amount ?? '',
        }
      })
      return init
    }
  )

  // ─── Sono ───
  const [sleep, setSleep] = useState({
    slept: existingReport?.sleep?.slept ?? false,
    sleepTime: existingReport?.sleep?.sleepTime ?? '',
    wakeTime: existingReport?.sleep?.wakeTime ?? '',
    quality: (existingReport?.sleep?.quality ?? 'TRANQUILO') as SleepQuality,
    observation: existingReport?.sleep?.observation ?? '',
  })

  // ─── Higiene ───
  const [hygiene, setHygiene] = useState({
    diaperChanges: existingReport?.hygiene?.diaperChanges ?? 0,
    pee: existingReport?.hygiene?.pee ?? false,
    poo: existingReport?.hygiene?.poo ?? false,
    bath: existingReport?.hygiene?.bath ?? false,
    brushing: existingReport?.hygiene?.brushing ?? false,
    observation: existingReport?.hygiene?.observation ?? '',
  })

  // ─── Saúde ───
  const [health, setHealth] = useState({
    fever: existingReport?.health?.fever ?? false,
    feverTemp: existingReport?.health?.feverTemp ?? '',
    pain: existingReport?.health?.pain ?? false,
    painDescription: existingReport?.health?.painDescription ?? '',
    cough: existingReport?.health?.cough ?? false,
    runnyNose: existingReport?.health?.runnyNose ?? false,
    injury: existingReport?.health?.injury ?? false,
    injuryDescription: existingReport?.health?.injuryDescription ?? '',
    medicationGiven: existingReport?.health?.medicationGiven ?? false,
    medicationName: existingReport?.health?.medicationName ?? '',
    medicationTime: existingReport?.health?.medicationTime ?? '',
    authorizedBy: existingReport?.health?.authorizedBy ?? '',
    observation: existingReport?.health?.observation ?? '',
  })

  // ─── Humor ───
  const [selectedMoods, setSelectedMoods] = useState<Mood[]>(
    existingReport?.moods?.map((m: any) => m.mood) ?? []
  )

  // ─── Atividades ───
  const [activities, setActivities] = useState<{ activityType: string; description: string }[]>(
    existingReport?.activities ?? []
  )

  // ─── Recado ───
  const [message, setMessage] = useState({
    messageToParents: existingReport?.messageToParents ?? '',
    importantAlert: existingReport?.importantAlert ?? '',
    homeRecommendation: existingReport?.homeRecommendation ?? '',
    itemRequests: existingReport?.itemRequests ? JSON.parse(existingReport.itemRequests) : [] as string[],
    teamNote: existingReport?.teamNote ?? '',
  })

  const buildPayload = (isDraft: boolean) => ({
    childId,
    date,
    isDraft,
    ...message,
    itemRequests: JSON.stringify(message.itemRequests),
    meals: MEAL_TYPES.map((m) => ({
      mealType: m.key,
      result: meals[m.key].result,
      observation: meals[m.key].observation,
      amount: meals[m.key].amount,
    })),
    sleep,
    hygiene,
    health: { ...health, feverTemp: health.feverTemp ? parseFloat(String(health.feverTemp)) : null },
    moods: selectedMoods.map((mood) => ({ mood })),
    activities,
  })

  const handleSave = async (isDraft: boolean) => {
    setSaving(true)
    try {
      const res = await fetch('/api/daily-routine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(isDraft)),
      })
      if (!res.ok) throw new Error()
      toast.success(isDraft ? 'Rascunho salvo!' : 'Diário finalizado!')
      router.refresh()
    } catch {
      toast.error('Erro ao salvar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const toggleMood = (mood: Mood) => {
    setSelectedMoods((prev) =>
      prev.includes(mood) ? prev.filter((m) => m !== mood) : [...prev, mood]
    )
  }

  const toggleActivity = (key: string) => {
    setActivities((prev) =>
      prev.find((a) => a.activityType === key)
        ? prev.filter((a) => a.activityType !== key)
        : [...prev, { activityType: key, description: '' }]
    )
  }

  return (
    <div className="flex flex-col">
      {/* Abas - Horizontal Scrollable on mobile */}
      <div className="flex overflow-x-auto border-b border-border bg-card/80 backdrop-blur-xl no-scrollbar sticky top-[-24px] z-20 -mx-6 sm:-mx-8 -mt-6 px-4">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-4 text-[11px] sm:text-xs font-black whitespace-nowrap border-b-4 uppercase tracking-widest transition-all ${
              activeTab === tab.id
                ? 'border-primary text-primary bg-background'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/50'
            }`}
          >
            <span className="text-xl filter grayscale group-hover:grayscale-0">{tab.emoji}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-6 pb-32 space-y-8">
        {/* ─── Alimentação ─── */}
        {activeTab === 'meals' && (
          <div className="space-y-6">
            {MEAL_TYPES.filter((m) => m.key !== 'bottle' || usesBottle).map((mealType) => (
              <div key={mealType.key} className="rounded-[2rem] border border-border p-6 bg-card shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-2xl">{mealType.emoji}</span>
                  <h3 className="font-black text-foreground text-lg uppercase tracking-tight">{mealType.label}</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  {Object.entries(MEAL_RESULT_LABELS).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setMeals((prev) => ({ ...prev, [mealType.key]: { ...prev[mealType.key], result: key as MealResult } }))}
                      className={`py-4 px-2 rounded-2xl text-xs font-black uppercase tracking-widest border-2 transition-all ${
                        meals[mealType.key]?.result === key
                          ? 'border-primary bg-primary/10 text-primary scale-[1.02]'
                          : 'border-border text-muted-foreground hover:border-accent-foreground'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-muted-foreground uppercase ml-2">Quantidade</label>
                    <input
                      className="input"
                      placeholder="Ex: 200ml, 1 prato..."
                      value={meals[mealType.key]?.amount}
                      onChange={(e) => setMeals((prev) => ({ ...prev, [mealType.key]: { ...prev[mealType.key], amount: e.target.value } }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-muted-foreground uppercase ml-2">Observação</label>
                    <input
                      className="input"
                      placeholder="Algum detalhe extra?"
                      value={meals[mealType.key]?.observation}
                      onChange={(e) => setMeals((prev) => ({ ...prev, [mealType.key]: { ...prev[mealType.key], observation: e.target.value } }))}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── Sono ─── */}
        {activeTab === 'sleep' && (
          <div className="space-y-6">
            <label className="flex items-center gap-4 p-6 rounded-[2rem] border-2 border-border cursor-pointer bg-card hover:bg-accent/20 transition-all group">
              <input
                type="checkbox"
                checked={sleep.slept}
                onChange={(e) => setSleep((p) => ({ ...p, slept: e.target.checked }))}
                className="w-8 h-8 rounded-xl border-2 border-border text-primary focus:ring-primary transition-all bg-background"
              />
              <div>
                <span className="font-black text-foreground text-lg uppercase tracking-tight block">Dormiu hoje?</span>
                <span className="text-xs font-medium text-muted-foreground">Marque se a criança tirou uma soneca</span>
              </div>
            </label>

            {sleep.slept && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-muted-foreground uppercase ml-2">Hora que dormiu</label>
                    <input
                      type="time"
                      className="input"
                      value={sleep.sleepTime}
                      onChange={(e) => setSleep((p) => ({ ...p, sleepTime: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-muted-foreground uppercase ml-2">Hora que acordou</label>
                    <input
                      type="time"
                      className="input"
                      value={sleep.wakeTime}
                      onChange={(e) => setSleep((p) => ({ ...p, wakeTime: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-muted-foreground uppercase ml-2 mb-2 block">Qualidade do sono</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'TRANQUILO', label: 'Tranquilo', emoji: '😴' },
                      { key: 'AGITADO',   label: 'Agitado',   emoji: '😤' },
                      { key: 'POUCO',     label: 'Dormiu pouco', emoji: '😪' },
                      { key: 'NAO_DORMIU',label: 'Não dormiu', emoji: '😫' },
                    ].map((q) => (
                      <button
                        key={q.key}
                        type="button"
                        onClick={() => setSleep((p) => ({ ...p, quality: q.key as SleepQuality }))}
                        className={`p-5 rounded-[2rem] border-2 text-xs font-black uppercase tracking-widest transition-all ${
                          sleep.quality === q.key
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border text-muted-foreground hover:border-accent-foreground'
                        }`}
                      >
                        <span className="text-3xl block mb-2">{q.emoji}</span>
                        {q.label}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-black text-muted-foreground uppercase ml-2">Observações do sono</label>
              <textarea
                className="input min-h-[100px]"
                value={sleep.observation}
                onChange={(e) => setSleep((p) => ({ ...p, observation: e.target.value }))}
                placeholder="Ex: Demorou para dormir, acordou com choro..."
              />
            </div>
          </div>
        )}

        {/* ─── Higiene ─── */}
        {activeTab === 'hygiene' && (
          <div className="space-y-6">
            {usesDiapers && (
              <div className="p-8 bg-blue-500/10 rounded-[2.5rem] border border-blue-500/20 flex flex-col items-center justify-center text-center">
                <label className="text-xs font-black text-blue-500 uppercase tracking-widest mb-4">Trocas de fralda</label>
                <div className="flex items-center gap-6">
                  <button type="button" onClick={() => setHygiene((p) => ({ ...p, diaperChanges: Math.max(0, p.diaperChanges - 1) }))}
                    className="w-14 h-14 rounded-2xl bg-card text-blue-500 text-3xl font-black shadow-sm active:scale-90 transition-transform">-</button>
                  <span className="text-5xl font-black text-foreground w-16">{hygiene.diaperChanges}</span>
                  <button type="button" onClick={() => setHygiene((p) => ({ ...p, diaperChanges: p.diaperChanges + 1 }))}
                    className="w-14 h-14 rounded-2xl bg-card text-blue-500 text-3xl font-black shadow-sm active:scale-90 transition-transform">+</button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'pee',      label: 'Xixi',        emoji: '💛' },
                { key: 'poo',      label: 'Cocô',        emoji: '💩' },
                { key: 'bath',     label: 'Banho',       emoji: '🛁' },
                { key: 'brushing', label: 'Escovação',   emoji: '🦷' },
              ].map((item) => (
                <label key={item.key} className={`flex flex-col items-center gap-4 p-6 rounded-[2rem] border-2 cursor-pointer transition-all ${
                  hygiene[item.key as keyof typeof hygiene]
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-card hover:border-accent-foreground'
                }`}>
                  <input
                    type="checkbox"
                    checked={!!hygiene[item.key as keyof typeof hygiene]}
                    onChange={(e) => setHygiene((p) => ({ ...p, [item.key]: e.target.checked }))}
                    className="w-6 h-6 rounded-lg border-2 border-border text-primary focus:ring-primary bg-background"
                  />
                  <span className="text-4xl">{item.emoji}</span>
                  <span className="font-black text-[10px] text-foreground uppercase tracking-widest">{item.label}</span>
                </label>
              ))}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-muted-foreground uppercase ml-2">Observações de higiene</label>
              <textarea className="input min-h-[100px]"
                value={hygiene.observation}
                onChange={(e) => setHygiene((p) => ({ ...p, observation: e.target.value }))}
                placeholder="Ex: Fezes líquidas, irritação na pele..." />
            </div>
          </div>
        )}

        {/* ─── Saúde ─── */}
        {activeTab === 'health' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'fever', label: 'Febre', emoji: '🌡️' },
                { key: 'pain', label: 'Dor', emoji: '😣' },
                { key: 'cough', label: 'Tosse', emoji: '🤧' },
                { key: 'runnyNose', label: 'Coriza', emoji: '🤧' },
                { key: 'injury', label: 'Machucado', emoji: '🩹' },
                { key: 'medicationGiven', label: 'Remédio Dado', emoji: '💊' },
              ].map((item) => (
                <label key={item.key} className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  health[item.key as keyof typeof health]
                    ? 'border-rose-500 bg-rose-500/10'
                    : 'border-border bg-card hover:border-accent-foreground'
                }`}>
                  <input
                    type="checkbox"
                    checked={!!health[item.key as keyof typeof health]}
                    onChange={(e) => setHealth((p) => ({ ...p, [item.key]: e.target.checked }))}
                    className="w-5 h-5 rounded-lg border-2 border-border text-rose-500 focus:ring-rose-500 bg-background"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-foreground uppercase tracking-tighter leading-none mb-1">{item.label}</span>
                    <span className="text-xl">{item.emoji}</span>
                  </div>
                </label>
              ))}
            </div>

            {health.medicationGiven && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-[2rem] border border-orange-500/20 bg-orange-500/10 p-6 space-y-4 text-foreground">
                <p className="font-black text-orange-500 uppercase tracking-widest text-xs">Administração de Medicamento</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input className="input" 
                    placeholder="Nome do medicamento"
                    value={health.medicationName}
                    onChange={(e) => setHealth((p) => ({ ...p, medicationName: e.target.value }))} />
                  <input className="input" 
                    placeholder="Horário"
                    type="time" value={health.medicationTime}
                    onChange={(e) => setHealth((p) => ({ ...p, medicationTime: e.target.value }))} />
                  <input className="input col-span-1 md:col-span-2" 
                    placeholder="Autorizado por (nome do responsável)"
                    value={health.authorizedBy}
                    onChange={(e) => setHealth((p) => ({ ...p, authorizedBy: e.target.value }))} />
                </div>
              </motion.div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-black text-muted-foreground uppercase ml-2">Observações de saúde</label>
              <textarea className="input min-h-[100px]" 
                value={health.observation}
                onChange={(e) => setHealth((p) => ({ ...p, observation: e.target.value }))}
                placeholder="Descreva qualquer ocorrência de saúde..." />
            </div>
          </div>
        )}

        {/* ─── Humor ─── */}
        {activeTab === 'mood' && (
          <div className="space-y-6">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest text-center">Como foi o humor hoje?</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {(Object.entries(MOOD_EMOJIS) as [Mood, string][]).map(([mood, emoji]) => (
                <button
                  key={mood}
                  type="button"
                  onClick={() => toggleMood(mood)}
                  className={`p-6 rounded-[2.5rem] border-2 text-center transition-all ${
                    selectedMoods.includes(mood)
                      ? 'border-primary bg-primary/10 scale-105'
                      : 'border-border bg-card hover:border-accent-foreground'
                  }`}
                >
                  <span className="text-5xl block mb-2">{emoji}</span>
                  <span className="text-[10px] font-black text-foreground uppercase tracking-widest">{MOOD_LABELS[mood]}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ─── Atividades ─── */}
        {activeTab === 'activities' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {ACTIVITY_TYPES.map((act) => {
                const isSelected = activities.some((a) => a.activityType === act.key)
                return (
                  <button
                    key={act.key}
                    type="button"
                    onClick={() => toggleActivity(act.key)}
                    className={`p-4 rounded-2xl border-2 text-center transition-all ${
                      isSelected ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-accent-foreground'
                    }`}
                  >
                    <span className="text-3xl block mb-2">{act.emoji}</span>
                    <span className="text-[10px] font-black text-foreground uppercase tracking-widest">{act.label}</span>
                  </button>
                )
              })}
            </div>

            {activities.map((act, i) => (
              <div key={act.activityType} className="space-y-1">
                <label className="text-[10px] font-black text-primary uppercase ml-2">
                  Detalhes: {ACTIVITY_TYPES.find((a) => a.key === act.activityType)?.label}
                </label>
                <input
                  className="input"
                  placeholder="O que a criança fez nessa atividade?"
                  value={act.description}
                  onChange={(e) => setActivities((prev) => {
                    const next = [...prev]
                    next[i] = { ...next[i], description: e.target.value }
                    return next
                  })}
                />
              </div>
            ))}
          </div>
        )}

        {/* ─── Recado ─── */}
        {activeTab === 'message' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-muted-foreground uppercase ml-2">Recado para os pais</label>
              <textarea className="input min-h-[120px]"
                value={message.messageToParents}
                onChange={(e) => setMessage((p) => ({ ...p, messageToParents: e.target.value }))}
                placeholder="Ex: A criança ficou mais quieta hoje. Amanhã teremos festa junina!" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-rose-500 uppercase ml-2">Aviso importante</label>
              <textarea className="w-full px-4 py-3 bg-rose-500/10 border-transparent border-2 rounded-xl focus:bg-background focus:border-rose-500 focus:ring-0 text-sm font-bold transition-all outline-none min-h-[80px] text-foreground"
                value={message.importantAlert}
                onChange={(e) => setMessage((p) => ({ ...p, importantAlert: e.target.value }))}
                placeholder="Algo urgente que os responsáveis precisam saber..." />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-muted-foreground uppercase ml-2">Solicitar itens</label>
              <div className="flex flex-wrap gap-2">
                {(Object.entries(ITEM_TYPE_LABELS) as [string, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setMessage((p) => ({
                      ...p,
                      itemRequests: p.itemRequests.includes(key)
                        ? p.itemRequests.filter((r: string) => r !== key)
                        : [...p.itemRequests, key],
                    }))}
                    className={`px-4 py-2 rounded-full border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                      message.itemRequests.includes(key)
                        ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                        : 'bg-card text-muted-foreground border-border hover:border-accent-foreground'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1 pt-4 border-t border-border">
              <label className="text-[10px] font-black text-muted-foreground uppercase ml-2">Anotação interna (Equipe)</label>
              <textarea className="w-full px-4 py-3 bg-accent/20 border-transparent border-2 rounded-xl focus:bg-background focus:border-accent-foreground focus:ring-0 text-sm font-bold transition-all outline-none min-h-[80px] text-foreground"
                value={message.teamNote}
                onChange={(e) => setMessage((p) => ({ ...p, teamNote: e.target.value }))}
                placeholder="Nota interna (não enviada aos pais)..." />
            </div>
          </div>
        )}
      </div>

      {/* Ações Fixas no Rodapé do Modal */}
      <div className="sticky bottom-[-24px] left-0 right-0 bg-card/90 backdrop-blur-xl border-t border-border p-4 sm:p-6 flex flex-wrap gap-3 justify-between items-center z-30 -mx-6 sm:-mx-8 -mb-6">
        <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
          {existingReport?.updatedAt && `Sincronizado às ${new Date(existingReport.updatedAt).toLocaleTimeString('pt-BR')}`}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => handleSave(true)} disabled={saving}
            className="flex items-center gap-2 px-4 py-3 bg-accent/30 text-foreground rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-accent transition-all active:scale-95 disabled:opacity-50">
            <Save size={16} />
            {saving ? '...' : 'Salvar'}
          </button>
          <button type="button" onClick={() => handleSave(false)} disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary/80 transition-all active:scale-95 disabled:opacity-50">
            <Check size={16} />
            {saving ? '...' : 'Finalizar'}
          </button>
        </div>
      </div>
    </div>
  )
}
