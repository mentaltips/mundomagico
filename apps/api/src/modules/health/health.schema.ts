import { z } from 'zod'

export const listMedicationsSchema = z.object({
  childId: z.string().optional(),
  active: z.string().optional(),
})

const flexibleDate = z.string().transform((val) => {
  const d = new Date(val)
  if (isNaN(d.getTime())) throw new Error('Data invalida')
  return d.toISOString()
})

export const createMedicationSchema = z.object({
  childId: z.string(),
  name: z.string().trim().min(1).max(255),
  dosage: z.string().trim().min(1).max(255),
  frequency: z.string().trim().min(1).max(255),
  instructions: z.string().trim().optional().nullable(),
  startDate: flexibleDate,
  endDate: flexibleDate.optional().nullable(),
  guardianAuthDate: flexibleDate.optional().nullable(),
  active: z.boolean().optional(),
})

export const updateMedicationSchema = createMedicationSchema.partial()

export const administerMedicationSchema = z.object({
  administeredAt: flexibleDate.optional(),
  dosage: z.string().trim().optional(),
  notes: z.string().trim().optional().nullable(),
})

export type ListMedicationsQuery = z.infer<typeof listMedicationsSchema>
export type CreateMedicationInput = z.infer<typeof createMedicationSchema>
export type UpdateMedicationInput = z.infer<typeof updateMedicationSchema>
export type AdministerMedicationInput = z.infer<typeof administerMedicationSchema>
