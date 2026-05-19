export const CHILD_STATUS = ['ATIVO', 'INATIVO', 'ADAPTACAO', 'AGUARDANDO_VAGA', 'CANCELADO', 'PENDENTE_PAGAMENTO'] as const
export type ChildStatus = (typeof CHILD_STATUS)[number]

export const CHILD_STATUS_LABELS: Record<ChildStatus, string> = {
  ATIVO:           'Ativo',
  INATIVO:         'Inativo',
  ADAPTACAO:       'Em adaptação',
  AGUARDANDO_VAGA: 'Aguardando vaga',
  CANCELADO:       'Cancelado',
  PENDENTE_PAGAMENTO: 'Pendente de pagamento',
}

export const CHILD_STATUS_COLORS: Record<ChildStatus, string> = {
  ATIVO:           'bg-green-100 text-green-800',
  INATIVO:         'bg-gray-100 text-gray-800',
  ADAPTACAO:       'bg-yellow-100 text-yellow-800',
  AGUARDANDO_VAGA: 'bg-blue-100 text-blue-800',
  CANCELADO:       'bg-red-100 text-red-800',
  PENDENTE_PAGAMENTO: 'bg-rose-100 text-rose-800',
}

export const SHIFTS = ['MANHA', 'TARDE', 'INTEGRAL', 'NOTURNO'] as const
export type Shift = (typeof SHIFTS)[number]

export const SHIFT_LABELS: Record<Shift, string> = {
  MANHA:    'Manhã',
  TARDE:    'Tarde',
  INTEGRAL: 'Integral',
  NOTURNO:  'Noturno',
}

export const MEAL_RESULTS = ['BEM', 'POUCO', 'RECUSOU', 'NAO_SE_APLICA'] as const
export type MealResult = (typeof MEAL_RESULTS)[number]

export const MEAL_RESULT_LABELS: Record<MealResult, string> = {
  BEM:          'Comeu bem',
  POUCO:        'Comeu pouco',
  RECUSOU:      'Recusou',
  NAO_SE_APLICA: 'Não se aplica',
}

export const MEAL_RESULT_EMOJIS: Record<MealResult, string> = {
  BEM:          '😊',
  POUCO:        '😐',
  RECUSOU:      '😞',
  NAO_SE_APLICA: '—',
}

export const SLEEP_QUALITIES = ['TRANQUILO', 'AGITADO', 'POUCO', 'NAO_DORMIU'] as const
export type SleepQuality = (typeof SLEEP_QUALITIES)[number]

export const SLEEP_QUALITY_LABELS: Record<SleepQuality, string> = {
  TRANQUILO:  'Tranquilo',
  AGITADO:    'Agitado',
  POUCO:      'Dormiu pouco',
  NAO_DORMIU: 'Não dormiu',
}

export const MOODS = ['FELIZ', 'CALMO', 'AGITADO', 'CHOROSO', 'SONOLENTO', 'IRRITADO', 'PARTICIPATIVO', 'CARINHOSO'] as const
export type Mood = (typeof MOODS)[number]

export const MOOD_LABELS: Record<Mood, string> = {
  FELIZ:         'Feliz',
  CALMO:         'Calmo',
  AGITADO:       'Agitado',
  CHOROSO:       'Choroso',
  SONOLENTO:     'Sonolento',
  IRRITADO:      'Irritado',
  PARTICIPATIVO: 'Participativo',
  CARINHOSO:     'Carinhoso',
}

export const MOOD_EMOJIS: Record<Mood, string> = {
  FELIZ:         '😄',
  CALMO:         '😌',
  AGITADO:       '😤',
  CHOROSO:       '😢',
  SONOLENTO:     '😴',
  IRRITADO:      '😠',
  PARTICIPATIVO: '🙋',
  CARINHOSO:     '🤗',
}

export const CHECK_STATUSES = ['PRESENTE', 'AUSENTE', 'SAIU_MAIS_CEDO', 'AGUARDANDO_RETIRADA'] as const
export type CheckStatus = (typeof CHECK_STATUSES)[number]

export const CHECK_STATUS_LABELS: Record<CheckStatus, string> = {
  PRESENTE:           'Presente',
  AUSENTE:            'Ausente',
  SAIU_MAIS_CEDO:     'Saiu mais cedo',
  AGUARDANDO_RETIRADA: 'Aguardando retirada',
}

export const CHECK_STATUS_COLORS: Record<CheckStatus, string> = {
  PRESENTE:           'bg-green-100 text-green-700',
  AUSENTE:            'bg-gray-100 text-gray-600',
  SAIU_MAIS_CEDO:     'bg-yellow-100 text-yellow-700',
  AGUARDANDO_RETIRADA: 'bg-blue-100 text-blue-700',
}

export const ITEM_TYPES = [
  'FRALDA', 'LENCO_UMEDECIDO', 'POMADA', 'ROUPA_EXTRA', 'MAMADEIRA',
  'CHUPETA', 'LEITE', 'TOALHA', 'COBERTOR', 'MOCHILA', 'HIGIENE', 'OUTRO',
] as const
export type ItemType = (typeof ITEM_TYPES)[number]

export const ITEM_TYPE_LABELS: Record<ItemType, string> = {
  FRALDA:         'Fralda',
  LENCO_UMEDECIDO: 'Lenço umedecido',
  POMADA:         'Pomada',
  ROUPA_EXTRA:    'Roupa extra',
  MAMADEIRA:      'Mamadeira',
  CHUPETA:        'Chupeta',
  LEITE:          'Leite/Fórmula',
  TOALHA:         'Toalha',
  COBERTOR:       'Cobertor',
  MOCHILA:        'Mochila',
  HIGIENE:        'Material de higiene',
  OUTRO:          'Outro',
}

export const ITEM_TYPE_EMOJIS: Record<ItemType, string> = {
  FRALDA:         '🍼',
  LENCO_UMEDECIDO: '🧻',
  POMADA:         '💊',
  ROUPA_EXTRA:    '👕',
  MAMADEIRA:      '🍼',
  CHUPETA:        '🤱',
  LEITE:          '🥛',
  TOALHA:         '🛁',
  COBERTOR:       '🛏️',
  MOCHILA:        '🎒',
  HIGIENE:        '🧴',
  OUTRO:          '📦',
}

export const USER_ROLES = [
  'ADMIN',
  'ADMIN_ESCOLA',
  'DIRETOR',
  'COORDENADOR',
  'PROFESSOR',
  'MONITOR',
  'CUIDADOR',
  'RESPONSAVEL',
  'FINANCEIRO',
  'FUNCIONARIO',
] as const
export type UserRole = (typeof USER_ROLES)[number]

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  ADMIN:        'Administrador Geral',
  ADMIN_ESCOLA: 'Administrador da Escola',
  DIRETOR:      'Diretor',
  COORDENADOR:  'Coordenador',
  PROFESSOR:    'Professor',
  MONITOR:      'Monitor',
  CUIDADOR:     'Cuidador',
  RESPONSAVEL:  'Responsável',
  FINANCEIRO:   'Financeiro',
  FUNCIONARIO:  'Funcionário',
}

export const DEVELOPMENT_PERIODS = ['SEMANAL', 'MENSAL', 'BIMESTRAL', 'SEMESTRAL', 'PERSONALIZADO'] as const
export type DevelopmentPeriod = (typeof DEVELOPMENT_PERIODS)[number]

export const DEVELOPMENT_PERIOD_LABELS: Record<DevelopmentPeriod, string> = {
  SEMANAL:       'Semanal',
  MENSAL:        'Mensal',
  BIMESTRAL:     'Bimestral',
  SEMESTRAL:     'Semestral',
  PERSONALIZADO: 'Personalizado',
}

export const AUTHORIZATION_STATUSES = ['SIM', 'NAO', 'TEMPORARIO'] as const
export type AuthorizationStatus = (typeof AUTHORIZATION_STATUSES)[number]

export const AUTHORIZATION_LABELS: Record<AuthorizationStatus, string> = {
  SIM:       'Autorizado',
  NAO:       'Não autorizado',
  TEMPORARIO: 'Autorização temporária',
}

export const MEAL_TYPES = [
  { key: 'breakfast',      label: 'Café da manhã',   emoji: '☕' },
  { key: 'morningSnack',   label: 'Lanche da manhã', emoji: '🍎' },
  { key: 'lunch',          label: 'Almoço',          emoji: '🍽️' },
  { key: 'afternoonSnack', label: 'Lanche da tarde', emoji: '🍪' },
  { key: 'dinner',         label: 'Jantar',          emoji: '🌙' },
  { key: 'bottle',         label: 'Mamadeira',       emoji: '🍼' },
  { key: 'water',          label: 'Água',            emoji: '💧' },
] as const

export const ACTIVITY_TYPES = [
  { key: 'games',       label: 'Brincadeiras livres',    emoji: '🎮' },
  { key: 'motor',       label: 'Atividade motora',       emoji: '🏃' },
  { key: 'sensory',     label: 'Atividade sensorial',    emoji: '🎨' },
  { key: 'music',       label: 'Música',                 emoji: '🎵' },
  { key: 'storytelling',label: 'Contação de histórias',  emoji: '📚' },
  { key: 'painting',    label: 'Pintura/Desenho',        emoji: '🖌️' },
  { key: 'park',        label: 'Parque',                 emoji: '🌳' },
  { key: 'outdoor',     label: 'Atividade externa',      emoji: '🌞' },
  { key: 'other',       label: 'Outra atividade',        emoji: '⭐' },
] as const
