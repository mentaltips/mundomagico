'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import {
  INSTITUTION_TYPES, INSTITUTION_TYPE_LABELS, DEFAULT_MODULES,
  type InstitutionType, type ModuleKey
} from '@mundo-magico/types'
import { Settings, CheckCircle, Save, AlertCircle } from 'lucide-react'

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
    setCustomModules(null) // reset customização
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings/institution-type', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institutionType: selectedType,
          activeModules: customModules, // null = usar padrão do tipo
        }),
      })
      if (!res.ok) throw new Error()
      toast.success('Configurações salvas! O sistema foi adaptado.')
      router.refresh()
    } catch {
      toast.error('Erro ao salvar configurações.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="page-title flex items-center gap-2">
          <Settings className="w-6 h-6" />
          Tipo de Instituição
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Esta configuração adapta toda a linguagem, menus e módulos do sistema.
        </p>
      </div>

      {/* Aviso */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          Ao mudar o tipo de instituição, o sistema irá adaptar automaticamente os termos usados
          (ex: "Aluno" → "Criança", "Turma" → "Grupo") e ativar/ocultar módulos correspondentes.
          Os dados existentes não serão afetados.
        </p>
      </div>

      {/* Seleção do tipo */}
      <div className="card p-5">
        <h2 className="section-title mb-4">Selecione o tipo de operação</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {INSTITUTION_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => handleTypeChange(type)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                selectedType === type
                  ? 'border-violet-500 bg-violet-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <p className={`font-semibold ${selectedType === type ? 'text-violet-700' : 'text-gray-900'}`}>
                  {INSTITUTION_TYPE_LABELS[type]}
                </p>
                {selectedType === type && (
                  <CheckCircle className="w-5 h-5 text-violet-500 flex-shrink-0" />
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">{TYPE_DESCRIPTIONS[type]}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Módulos */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Módulos ativos</h2>
          {!isHybrid && (
            <button
              type="button"
              onClick={() => setCustomModules(null)}
              className="text-xs text-violet-600 hover:text-violet-800"
            >
              Restaurar padrão
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500 mb-4">
          {isHybrid
            ? 'No modo Híbrido, você escolhe exatamente quais módulos ativar.'
            : 'Os módulos abaixo são os padrões para o tipo selecionado. Você pode personalizar clicando em cada um.'
          }
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(Object.keys(MODULE_LABELS) as ModuleKey[]).map((mod) => {
            const isActive = activeModules.includes(mod)
            return (
              <label
                key={mod}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  isActive ? 'bg-violet-50 border-violet-200' : 'bg-gray-50 border-gray-200 opacity-60'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={() => toggleModule(mod)}
                  className="rounded text-violet-600 focus:ring-violet-500"
                />
                <span className={`text-sm ${isActive ? 'text-violet-900 font-medium' : 'text-gray-500'}`}>
                  {MODULE_LABELS[mod]}
                </span>
              </label>
            )
          })}
        </div>
      </div>

      {/* Preview de terminologia */}
      <div className="card p-5">
        <h2 className="section-title mb-4">Preview da terminologia</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
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

      {/* Botão salvar */}
      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          <Save className="w-4 h-4" />
          {saving ? 'Salvando...' : 'Salvar configurações'}
        </button>
      </div>
    </div>
  )
}

function TermRow({ before }: { before: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50">
      <CheckCircle className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
      <span className="text-gray-700">{before}</span>
    </div>
  )
}
