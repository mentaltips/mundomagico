import { z } from 'zod'

export const createPhotoSchema = z.object({
  url: z.string().trim().url(),
  caption: z.string().trim().max(500).optional().nullable(),
  isPrivate: z.boolean().optional(),
  sharedWithParents: z.boolean().optional(),
  childId: z.string().optional().nullable(),
  groupId: z.string().optional().nullable(),
  date: z.string().datetime().optional().nullable(),
  taggedChildIds: z.union([z.array(z.string()), z.string()]).optional().nullable(),
})

export const listPhotosQuerySchema = z.object({
  childId: z.string().optional(),
  groupId: z.string().optional(),
  sharedWithParents: z.enum(['true', 'false']).optional(),
})

export type CreatePhotoInput = z.infer<typeof createPhotoSchema>
export type ListPhotosQuery = z.infer<typeof listPhotosQuerySchema>
