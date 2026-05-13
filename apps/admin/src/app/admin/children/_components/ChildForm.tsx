'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import Link from 'next/link'
import {
  User, Heart, Baby, Shield, Plus, Trash2, Camera, AlertTriangle
} from 'lucide-react'

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

export function ChildForm({ groups, defaultValues, childId }: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('personal')
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
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
      ...defaultValues,
    },
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const url = childId ? `/api/children/${childId}` : '/api/children'
      const method = childId ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          allergies: data.allergies?.split('\n').map((s) => s.trim()).filter(Boolean),
          continuousMeds: data.continuousMeds?.split('\n').map((s) => s.trim()).filter(Boolean),
          dietaryRestrictions: data.dietaryRestrictions?.split('\n').map((s) => s.trim()).filter(Boolean),
        }),
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
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
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
                <option value="outro">Outro</option>
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
              <label className="label">URL da foto</label>
              <input {...register('photoUrl')} className="input" placeholder="https://..." />
            </div>

            <div className="md:col-span-2 flex items-center gap-2">
              <input {...register('imageAuthorized')} type="checkbox" id="imageAuth" className="rounded" />
              <label htmlFor="imageAuth" className="text-sm text-gray-700">
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
          <div className="flex items-center gap-2 text-amber-600 bg-amber-50 rounded-lg px-4 py-3">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <p className="text-sm">Informações de saúde são sigilosas e de uso exclusivo da equipe.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="label">Tipo sanguíneo</label>
              <select {...register('bloodType')} className="input">
                <option value="">Não informado</option>
                {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="label">Alergias (uma por linha)</label>
              <textarea
                {...register('allergies')}
                className="input min-h-20"
                placeholder="Amendoim&#10;Lactose&#10;Glúten"
              />
            </div>

            <div className="md:col-span-2">
              <label className="label">Medicamentos em uso contínuo (um por linha)</label>
              <textarea
                {...register('continuousMeds')}
                className="input min-h-20"
                placeholder="Ritalina 10mg — às 8h&#10;Ômega 3"
              />
            </div>

            <div className="md:col-span-2">
              <label className="label">Restrições alimentares (uma por linha)</label>
              <textarea
                {...register('dietaryRestrictions')}
                className="input min-h-20"
                placeholder="Sem açúcar&#10;Vegetariano"
              />
            </div>

            <div className="md:col-span-2">
              <label className="label">Observações de saúde</label>
              <textarea
                {...register('healthObservations')}
                className="input min-h-24"
                placeholder="Informações relevantes sobre a saúde da criança..."
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── Rotina ─── */}
      {activeTab === 'routine' && (
        <div className="card p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
              <input {...register('usesDiapers')} type="checkbox" className="rounded" />
              <div>
                <p className="font-medium text-gray-900">Usa fralda</p>
                <p className="text-xs text-gray-500">Controle de troca no diário</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
              <input {...register('usesBottle')} type="checkbox" className="rounded" />
              <div>
                <p className="font-medium text-gray-900">Usa mamadeira</p>
                <p className="text-xs text-gray-500">Registrar mamadeira no diário</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
              <input {...register('usesNipple')} type="checkbox" className="rounded" />
              <div>
                <p className="font-medium text-gray-900">Usa chupeta</p>
                <p className="text-xs text-gray-500">Controle de chupeta</p>
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
            <div className="text-center py-10 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
              <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">Salve a criança primeiro para poder vincular os responsáveis.</p>
              <p className="text-xs text-gray-400 mt-2">Isso garante a integridade dos dados no sistema.</p>
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
  const [links, setLinks] = useState<any[]>([])
  const [guardians, setGuardians] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const [lRes, gRes] = await Promise.all([
        fetch(`/api/children/${childId}/guardians`),
        fetch('/api/guardians')
      ])
      if (lRes.ok) setLinks(await lRes.json())
      if (gRes.ok) setGuardians(await gRes.json())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useState(() => { fetchData() })

  const handleLink = async (guardianId: string) => {
    try {
      const res = await fetch(`/api/children/${childId}/guardians`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guardianId, relationship: 'Mãe', isPrimary: links.length === 0 })
      })
      if (res.ok) {
        toast.success('Responsável vinculado!')
        fetchData()
      }
    } catch (err) {
      toast.error('Erro ao vincular')
    }
  }

  const filteredGuardians = guardians.filter(g => 
    g.fullName.toLowerCase().includes(search.toLowerCase()) &&
    !links.some(l => l.guardianId === g.id)
  )

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Responsáveis Vinculados</h3>
        {links.length === 0 ? (
          <p className="text-sm text-gray-500 italic bg-gray-50 p-4 rounded-xl text-center">Nenhum responsável vinculado ainda.</p>
        ) : (
          <div className="grid gap-3">
            {links.map(link => (
              <div key={link.id} className="flex items-center justify-between p-4 bg-lime-50 rounded-2xl border border-lime-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-primary font-black shadow-sm">
                    {link.guardian.fullName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{link.guardian.fullName}</p>
                    <p className="text-xs text-primary font-medium">{link.isPrimary ? 'Responsável Principal' : 'Responsável Secundário'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Vincular Novo Responsável</h3>
        <div className="relative mb-4">
          <input 
            type="text" 
            placeholder="Pesquisar responsável por nome..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-4 pr-4 py-3 bg-gray-50 border-transparent border-2 rounded-xl focus:bg-white focus:border-primary focus:ring-0 text-sm font-bold transition-all outline-none"
          />
        </div>

        {search.length > 0 && (
          <div className="grid gap-2 max-h-[200px] overflow-y-auto pr-2">
            {filteredGuardians.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4">Nenhum responsável encontrado com este nome.</p>
            ) : (
              filteredGuardians.map(g => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => handleLink(g.id)}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl text-left group transition-colors"
                >
                  <span className="text-sm font-bold text-gray-700">{g.fullName}</span>
                  <Plus className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors" />
                </button>
              ))
            )}
          </div>
        )}
        
        <div className="mt-4 p-4 bg-rose-50 rounded-2xl border border-rose-100">
          <p className="text-xs text-rose-600 font-medium">Não encontrou o responsável? Cadastre-o primeiro na seção de <Link href="/admin/guardians" className="underline font-black">Responsáveis</Link> e depois volte aqui.</p>
        </div>
      </div>
    </div>
  )
}
