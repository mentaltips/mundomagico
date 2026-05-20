import { z } from 'zod'

export const getFeedSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
})

export type GetFeedQuery = z.infer<typeof getFeedSchema>
