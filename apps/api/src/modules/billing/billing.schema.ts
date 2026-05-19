import { z } from 'zod'

const referenceMonthSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}$/)
  .optional()

export const generateMonthlySchema = z.object({
  referenceMonth: referenceMonthSchema,
})

export const previewMonthlyQuerySchema = z.object({
  referenceMonth: referenceMonthSchema,
})

export type GenerateMonthlyInput = z.infer<typeof generateMonthlySchema>
export type PreviewMonthlyQuery = z.infer<typeof previewMonthlyQuerySchema>
