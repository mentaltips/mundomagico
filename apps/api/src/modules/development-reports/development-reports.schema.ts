import { z } from 'zod'

export const createReportSchema = z.object({
  childId: z.string(),
  title: z.string().trim().min(1).max(255),
  content: z.string().trim().min(1),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  isDraft: z.boolean().optional(),
  publishedAt: z.string().datetime().optional().nullable(),
  observations: z.string().trim().optional().nullable(),
})

export const updateReportSchema = createReportSchema.partial().omit({ childId: true })

export type CreateReportInput = z.infer<typeof createReportSchema>
export type UpdateReportInput = z.infer<typeof updateReportSchema>
export type ListReportsQuery = { childId?: string; isDraft?: string }
