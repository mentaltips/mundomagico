import { z } from 'zod'

export const createChildItemSchema = z.object({
  childId: z.string(),
  itemType: z.string().trim().min(1),
  quantityReceived: z.coerce.number().nonnegative().optional(),
  alertThreshold: z.coerce.number().nonnegative().optional(),
  notes: z.string().trim().optional().nullable(),
  lastReplenished: z.string().datetime().optional().nullable(),
})

export const updateChildItemSchema = createChildItemSchema.partial().omit({ childId: true })

export const registerUsageSchema = z.object({
  quantity: z.coerce.number().positive().optional(),
  notes: z.string().trim().optional().nullable(),
})

export const replenishSchema = z.object({
  quantity: z.coerce.number().nonnegative().optional(),
  notes: z.string().trim().optional().nullable(),
})

export type CreateChildItemInput = z.infer<typeof createChildItemSchema>
export type UpdateChildItemInput = z.infer<typeof updateChildItemSchema>
export type RegisterUsageInput = z.infer<typeof registerUsageSchema>
export type ReplenishInput = z.infer<typeof replenishSchema>
export type ListChildItemsQuery = { childId?: string }
