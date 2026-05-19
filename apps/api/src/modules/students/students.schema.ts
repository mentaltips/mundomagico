import { z } from 'zod'

const isoDate = z.string().datetime({ offset: true }).or(z.string().date())
const optionalString = z.string().trim().optional().nullable()
const moneySchema = z.union([z.string().trim().min(1), z.number().positive()]).optional().nullable()

export const studentIdParamsSchema = z.object({
  id: z.string().trim().min(1).max(128),
})

export const createStudentSchema = z.object({
  fullName: z.string().trim().min(2).max(180),
  birthDate: isoDate,
  photoUrl: optionalString,
  registrationNumber: optionalString,
  groupId: z.string().trim().min(1).max(128).optional().nullable(),
  shift: z.enum(['MANHA', 'TARDE', 'INTEGRAL', 'NOTURNO']).default('MANHA'),
  entryDate: isoDate.optional().nullable(),
  status: z.string().trim().min(1).max(32).default('ATIVO'),
  observations: optionalString,
  monthlyFee: moneySchema,
  dueDay: z.number().int().min(1).max(28).optional().nullable(),
})

export type CreateStudentInput = z.infer<typeof createStudentSchema>
