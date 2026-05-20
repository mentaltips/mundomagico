import { z } from 'zod'

export const listMedicationsSchema = z.object({
  childId: z.string().optional(),
  active: z.string().optional(),
})

const flexibleDate = z.string().transform((val) => {
  if (!val || val === '') return undefined
  const d = new Date(val)
  if (isNaN(d.getTime())) throw new Error('Data invalida')
  return d.toISOString()
}).optional().nullable()

const medicationBaseSchema = z.object({
  childId: z.string(),
  name: z.string().trim().min(1).max(255),
  dosage: z.string().trim().min(1).max(255),
  frequency: z.string().trim().min(1).max(255).optional().nullable(),
  instructions: z.string().trim().optional().nullable(),
  startDate: flexibleDate,
  endDate: flexibleDate,
  guardianAuthDate: flexibleDate,
  active: z.boolean().optional(),
})

export const createMedicationSchema = medicationBaseSchema.transform((data) => ({
  ...data,
  notes: data.instructions,
}))

export const updateMedicationSchema = medicationBaseSchema.partial().transform((data) => ({
  ...data,
  ...(data.instructions !== undefined && { notes: data.instructions }),
}))

export const administerMedicationSchema = z.object({
  administeredAt: z.string().optional(),
  dosage: z.string().trim().optional(),
  notes: z.string().trim().optional().nullable(),
})

export type ListMedicationsQuery = z.infer<typeof listMedicationsSchema>
export type CreateMedicationInput = z.infer<typeof createMedicationSchema>
export type UpdateMedicationInput = z.infer<typeof updateMedicationSchema>
export type AdministerMedicationInput = z.infer<typeof administerMedicationSchema>
