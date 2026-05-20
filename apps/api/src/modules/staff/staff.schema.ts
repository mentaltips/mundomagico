import { z } from 'zod'

export const createStaffSchema = z.object({
  name: z.string().trim().min(1).max(255),
  email: z.string().trim().email().optional().nullable(),
  phone: z.string().trim().optional().nullable(),
  whatsapp: z.string().trim().optional().nullable(),
  cpf: z.string().trim().optional().nullable(),
  birthDate: z.string().datetime().optional().nullable(),
  photoUrl: z.string().trim().optional().nullable(),
  roleType: z.enum(['ADMIN', 'PROFESSOR', 'APOIO', 'OUTRO']).optional(),
  baseSalary: z.coerce.number().nonnegative().optional().nullable(),
  paymentDay: z.coerce.number().int().min(1).max(31).optional().nullable(),
  pixKey: z.string().trim().optional().nullable(),
  bankName: z.string().trim().optional().nullable(),
  bankAgency: z.string().trim().optional().nullable(),
  bankAccount: z.string().trim().optional().nullable(),
  financialNotes: z.string().trim().optional().nullable(),
  userId: z.string().optional().nullable(),
})

export const updateStaffSchema = createStaffSchema.partial().extend({
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
})

export const generatePaymentsSchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
  staffId: z.string().optional(),
})

export const updatePaymentSchema = z.object({
  status: z.enum(['DRAFT', 'APPROVED', 'PAID', 'CANCELLED']).optional(),
  paymentDate: z.string().datetime().optional().nullable(),
  paymentMethod: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
})

export const addBonusSchema = z.object({
  title: z.string().trim().min(1).max(255),
  description: z.string().trim().optional().nullable(),
  amount: z.coerce.number().positive(),
  type: z.string().trim().optional(),
})

export const addDeductionSchema = z.object({
  title: z.string().trim().min(1).max(255),
  description: z.string().trim().optional().nullable(),
  amount: z.coerce.number().positive(),
  type: z.string().trim().optional(),
})

export const assignGroupSchema = z.object({
  groupId: z.string(),
  assignmentType: z.string().trim().optional(),
})

export type CreateStaffInput = z.infer<typeof createStaffSchema>
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>
export type GeneratePaymentsInput = z.infer<typeof generatePaymentsSchema>
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>
export type AddBonusInput = z.infer<typeof addBonusSchema>
export type AddDeductionInput = z.infer<typeof addDeductionSchema>
export type AssignGroupInput = z.infer<typeof assignGroupSchema>

export type ListPaymentsQuery = {
  month?: string
  year?: string
  staffId?: string
  status?: string
}
