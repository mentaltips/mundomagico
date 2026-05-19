'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Utensils, Moon, Droplets, Heart, Save, ArrowLeft } from 'lucide-react'

function NewDailyReportContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const childId = searchParams.get('childId')
  
  const [child, setChild] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form states
  const [meals, setMeals] = useState<any[]>([])
  const [sleep, setSleep] = useState({ slept: true, startTime: '', duration: '', quality: 'BOA', observation: '' })
  const [hygiene, setHygiene] = useState({ diaperChanges: 0, pee: true, poo: false, bath: false, observation: '' })
  const [mood, setMood] = useState('FELIZ')
  const [observations, setObservations] = useState('')

  useEffect(() => {
    if (!childId) return
    async function fetchChild() {
      try {
        const res = await fetch(`/api/children/${childId}`)
        if (res.ok) {
          const data = await res.json()
          setChild(data)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchChild()
  }, [childId])

  const handleAddMeal = () => {
    setMeals([...meals, { mealType: 'Almoço', result: 'Tudo', amount: 'Normal', time: new Date().toISOString() }])
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/daily-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId,
          date: new Date().toISOString().split('T')[0],
          isDraft: false,
          messageToParents: observations,
          moods: [{ mood }],
          meals,
          sleep: sleep.slept ? {
            slept: true,
            quality: sleep.quality,
            observation: sleep.observation,
            sleepTime: sleep.startTime || undefined
          } : { slept: false, quality: 'N/A' },
          hygiene: {
            diaperChanges: hygiene.diaperChanges,
            pee: hygiene.pee,
            poo: hygiene.poo,
            bath: hygiene.bath,
            observation: hygiene.observation
          }
        })
      })

      if (res.ok) {
        router.back()
      } else {
        const error = await res.json()
        console.error('Save error:', error)
        alert('Erro ao salvar diário: ' + (error.error || 'Dados inválidos'))
      }
    } catch (err) {
      console.error(err)
      alert('Erro de conexão.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando dados da criança...</div>

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Diário: {child?.nickname || child?.fullName.split(' ')[0]}</h1>
          <p className="text-xs text-gray-500">Registro de rotina diária</p>
        </div>
      </div>

      {/* Mood Section */}
      <section className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-gray-400 uppercase mb-4 flex items-center gap-2">
          <Heart className="h-4 w-4" /> Humor do Dia
        </h3>
        <div className="flex flex-wrap gap-2">
          {['FELIZ', 'CALMO', 'AGITADO', 'CHOROSO', 'SONOLENTO'].map(m => (
            <button
              key={m}
              onClick={() => setMood(m)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                mood === m ? 'bg-violet-600 text-white' : 'bg-gray-50 text-gray-500 border border-gray-100'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </section>

      {/* Sleep Section */}
      <section className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-gray-400 uppercase mb-4 flex items-center gap-2">
          <Moon className="h-4 w-4" /> Sono / Soneca
        </h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSleep({...sleep, slept: true})}
              className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${sleep.slept ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-gray-100 text-gray-400'}`}
            >
              Dormiu
            </button>
            <button 
              onClick={() => setSleep({...sleep, slept: false})}
              className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${!sleep.slept ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-gray-100 text-gray-400'}`}
            >
              Não Dormiu
            </button>
          </div>
          
          {sleep.slept && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Qualidade</label>
                <select 
                  value={sleep.quality}
                  onChange={(e) => setSleep({...sleep, quality: e.target.value})}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-2 py-2 text-xs outline-none"
                >
                  <option value="BOA">Boa</option>
                  <option value="AGITADA">Agitada</option>
                  <option value="CURTA">Curta</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Início</label>
                <input 
                  type="time" 
                  value={sleep.startTime}
                  onChange={(e) => setSleep({...sleep, startTime: e.target.value})}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-2 py-2 text-xs outline-none"
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Hygiene Section */}
      <section className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-gray-400 uppercase mb-4 flex items-center gap-2">
          <Droplets className="h-4 w-4" /> Higiene
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 font-medium">Trocas de Fralda</span>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setHygiene({...hygiene, diaperChanges: Math.max(0, hygiene.diaperChanges - 1)})}
                className="h-8 w-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500"
              >-</button>
              <span className="font-bold text-gray-900 w-4 text-center">{hygiene.diaperChanges}</span>
              <button 
                onClick={() => setHygiene({...hygiene, diaperChanges: hygiene.diaperChanges + 1})}
                className="h-8 w-8 rounded-full border border-violet-200 bg-violet-50 flex items-center justify-center text-violet-600"
              >+</button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Xixi', key: 'pee' },
              { label: 'Cocô', key: 'poo' },
              { label: 'Banho', key: 'bath' }
            ].map(item => (
              <button
                key={item.key}
                onClick={() => setHygiene({...hygiene, [item.key as keyof typeof hygiene]: !hygiene[item.key as keyof typeof hygiene]})}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                  hygiene[item.key as keyof typeof hygiene] ? 'bg-sky-50 border-sky-200 text-sky-600' : 'bg-white border-gray-100 text-gray-400'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Meals Section */}
      <section className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase flex items-center gap-2">
            <Utensils className="h-4 w-4" /> Alimentação
          </h3>
          <button onClick={handleAddMeal} className="text-xs font-bold text-violet-600">+ Adicionar</button>
        </div>
        
        <div className="space-y-3">
          {meals.length === 0 ? (
            <p className="text-xs text-gray-400 italic">Nenhuma refeição registrada.</p>
          ) : (
            meals.map((meal, idx) => (
              <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                <div className="flex gap-2">
                  <select 
                    value={meal.mealType}
                    onChange={(e) => {
                      const newMeals = [...meals]
                      newMeals[idx].mealType = e.target.value
                      setMeals(newMeals)
                    }}
                    className="flex-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs outline-none"
                  >
                    <option>Almoço</option>
                    <option>Lanche</option>
                    <option>Jantar</option>
                    <option>Fruta</option>
                    <option>Mamadeira</option>
                  </select>
                  <select 
                    value={meal.result}
                    onChange={(e) => {
                      const newMeals = [...meals]
                      newMeals[idx].result = e.target.value
                      setMeals(newMeals)
                    }}
                    className="flex-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs outline-none"
                  >
                    <option>Tudo</option>
                    <option>Bem</option>
                    <option>Pouco</option>
                    <option>Recusou</option>
                  </select>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Observations Section */}
      <section className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-gray-400 uppercase mb-4">Observações</h3>
        <textarea
          value={observations}
          onChange={(e) => setObservations(e.target.value)}
          placeholder="Algo importante para os pais saberem hoje?"
          className="w-full h-24 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm outline-none focus:border-violet-500"
        />
      </section>

      {/* Fixed Save Button */}
      <div className="fixed bottom-20 left-4 right-4 md:bottom-8 md:left-auto md:right-8 md:w-64">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-14 bg-violet-600 text-white rounded-2xl shadow-lg flex items-center justify-center gap-2 font-bold hover:bg-violet-700 transition-all disabled:opacity-50"
        >
          <Save className="h-5 w-5" />
          {saving ? 'Salvando...' : 'Finalizar Diário'}
        </button>
      </div>
    </div>
  )
}

export default function NewDailyReportPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Carregando formulário...</div>}>
      <NewDailyReportContent />
    </Suspense>
  )
}

