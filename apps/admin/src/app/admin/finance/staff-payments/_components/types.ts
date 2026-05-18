// ─── Tipos e constantes compartilhados do módulo Staff Payments ───

export type StaffGroupAssignment = {
  id: string
  groupId: string
  group: { id: string; name: string }
  assignmentType: string
  status: string
}

export type Staff = {
  id: string
  name: string
  email: string | null
  phone: string | null
  whatsapp: string | null
  cpf: string | null
  birthDate: string | null
  roleType: string
  status: string
  baseSalary: number | null
  paymentDay: number | null
  pixKey: string | null
  bankName: string | null
  bankAgency: string | null
  bankAccount: string | null
  financialNotes: string | null
  userId: string | null
  groupAssignments: StaffGroupAssignment[]
}

export type StaffPaymentBonus = {
  id: string
  title: string
  description: string | null
  amount: number
  type: string
}

export type StaffPaymentDeduction = {
  id: string
  title: string
  description: string | null
  amount: number
  type: string
}

export type StaffPayment = {
  id: string
  staffId: string
  referenceMonth: number
  referenceYear: number
  baseSalary: number
  totalBonuses: number
  totalDeductions: number
  finalAmount: number
  status: 'DRAFT' | 'PENDING' | 'PAID' | 'CANCELED'
  paymentDate: string | null
  paymentMethod: string | null
  notes: string | null
  staff: {
    id: string
    name: string
    roleType: string
    pixKey: string | null
    bankName: string | null
    bankAgency: string | null
    bankAccount: string | null
  }
  bonuses: StaffPaymentBonus[]
  deductions: StaffPaymentDeduction[]
}

export type Group = {
  id: string
  name: string
  shift: string
}

// ─── Constantes ───

export const ROLE_LABELS: Record<string, string> = {
  TEACHER: 'Professor(a)',
  MONITOR: 'Monitora',
  CAREGIVER: 'Cuidadora',
  COORDINATOR: 'Coordenadora',
  ASSISTANT: 'Auxiliar',
}

export const ASSIGNMENT_LABELS: Record<string, string> = {
  MAIN_TEACHER: 'Prof. Principal',
  ASSISTANT: 'Auxiliar',
  MONITOR: 'Monitora',
  CAREGIVER: 'Cuidadora',
}

export const MONTHS = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]

export const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  DRAFT:    { label: 'Rascunho', className: 'bg-muted text-muted-foreground' },
  PENDING:  { label: 'Pendente', className: 'bg-amber-500/10 text-amber-600' },
  PAID:     { label: 'Pago',     className: 'bg-emerald-500/10 text-emerald-600' },
  CANCELED: { label: 'Cancelado', className: 'bg-destructive/10 text-destructive' },
}
