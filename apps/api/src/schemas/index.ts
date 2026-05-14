import { z } from 'zod'

// ─────────────────────────────────────────
// Helpers reutilizáveis
// ─────────────────────────────────────────

const isoDate = z.string().datetime({ offset: true }).or(z.string().date())
const optionalDate = isoDate.optional().nullable()
const optionalString = z.string().optional().nullable()
const optionalBool = z.boolean().optional()

// ─────────────────────────────────────────
// CRIANÇA
// ─────────────────────────────────────────

export const createChildSchema = z.object({
  fullName: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  birthDate: isoDate,
  nickname: optionalString,
  photoUrl: optionalString,
  gender: z.enum(['MASCULINO', 'FEMININO', 'OUTRO']).optional().nullable(),
  groupId: optionalString,
  registrationNumber: optionalString,
  shift: z.enum(['MANHA', 'TARDE', 'INTEGRAL', 'NOTURNO']).default('MANHA'),
  contractedHours: optionalString,
  entryDate: optionalDate,
  exitDate: optionalDate,
  status: z.enum(['ATIVO', 'INATIVO', 'ADAPTACAO', 'AGUARDANDO_VAGA', 'CANCELADO']).default('ATIVO'),
  // Saúde
  bloodType: optionalString,
  allergies: optionalString,
  continuousMeds: optionalString,
  dietaryRestrictions: optionalString,
  healthObservations: optionalString,
  // Rotina
  usesDiapers: optionalBool,
  usesBottle: optionalBool,
  usesNipple: optionalBool,
  specialSleep: optionalString,
  observations: optionalString,
  // Imagem
  imageAuthorized: optionalBool,
  imageAuthDate: optionalDate,
  imageAuthBy: optionalString,
})

export const updateChildSchema = createChildSchema.partial()

// ─────────────────────────────────────────
// CHECK-IN / CHECK-OUT
// ─────────────────────────────────────────

export const checkInOutSchema = z.object({
  childId: z.string().min(1, 'childId é obrigatório'),
  date: optionalDate,
  status: z.enum(['PRESENTE', 'AUSENTE', 'SAIU_MAIS_CEDO', 'AGUARDANDO_RETIRADA']).optional(),
  checkInTime: optionalDate,
  broughtBy: optionalString,
  broughtByDoc: optionalString,
  broughtByPhoto: optionalString,
  checkInSignature: optionalString,
  checkInNote: optionalString,
  checkOutTime: optionalDate,
  pickedUpBy: optionalString,
  pickedUpByDoc: optionalString,
  pickedUpByPhoto: optionalString,
  checkOutSignature: optionalString,
  checkOutNote: optionalString,
})

// ─────────────────────────────────────────
// RESPONSÁVEL
// ─────────────────────────────────────────

export const createGuardianSchema = z.object({
  fullName: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  relationship: z.string().min(1, 'Parentesco é obrigatório'),
  phone: optionalString,
  email: z.string().email('Email inválido').optional().nullable(),
  cpf: optionalString,
  rg: optionalString,
  address: optionalString,
  profession: optionalString,
  workPhone: optionalString,
  photoUrl: optionalString,
  notes: optionalString,
})

export const updateGuardianSchema = createGuardianSchema.partial()

// ─────────────────────────────────────────
// PESSOA AUTORIZADA A BUSCAR
// ─────────────────────────────────────────

export const createAuthorizedPickupSchema = z.object({
  fullName: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  relationship: z.string().min(1, 'Parentesco é obrigatório'),
  cpf: optionalString,
  rg: optionalString,
  phone: optionalString,
  photoUrl: optionalString,
  authorization: z.enum(['SIM', 'NAO', 'TEMPORARIO']).default('SIM'),
  validUntil: optionalDate,
  notes: optionalString,
})

// ─────────────────────────────────────────
// GRUPO
// ─────────────────────────────────────────

export const createGroupSchema = z.object({
  name: z.string().min(1, 'Nome do grupo é obrigatório'),
  shift: z.enum(['MANHA', 'TARDE', 'INTEGRAL', 'NOTURNO']).default('MANHA'),
  minAge: z.number().int().min(0).optional().nullable(),
  maxAge: z.number().int().min(0).optional().nullable(),
  capacity: z.number().int().min(1).optional().nullable(),
  room: optionalString,
  active: optionalBool,
})

export const updateGroupSchema = createGroupSchema.partial()

// ─────────────────────────────────────────
// MEDICAÇÃO
// ─────────────────────────────────────────

export const createMedicationSchema = z.object({
  childId: z.string().min(1, 'childId é obrigatório'),
  name: z.string().min(1, 'Nome do medicamento é obrigatório'),
  dosage: z.string().min(1, 'Dosagem é obrigatória'),
  frequency: optionalString,
  startDate: isoDate,
  endDate: optionalDate,
  prescriptionUrl: optionalString,
  guardianAuthorization: optionalString,
  guardianAuthDate: optionalDate,
  notes: optionalString,
  active: optionalBool,
})

// ─────────────────────────────────────────
// FATURA
// ─────────────────────────────────────────

export const createInvoiceSchema = z.object({
  childId: optionalString,
  studentId: optionalString,
  guardianId: optionalString,
  description: z.string().min(1, 'Descrição é obrigatória'),
  amount: z.number().positive('Valor deve ser positivo'),
  dueDate: isoDate,
  referenceMonth: optionalString,
  status: z.enum(['PENDENTE', 'PAGO', 'VENCIDO', 'CANCELADO']).default('PENDENTE'),
})
