// =============================================================
// Sistema de Terminologia Adaptável por Tipo de Instituição
// =============================================================

export type InstitutionType =
  | 'ESCOLA'
  | 'CRECHE'
  | 'BERCARIO'
  | 'MATERNAL'
  | 'ESPACO_INFANTIL'
  | 'RECREACAO'
  | 'CONTRATURNO'
  | 'ESCOLA_CRECHE'
  | 'HIBRIDO'

export interface Terminology {
  student: string
  students: string
  teacher: string
  teachers: string
  guardian: string
  guardians: string
  group: string
  groups: string
  grade: string
  subject: string
  subjects: string
  grade_result: string
  report_card: string
  attendance: string
  occurrence: string
  daily_routine: string
  development_report: string
  enroll: string
  adaptation: string
}

const ESCOLA: Terminology = {
  student: 'Aluno',
  students: 'Alunos',
  teacher: 'Professor',
  teachers: 'Professores',
  guardian: 'Responsável',
  guardians: 'Responsáveis',
  group: 'Turma',
  groups: 'Turmas',
  grade: 'Série',
  subject: 'Disciplina',
  subjects: 'Disciplinas',
  grade_result: 'Nota',
  report_card: 'Boletim',
  attendance: 'Frequência',
  occurrence: 'Ocorrência pedagógica',
  daily_routine: 'Agenda escolar',
  development_report: 'Boletim',
  enroll: 'Matricular',
  adaptation: 'Período de adaptação',
}

const CRECHE: Terminology = {
  student: 'Criança',
  students: 'Crianças',
  teacher: 'Educador',
  teachers: 'Educadores',
  guardian: 'Responsável',
  guardians: 'Responsáveis',
  group: 'Grupo',
  groups: 'Grupos',
  grade: 'Faixa etária',
  subject: 'Atividade',
  subjects: 'Atividades',
  grade_result: 'Avaliação de desenvolvimento',
  report_card: 'Relatório de desenvolvimento',
  attendance: 'Presença diária',
  occurrence: 'Registro diário',
  daily_routine: 'Rotina diária',
  development_report: 'Relatório de desenvolvimento',
  enroll: 'Cadastrar',
  adaptation: 'Adaptação',
}

const BERCARIO: Terminology = {
  ...CRECHE,
  teacher: 'Cuidador',
  teachers: 'Cuidadores',
  group: 'Sala',
  groups: 'Salas',
  occurrence: 'Observação da criança',
}

const MATERNAL: Terminology = {
  ...CRECHE,
  teacher: 'Monitor',
  teachers: 'Monitores',
}

const ESPACO_INFANTIL: Terminology = {
  ...CRECHE,
  teacher: 'Educador',
  teachers: 'Educadores',
}

const RECREACAO: Terminology = {
  ...CRECHE,
  teacher: 'Monitor',
  teachers: 'Monitores',
  group: 'Turma',
  groups: 'Turmas',
  daily_routine: 'Atividades do dia',
  report_card: 'Relatório de atividades',
}

const CONTRATURNO: Terminology = {
  ...ESCOLA,
  daily_routine: 'Atividades do contraturno',
}

const MAP: Record<InstitutionType, Terminology> = {
  ESCOLA,
  CRECHE,
  BERCARIO,
  MATERNAL,
  ESPACO_INFANTIL,
  RECREACAO,
  CONTRATURNO,
  ESCOLA_CRECHE: CRECHE,
  HIBRIDO: CRECHE,
}

export function getTerminology(type: InstitutionType, custom?: Partial<Terminology>): Terminology {
  const base = MAP[type] ?? ESCOLA
  return custom && Object.keys(custom).length > 0 ? { ...base, ...custom } : base
}

// ─── Módulos ───

export type ModuleKey =
  | 'children'
  | 'students'
  | 'groups'
  | 'teachers'
  | 'subjects'
  | 'grades'
  | 'report_cards'
  | 'attendance'
  | 'daily_routine'
  | 'check_in_out'
  | 'medications'
  | 'child_items'
  | 'child_photos'
  | 'development_reports'
  | 'authorized_pickup'
  | 'announcements'
  | 'financial'
  | 'documents'

const SCHOOL_MODULES: ModuleKey[] = [
  'students', 'groups', 'teachers', 'subjects', 'grades',
  'report_cards', 'attendance', 'announcements', 'financial', 'documents',
]

const DAYCARE_MODULES: ModuleKey[] = [
  'children', 'groups', 'teachers', 'daily_routine', 'check_in_out',
  'medications', 'child_items', 'child_photos', 'development_reports',
  'authorized_pickup', 'attendance', 'announcements', 'financial', 'documents',
]

const HYBRID_MODULES: ModuleKey[] = Array.from(
  new Set([...SCHOOL_MODULES, ...DAYCARE_MODULES])
)

export const DEFAULT_MODULES: Record<InstitutionType, ModuleKey[]> = {
  ESCOLA:           SCHOOL_MODULES,
  CRECHE:           DAYCARE_MODULES,
  BERCARIO:         DAYCARE_MODULES,
  MATERNAL:         DAYCARE_MODULES,
  ESPACO_INFANTIL:  DAYCARE_MODULES,
  RECREACAO:        DAYCARE_MODULES.filter((m) => m !== 'medications'),
  CONTRATURNO:      [...SCHOOL_MODULES, 'daily_routine', 'check_in_out', 'child_photos'],
  ESCOLA_CRECHE:    HYBRID_MODULES,
  HIBRIDO:          HYBRID_MODULES,
}

export function getActiveModules(type: InstitutionType, custom?: ModuleKey[]): ModuleKey[] {
  return custom && custom.length > 0 ? custom : DEFAULT_MODULES[type] ?? SCHOOL_MODULES
}

export function hasModule(type: InstitutionType, mod: ModuleKey, custom?: ModuleKey[]): boolean {
  return getActiveModules(type, custom).includes(mod)
}

export function isDaycareType(type: InstitutionType): boolean {
  return !['ESCOLA', 'CONTRATURNO'].includes(type)
}

export const INSTITUTION_TYPE_LABELS: Record<InstitutionType, string> = {
  ESCOLA:           'Escola',
  CRECHE:           'Creche',
  BERCARIO:         'Berçário',
  MATERNAL:         'Maternal',
  ESPACO_INFANTIL:  'Espaço Infantil',
  RECREACAO:        'Recreação',
  CONTRATURNO:      'Contraturno Escolar',
  ESCOLA_CRECHE:    'Escola + Creche',
  HIBRIDO:          'Híbrido',
}

export const INSTITUTION_TYPES: InstitutionType[] = [
  'ESCOLA', 'CRECHE', 'BERCARIO', 'MATERNAL', 'ESPACO_INFANTIL',
  'RECREACAO', 'CONTRATURNO', 'ESCOLA_CRECHE', 'HIBRIDO',
]
