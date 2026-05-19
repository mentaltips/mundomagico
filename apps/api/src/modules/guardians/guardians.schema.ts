import { z } from 'zod'

const optionalString = z.string().trim().optional().nullable()

export const guardianIdParamsSchema = z.object({
  id: z.string().trim().min(1).max(128),
})

export const createGuardianSchema = z.object({
  fullName: z.string().trim().min(2).max(180),
  cpf: optionalString,
  rg: optionalString,
  phone: z.string().trim().min(1).max(32),
  phone2: optionalString,
  email: z.string().trim().email().max(255).optional().nullable(),
  relationship: z.string().trim().min(1).max(80),
  photoUrl: optionalString,
  address: optionalString,
  occupation: optionalString,
  status: z.string().trim().min(1).max(32).default('ATIVO'),
  childId: z.string().trim().min(1).max(128).optional().nullable(),
  studentId: z.string().trim().min(1).max(128).optional().nullable(),
  isPrimary: z.boolean().optional(),
  canPickup: z.boolean().optional(),
  receiveNotif: z.boolean().optional(),
})

export const updateGuardianSchema = createGuardianSchema
  .omit({ childId: true, studentId: true, isPrimary: true, canPickup: true, receiveNotif: true })
  .partial()

export const linkGuardianSchema = z.object({
  childId: z.string().trim().min(1).max(128),
  guardianId: z.string().trim().min(1).max(128),
  isPrimary: z.boolean().optional(),
  canPickup: z.boolean().optional(),
  receiveNotif: z.boolean().optional(),
})

export const unlinkGuardianSchema = z.object({
  childId: z.string().trim().min(1).max(128),
  guardianId: z.string().trim().min(1).max(128),
})

export type CreateGuardianInput = z.infer<typeof createGuardianSchema>
export type UpdateGuardianInput = z.infer<typeof updateGuardianSchema>
export type LinkGuardianInput = z.infer<typeof linkGuardianSchema>
export type UnlinkGuardianInput = z.infer<typeof unlinkGuardianSchema>
