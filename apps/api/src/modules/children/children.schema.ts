import { z } from 'zod'

const isoDate = z.string().datetime({ offset: true }).or(z.string().date())
const optionalDate = isoDate.optional().nullable()
const optionalString = z.string().trim().optional().nullable()
const optionalBool = z.boolean().optional()
const moneySchema = z.union([z.string().trim().min(1), z.number().positive()]).optional().nullable()

export const childIdParamsSchema = z.object({
  id: z.string().trim().min(1).max(128),
})

export const authorizedPickupParamsSchema = childIdParamsSchema.extend({
  personId: z.string().trim().min(1).max(128),
})

export const createChildSchema = z.object({
  fullName: z.string().trim().min(2).max(180),
  birthDate: isoDate,
  nickname: optionalString,
  photoUrl: optionalString,
  gender: z.preprocess(
    (value) => (value === '' ? null : value),
    z.enum(['MASCULINO', 'FEMININO', 'OUTRO']).optional().nullable(),
  ),
  groupId: optionalString,
  registrationNumber: optionalString,
  shift: z.enum(['MANHA', 'TARDE', 'INTEGRAL', 'NOTURNO']).default('MANHA'),
  contractedHours: optionalString,
  entryDate: optionalDate,
  exitDate: optionalDate,
  status: z.enum(['ATIVO', 'INATIVO', 'ADAPTACAO', 'AGUARDANDO_VAGA', 'CANCELADO', 'PENDENTE_PAGAMENTO']).default('ATIVO'),
  bloodType: optionalString,
  allergies: optionalString,
  continuousMeds: optionalString,
  dietaryRestrictions: optionalString,
  healthObservations: optionalString,
  usesDiapers: optionalBool,
  usesBottle: optionalBool,
  usesNipple: optionalBool,
  specialSleep: optionalString,
  observations: optionalString,
  imageAuthorized: optionalBool,
  imageAuthDate: optionalDate,
  imageAuthBy: optionalString,
  monthlyFee: moneySchema,
  dueDay: z.number().int().min(1).max(28).optional().nullable(),
})

export const updateChildSchema = createChildSchema.partial()

export const createAuthorizedPickupSchema = z.object({
  fullName: z.string().trim().min(2).max(180),
  relationship: z.string().trim().min(1).max(80),
  cpf: optionalString,
  rg: optionalString,
  phone: z.string().trim().min(1).max(32),
  photoUrl: optionalString,
  authorization: z.enum(['SIM', 'NAO', 'TEMPORARIO']).default('SIM'),
  validUntil: optionalDate,
  observations: optionalString,
})

export type CreateChildInput = z.infer<typeof createChildSchema>
export type UpdateChildInput = z.infer<typeof updateChildSchema>
export type CreateAuthorizedPickupInput = z.infer<typeof createAuthorizedPickupSchema>
