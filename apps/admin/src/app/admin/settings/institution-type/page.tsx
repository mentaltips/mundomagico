'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import {
  INSTITUTION_TYPES, INSTITUTION_TYPE_LABELS, DEFAULT_MODULES,
  type InstitutionType, type ModuleKey
} from '@mundo-magico/types'
import { Settings, CheckCircle, Save, AlertCircle, ChevronRight } from 'lucide-react'
import { PageHeader } from '@/components/ui'
import { motion } from 'framer-motion'

const MODULE_LABELS: Record<ModuleKey, string> = {
  children:            '👶 Crianças',
  students:            '🎒 Alunos',
  groups:              '🏫 Grupos / Turmas',
  teachers:            '👩‍🏫 Professores / Educadores',
  subjects:            '📚 Disciplinas',
  grades:              '📝 Notas',
  report_cards:        '📋 Boletim / Relatório',
  attendance:          '✅ Frequência / Presença',
  daily_routine:       '🌅 Rotina diária',
  check_in_out:        '🚪 Entrada e Saída',
  medications:         '💊 Medicações',
  child_items:         '📦 Itens das crianças',
  child_photos:        '📸 Fotos do dia',
  development_reports: '❤️ Relatório de desenvolvimento',
  authorized_pickup:   '🛡️ Pessoas autorizadas a buscar',
  announcements:       '📢 Comunicados',
  financial:           '💰 Financeiro',
  documents:           '📄 Documentos',
}

const TYPE_DESCRIPTIONS: Record<InstitutionType, string> = {
  ESCOLA:           'Ensino formal com turmas, disciplinas, notas e boletim',
  CRECHE:           'Cuidado de crianças de 0-3 anos com rotina diária completa',
  BERCARIO:         'Atendimento a bebês com foco em alimentação, sono e higiene',
  MATERNAL:         'Transição entre berçário e pré-escola (2-3 anos)',
  ESPACO_INFANTIL:  'Ambiente lúdico e educativo sem ensino formal',
  RECREACAO:        'Atividades recreativas e esportivas',
  CONTRATURNO:      'Atividades extracurriculares fora do horário escolar',
  ESCOLA_CRECHE:    'Instituição que combina escola regular com creche',
  HIBRIDO:          'Configuração personalizada — escolha os módulos manualmente',
}

export default function InstitutionTypeSettingsPage() {
  const router = useRouter()
  const [selectedType, setSelectedType] = useState<InstitutionType>('CRECHE')
  const [customModules, setCustomModules] = useState<ModuleKey[] | null>(null)
  const [saving, setSaving] = useState(false)

  const isHybrid = selectedType === 'HIBRIDO'
  const activeModules: ModuleKey[] = customModules ?? DEFAULT_MODULES[selectedType] ?? []

  const toggleModule = (mod: ModuleKey) => {
    const base = customModules ?? DEFAULT_MODULES[selectedType] ?? []
    setCustomModules(
      base.includes(mod) ? base.filter((m) => m !== mod) : [...base, mod]
    )
  }

  const handleTypeChange = (type: InstitutionType) => {
    setSelectedType(type)
    setCustomModules(null)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings/institution-type', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institutionType: selectedType,
          activeModules: customModules,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success('Sistema adaptado com sucesso!')
      router.refresh()
    } catch {
      toast.error('Erro ao salvar configurações.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page animate-in">
      <PageHeader 
        title="Tipo de Instituição" 
        subtitle="Adapte a linguagem e os módulos do sistema para sua realidade."
        icon={<Settings size={24} />}
        actions={
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        }
      />

      {/* Info Alert */}
      <div className="bg-primary/5 border border-primary/20 rounded-[2.5rem] p-6 flex gap-4">
        <div className="w-10 h-10 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shrink-0">
          <AlertCircle size={20} />
        </div>
        <div className="space-y-1">
          <p className="font-black text-primary text-sm uppercase tracking-widest">Informação Importante</p>
          <p className="text-xs text-muted-foreground font-medium leading-relaxed">
            Ao mudar o tipo, o sistema irá adaptar automaticamente os termos usados (ex: "Aluno" → "Criança") 
            e ativar módulos correspondentes. Seus dados existentes não serão afetados.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Type Selection */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-accent text-foreground rounded-xl flex items-center justify-center">
              <CheckCircle size={18} />
            </div>
            <h3 className="font-black text-foreground text-sm uppercase tracking-widest">Modelo de Operação</h3>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {INSTITUTION_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleTypeChange(type)}
                className={`p-5 rounded-[2rem] border-2 text-left transition-all ${
                  selectedType === type
                    ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                    : 'border-border bg-card hover:border-primary/30'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className={`font-black uppercase tracking-widest text-xs ${selectedType === type ? 'text-primary' : 'text-muted-foreground'}`}>
                      {INSTITUTION_TYPE_LABELS[type]}
                    </p>
                    <p className="text-sm font-bold text-foreground mt-1">{TYPE_DESCRIPTIONS[type]}</p>
                  </div>
                  {selectedType === type && (
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                      <CheckCircle size={14} />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Modules Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-accent text-foreground rounded-xl flex items-center justify-center">
                <Settings size={18} />
              </div>
              <h3 className="font-black text-foreground text-sm uppercase tracking-widest">Módulos Ativos</h3>
            </div>
            {!isHybrid && (
              <button
                type="button"
                onClick={() => setCustomModules(null)}
                className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest"
              >
                Restaurar Padrão
              </button>
            )}
          </div>
          
          <div className="bg-card rounded-[2.5rem] border border-border p-6 sm:p-8 space-y-4 shadow-sm">
            <p className="text-xs text-muted-foreground font-medium mb-4">
              {isHybrid
                ? 'Modo Personalizado: escolha exatamente quais módulos deseja utilizar.'
                : 'Estes são os módulos recomendados para seu tipo de instituição.'
              }
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-none">
              {(Object.keys(MODULE_LABELS) as ModuleKey[]).map((mod) => {
                const isActive = activeModules.includes(mod)
                return (
                  <label
                    key={mod}
                    className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                      isActive 
                        ? 'bg-primary/10 border-primary text-primary font-black' 
                        : 'bg-accent/20 border-border text-muted-foreground opacity-60 grayscale'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={() => toggleModule(mod)}
                      className="w-5 h-5 accent-primary rounded-lg"
                    />
                    <span className="text-xs uppercase tracking-widest leading-none">
                      {MODULE_LABELS[mod]}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-card rounded-[2.5rem] border border-border p-8 shadow-sm">
            <h3 className="font-black text-foreground text-sm uppercase tracking-widest mb-6">Preview da Terminologia</h3>
            <div className="grid grid-cols-2 gap-3">
              {selectedType === 'ESCOLA' ? (
                <>
                  <TermRow before="Aluno" />
                  <TermRow before="Professor" />
                  <TermRow before="Turma" />
                  <TermRow before="Disciplina" />
                  <TermRow before="Nota" />
                  <TermRow before="Boletim" />
                  <TermRow before="Frequência" />
                  <TermRow before="Ocorrência pedagógica" />
                </>
              ) : (
                <>
                  <TermRow before="Criança" />
                  {selectedType === 'BERCARIO' ? <TermRow before="Cuidador" /> : <TermRow before="Educador" />}
                  {selectedType === 'BERCARIO' ? <TermRow before="Sala" /> : <TermRow before="Grupo" />}
                  <TermRow before="Rotina diária" />
                  <TermRow before="Presença diária" />
                  <TermRow before="Relatório de desenvolvimento" />
                  <TermRow before="Registro diário" />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TermRow({ before }: { before: string }) {
  return (
    <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-accent/20 border border-border">
      <div className="w-2 h-2 bg-primary rounded-full" />
      <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">{before}</span>
    </div>
  )
}
