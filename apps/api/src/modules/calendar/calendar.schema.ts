import { z } from 'zod'

export const createEventSchema = z.object({
  title: z.string().trim().min(1).max(255),
  description: z.string().trim().optional().nullable(),
  date: z.string().datetime(),
  groupId: z.string().optional().nullable(),
  isAllDay: z.boolean().optional(),
})

export const updateEventSchema = createEventSchema.partial()

export const listEventsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

export type CreateEventInput = z.infer<typeof createEventSchema>
export type UpdateEventInput = z.infer<typeof updateEventSchema>
export type ListEventsQuery = z.infer<typeof listEventsQuerySchema>
