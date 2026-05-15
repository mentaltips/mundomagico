'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import Link from 'next/link'
import {
  User, Heart, Baby, Shield, Plus, Trash2, AlertTriangle, Loader2
} from 'lucide-react'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { useQuery, useQueryClient } from '@tanstack/react-query'

const schema = z.object({
  // Dados pessoais
  fullName: z.string().min(2, 'Nome obrigatório'),
  nickname: z.string().optional(),
  birthDate: z.string().min(1, 'Data de nascimento obrigatória'),
  gender: z.string().optional(),
  photoUrl: z.string().url().optional().or(z.literal('')),
  // Matrícula
  registrationNumber: z.string().optional(),
  groupId: z.string().optional(),
  shift: z.enum(['MANHA', 'TARDE', 'INTEGRAL', 'NOTURNO']),
  contractedHours: z.string().optional(),
  entryDate: z.string().optional(),
  exitDate: z.string().optional(),
  status: z.enum(['ATIVO', 'INATIVO', 'ADAPTACAO', 'AGUARDANDO_VAGA', 'CANCELADO']),
  // Saúde
  bloodType: z.string().optional(),
  allergies: z.string().optional(),       // textarea → split em array
  continuousMeds: z.string().optional(),
  dietaryRestrictions: z.string().optional(),
  healthObservations: z.string().optional(),
  // Rotina
  usesDiapers: z.boolean().default(false),
  usesBottle: z.boolean().default(false),
  usesNipple: z.boolean().default(false),
  specialSleep: z.string().optional(),
  observations: z.string().optional(),
  // Imagem
  imageAuthorized: z.boolean().default(false),
  imageAuthDate: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Group { id: string; name: string; shift: string }

interface Props {
  groups: Group[]
  defaultValues?: Partial<FormData>
  childId?: string
}

const TABS = [
  { id: 'personal', label: 'Dados pessoais', icon: User },
  { id: 'health',   label: 'Saúde',           icon: Heart },
  { id: 'routine',  label: 'Rotina',           icon: Baby },
  { id: 'guardians',label: 'Responsáveis',     icon: Shield },
]

// Converte JSON string de array (do banco) → texto com uma linha por item
function jsonArrayToText(val: any): string {
  if (!val) return ''
  if (Array.isArray(val)) return val.join('\n')
  try { const arr = JSON.parse(val); return Array.isArray(arr) ? arr.join('\n') : String(val) }
  catch { return String(val) }
}

// Normaliza gender vindo do banco (valores antigos 'M'/'F' → novos)
function normalizeGender(g: any): string {
  if (!g) return ''
  const map: Record<string, string> = { M: 'MASCULINO', F: 'FEMININO', outro: 'OUTRO' }
  return map[g] ?? g
}

// Converte ISO datetime → yyyy-MM-dd para <input type="date">
function toDateInput(val: any): string {
  if (!val) return ''
  const s = String(val)
  // Já está no formato correto
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  // ISO com hora: pega só a parte da data
  return s.slice(0, 10)
}

// Switch acessível reutilizável
function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        checked ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
      <span className="sr-only">{label}</span>
    </button>
  )
}

export function ChildForm({ groups, defaultValues, childId }: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('personal')
  const [loading, setLoading] = useState(false)

  // Switches da aba Saúde
  const [hasAllergies, setHasAllergies] = useState(false)
  const [hasMeds, setHasMeds] = useState(false)
  const [hasDiet, setHasDiet] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      status: 'ATIVO',
      shift: 'MANHA',
      usesDiapers: false,
      usesBottle: false,
      usesNipple: false,
      imageAuthorized: false,
    },
  })

  // Popula o formulário com os dados da criança após o mount,
  // garantindo que a normalização dos valores do banco seja aplicada.
  useEffect(() => {
    if (!defaultValues) return
    const dv = defaultValues as any

    const allergiesText = jsonArrayToText(dv?.allergies)
    const medsText = jsonArrayToText(dv?.continuousMeds)
    const dietText = jsonArrayToText(dv?.dietaryRestrictions)

    // Inicializa os switches com base em dados existentes
    if (allergiesText) setHasAllergies(true)
    if (medsText) setHasMeds(true)
    if (dietText) setHasDiet(true)

    reset({
      status: 'ATIVO',
      shift: 'MANHA',
      usesDiapers: false,
      usesBottle: false,
      usesNipple: false,
      imageAuthorized: false,
      ...dv,
      // Normaliza campos que o banco pode armazenar em formatos legados
      gender: normalizeGender(dv?.gender),
      // Datas: converte ISO → yyyy-MM-dd para <input type="date">
      birthDate: toDateInput(dv?.birthDate),
      entryDate: toDateInput(dv?.entryDate),
      exitDate: toDateInput(dv?.exitDate),
      allergies: allergiesText,
      continuousMeds: medsText,
      dietaryRestrictions: dietText,
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const url = childId ? `/api/children/${childId}` : '/api/children'
      const method = childId ? 'PATCH' : 'POST'

      const payload: Record<string, any> = {
        ...data,
        // Enums / FKs / Datas: converte string vazia → null
        gender: data.gender || null,
        groupId: data.groupId || null,
        entryDate: data.entryDate || null,
        exitDate: data.exitDate || null,
        imageAuthDate: data.imageAuthDate || null,
        // Converte textarea (uma linha por item) → JSON string de array, como o banco espera
        allergies: data.allergies
          ? JSON.stringify(data.allergies.split('\n').map((s) => s.trim()).filter(Boolean))
          : null,
        continuousMeds: data.continuousMeds
          ? JSON.stringify(data.continuousMeds.split('\n').map((s) => s.trim()).filter(Boolean))
          : null,
        dietaryRestrictions: data.dietaryRestrictions
          ? JSON.stringify(data.dietaryRestrictions.split('\n').map((s) => s.trim()).filter(Boolean))
          : null,
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error(await res.text())

      toast.success(childId ? 'Criança atualizada!' : 'Criança cadastrada!')
      router.push('/admin/children')
      router.refresh()
    } catch (err) {
      toast.error('Erro ao salvar. Tente novamente.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const onInvalid = (errors: any) => {
    console.log('Validation Errors:', errors)
    toast.error('Preencha os campos obrigatórios corretamente.')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-border overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-black uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`}
            >
              <Icon className={activeTab === tab.id ? 'text-primary' : 'text-muted-foreground'} size={16} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ─── Dados pessoais ─── */}
      {activeTab === 'personal' && (
        <div className="card p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="label">Nome completo *</label>
              <input {...register('fullName')} className="input" placeholder="Nome da criança" />
              {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName.message}</p>}
            </div>

            <div>
              <label className="label">Apelido</label>
              <input {...register('nickname')} className="input" placeholder="Como é chamada?" />
            </div>

            <div>
              <label className="label">Data de nascimento *</label>
              <input {...register('birthDate')} type="date" className="input" />
              {errors.birthDate && <p className="text-xs text-red-500 mt-1">{errors.birthDate.message}</p>}
            </div>

            <div>
              <label className="label">Gênero</label>
              <select {...register('gender')} className="input">
                <option value="">Selecionar</option>
                <option value="MASCULINO">Masculino</option>
                <option value="FEMININO">Feminino</option>
                <option value="OUTRO">Outro</option>
              </select>
            </div>

            <div>
              <label className="label">Matrícula</label>
              <input {...register('registrationNumber')} className="input" placeholder="Número de matrícula" />
            </div>

            <div>
              <label className="label">Grupo / Sala</label>
              <select {...register('groupId')} className="input">
                <option value="">Sem grupo</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Turno</label>
              <select {...register('shift')} className="input">
                <option value="MANHA">Manhã</option>
                <option value="TARDE">Tarde</option>
                <option value="INTEGRAL">Integral</option>
                <option value="NOTURNO">Noturno</option>
              </select>
            </div>

            <div>
              <label className="label">Horário contratado</label>
              <input {...register('contractedHours')} className="input" placeholder="Ex: 07:00 - 18:00" />
            </div>

            <div>
              <label className="label">Data de entrada</label>
              <input {...register('entryDate')} type="date" className="input" />
            </div>

            <div>
              <label className="label">Status</label>
              <select {...register('status')} className="input">
                <option value="ATIVO">Ativo</option>
                <option value="ADAPTACAO">Em adaptação</option>
                <option value="AGUARDANDO_VAGA">Aguardando vaga</option>
                <option value="INATIVO">Inativo</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <ImageUpload
                label="Foto da Criança"
                value={watch('photoUrl') || ''}
                onChange={(url) => setValue('photoUrl', url, { shouldValidate: true })}
              />
            </div>

            <div className="md:col-span-2 flex items-center gap-2">
              <input {...register('imageAuthorized')} type="checkbox" id="imageAuth" className="rounded border-border bg-accent" />
              <label htmlFor="imageAuth" className="text-sm text-muted-foreground font-medium">
                Responsável autorizou uso de imagem da criança
              </label>
            </div>

            <div className="md:col-span-2">
              <label className="label">Observações gerais</label>
              <textarea {...register('observations')} className="input min-h-20" placeholder="Observações sobre a criança..." />
            </div>
          </div>
        </div>
      )}

      {/* ─── Saúde ─── */}
      {activeTab === 'health' && (
        <div className="card p-6 space-y-5">
          <div className="flex items-center gap-2 text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 rounded-lg px-4 py-3">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <p className="text-sm">Informações de saúde são sigilosas e de uso exclusivo da equipe.</p>
          </div>

          {/* Tipo sanguíneo */}
          <div>
            <label className="label">Tipo sanguíneo</label>
            <select {...register('bloodType')} className="input">
              <option value="">Não informado</option>
              {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Alergias */}
          <div className="rounded-2xl border border-border bg-accent/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-sm text-foreground">Possui alergias?</p>
                <p className="text-xs text-muted-foreground mt-0.5">Alimentos, medicamentos, ambiente…</p>
              </div>
              <Switch
                checked={hasAllergies}
                onChange={(v) => {
                  setHasAllergies(v)
                  if (!v) setValue('allergies', '')
                }}
                label="Possui alergias"
              />
            </div>
            {hasAllergies && (
              <textarea
                {...register('allergies')}
                className="input min-h-20"
                placeholder={"Amendoim\nLactose\nGlúten"}
                autoFocus
              />
            )}
          </div>

          {/* Medicamentos contínuos */}
          <div className="rounded-2xl border border-border bg-accent/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-sm text-foreground">Usa medicamentos contínuos?</p>
                <p className="text-xs text-muted-foreground mt-0.5">Remédios de uso diário ou regular.</p>
              </div>
              <Switch
                checked={hasMeds}
                onChange={(v) => {
                  setHasMeds(v)
                  if (!v) setValue('continuousMeds', '')
                }}
                label="Usa medicamentos contínuos"
              />
            </div>
            {hasMeds && (
              <textarea
                {...register('continuousMeds')}
                className="input min-h-20"
                placeholder={"Ritalina 10mg — às 8h\nÔmega 3"}
                autoFocus
              />
            )}
          </div>

          {/* Restrições alimentares */}
          <div className="rounded-2xl border border-border bg-accent/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-sm text-foreground">Tem restrições alimentares?</p>
                <p className="text-xs text-muted-foreground mt-0.5">Dieta especial, intolerâncias, preferências.</p>
              </div>
              <Switch
                checked={hasDiet}
                onChange={(v) => {
                  setHasDiet(v)
                  if (!v) setValue('dietaryRestrictions', '')
                }}
                label="Tem restrições alimentares"
              />
            </div>
            {hasDiet && (
              <textarea
                {...register('dietaryRestrictions')}
                className="input min-h-20"
                placeholder={"Sem açúcar\nVegetariano"}
                autoFocus
              />
            )}
          </div>

          {/* Observações gerais de saúde */}
          <div>
            <label className="label">Observações de saúde</label>
            <textarea
              {...register('healthObservations')}
              className="input min-h-24"
              placeholder="Informações relevantes sobre a saúde da criança..."
            />
          </div>
        </div>
      )}

      {/* ─── Rotina ─── */}
      {activeTab === 'routine' && (
        <div className="card p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center gap-3 p-4 rounded-xl border border-border cursor-pointer hover:bg-accent/50 transition-colors">
              <input {...register('usesDiapers')} type="checkbox" className="rounded border-border bg-accent" />
              <div>
                <p className="font-bold text-foreground">Usa fralda</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Controle de troca no diário</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 rounded-xl border border-border cursor-pointer hover:bg-accent/50 transition-colors">
              <input {...register('usesBottle')} type="checkbox" className="rounded border-border bg-accent" />
              <div>
                <p className="font-bold text-foreground">Usa mamadeira</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Registrar mamadeira no diário</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 rounded-xl border border-border cursor-pointer hover:bg-accent/50 transition-colors">
              <input {...register('usesNipple')} type="checkbox" className="rounded border-border bg-accent" />
              <div>
                <p className="font-bold text-foreground">Usa chupeta</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Controle de chupeta</p>
              </div>
            </label>
          </div>

          <div>
            <label className="label">Sono especial / rotina de sono</label>
            <textarea
              {...register('specialSleep')}
              className="input min-h-20"
              placeholder="Ex: Dorme com chupeta. Acorda se ouvir barulho. Prefere dormir às 13h."
            />
          </div>
        </div>
      )}

      {/* ─── Responsáveis ─── */}
      {activeTab === 'guardians' && (
        <div className="card p-6 space-y-6">
          {!childId ? (
            <div className="text-center py-12 bg-accent/20 rounded-[2.5rem] border-2 border-dashed border-border/50">
              <Shield className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-foreground font-black tracking-tight">Salve a criança primeiro</p>
              <p className="text-xs text-muted-foreground font-bold mt-2">Isso garante a integridade dos dados antes de vincular os responsáveis.</p>
            </div>
          ) : (
            <GuardianLinker childId={childId} />
          )}
        </div>
      )}

      {/* Rodapé */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-secondary"
        >
          Cancelar
        </button>
        <div className="flex gap-3">
          {activeTab !== TABS[TABS.length - 1].id && (
            <button
              type="button"
              onClick={() => {
                const idx = TABS.findIndex((t) => t.id === activeTab)
                setActiveTab(TABS[idx + 1].id)
              }}
              className="btn-secondary"
            >
              Próximo →
            </button>
          )}
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Salvando...' : childId ? 'Salvar alterações' : 'Cadastrar criança'}
          </button>
        </div>
      </div>
    </form>
  )
}

function GuardianLinker({ childId }: { childId: string }) {
  const [search, setSearch] = useState('')
  const queryClient = useQueryClient()

  const { data: links = [], isLoading: loadingLinks, error: errorLinks } = useQuery<any[]>({
    queryKey: ['child-guardians', childId],
    queryFn: () => fetch(`/api/children/${childId}/guardians`).then(r => {
      if (!r.ok) throw new Error('Falha ao buscar vínculos')
      return r.json()
    }),
    enabled: !!childId
  })

  const { data: guardians = [], isLoading: loadingGuardians } = useQuery<any[]>({
    queryKey: ['all-guardians'],
    queryFn: () => fetch('/api/guardians').then(r => r.json()),
  })

  const handleLink = async (guardianId: string) => {
    try {
      const res = await fetch(`/api/guardians/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId, guardianId, isPrimary: links.length === 0 })
      })

      if (res.ok) {
        toast.success('Responsável vinculado!')
        setSearch('')
        queryClient.invalidateQueries({ queryKey: ['child-guardians', childId] })
      } else {
        const data = await res.json()
        toast.error(data.error || 'Erro ao vincular')
      }
    } catch (err) {
      toast.error('Erro de conexão')
    }
  }

  const handleUnlink = async (guardianId: string) => {
    if (!confirm('Deseja realmente desvincular este responsável?')) return

    try {
      const res = await fetch(`/api/guardians/link?childId=${childId}&guardianId=${guardianId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast.success('Vínculo removido')
        queryClient.invalidateQueries({ queryKey: ['child-guardians', childId] })
      } else {
        const data = await res.json()
        toast.error(data.error || data.detail || 'Erro ao desvincular')
      }
    } catch (err) {
      toast.error('Erro de conexão')
    }
  }

  const filteredGuardians = guardians.filter(g => 
    (g.fullName || '').toLowerCase().includes(search.toLowerCase()) &&
    !links.some(l => l.guardianId === g.id)
  )

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-black text-foreground tracking-tight mb-4">Responsáveis Vinculados</h3>
        {loadingLinks ? (
          <div className="py-12 flex flex-col items-center justify-center opacity-40 animate-pulse">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <p className="text-[10px] font-black uppercase tracking-widest">Buscando responsáveis...</p>
          </div>
        ) : errorLinks ? (
          <div className="p-6 bg-rose-500/5 border border-rose-500/10 rounded-[2rem] text-center">
            <p className="text-xs text-rose-500 font-bold">Erro ao carregar responsáveis. Verifique sua conexão.</p>
          </div>
        ) : links.length === 0 ? (
          <p className="text-sm text-muted-foreground font-bold italic bg-accent/20 p-6 rounded-[2rem] text-center border border-border/50">Nenhum responsável vinculado ainda.</p>
        ) : (
          <div className="grid gap-3">
            {links.map(link => (
              <div key={link.id} className="flex items-center justify-between p-4 bg-primary/5 rounded-[2rem] border border-primary/10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-card rounded-2xl flex items-center justify-center text-primary font-black shadow-sm border border-border">
                    {link.guardian?.fullName?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="font-black text-foreground tracking-tight">{link.guardian?.fullName || 'Sem nome'}</p>
                    <p className="text-[10px] text-primary font-black uppercase tracking-widest">{link.isPrimary ? 'Responsável Principal' : 'Responsável Secundário'}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleUnlink(link.guardianId)}
                  className="p-2 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                  title="Desvincular"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-6 border-t border-border/50">
        <h3 className="text-lg font-black text-foreground tracking-tight mb-4">Vincular Novo Responsável</h3>
        <div className="relative mb-6">
          <input 
            type="text" 
            placeholder="Pesquisar responsável por nome..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-lg"
          />
        </div>

        {search.length > 0 && (
          <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredGuardians.length === 0 ? (
              <p className="text-xs text-muted-foreground font-bold text-center py-6 bg-accent/10 rounded-2xl border border-dashed border-border">Nenhum responsável encontrado.</p>
            ) : (
              filteredGuardians.map(g => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => handleLink(g.id)}
                  className="flex items-center justify-between p-4 hover:bg-accent rounded-2xl text-left group transition-all"
                >
                  <span className="text-sm font-black text-foreground tracking-tight">{g.fullName}</span>
                  <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Plus className="w-4 h-4" />
                  </div>
                </button>
              ))
            )}
          </div>
        )}
        
        <div className="mt-6 p-5 bg-rose-500/5 rounded-[2rem] border border-rose-500/10">
          <p className="text-xs text-rose-500 font-bold leading-relaxed">
            Não encontrou o responsável? Cadastre-o primeiro na seção de <Link href="/admin/guardians" className="underline font-black hover:text-rose-600 transition-colors">Responsáveis</Link> e depois volte aqui.
          </p>
        </div>
      </div>
    </div>
  )
}
