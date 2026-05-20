import { z } from 'zod'

export const createAnnouncementSchema = z.object({
  title: z.string().trim().min(1).max(255),
  content: z.string().trim().min(1),
  groupId: z.string().optional().nullable(),
  type: z.enum(['GERAL', 'TURMA']).optional(),
  priority: z.enum(['NORMAL', 'URGENTE']).optional(),
  targetRole: z.string().trim().optional().nullable(),
  sentVia: z.string().trim().optional().nullable(),
  sentAt: z.string().datetime().optional().nullable(),
  isPinned: z.boolean().optional(),
  sendWhatsApp: z.boolean().optional(),
})

export const updateAnnouncementSchema = createAnnouncementSchema.partial().omit({ sendWhatsApp: true })

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>
