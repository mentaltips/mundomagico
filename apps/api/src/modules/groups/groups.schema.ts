import { z } from 'zod'

export const groupIdParamsSchema = z.object({
  id: z.string().trim().min(1).max(128),
})

export const listGroupsQuerySchema = z.object({
  active: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === 'true')),
})

export const createGroupSchema = z.object({
  name: z.string().trim().min(1).max(120),
  capacity: z.coerce.number().int().min(1).max(500).optional().nullable(),
  shift: z.enum(['MANHA', 'TARDE', 'INTEGRAL', 'NOTURNO']).default('MANHA'),
  room: z.string().trim().max(80).optional().nullable(),
  minAge: z.coerce.number().int().min(0).max(240).optional().nullable(),
  maxAge: z.coerce.number().int().min(0).max(240).optional().nullable(),
  active: z.boolean().optional(),
})

export const updateGroupSchema = createGroupSchema.partial()

export type ListGroupsQuery = z.infer<typeof listGroupsQuerySchema>
export type CreateGroupInput = z.infer<typeof createGroupSchema>
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>
