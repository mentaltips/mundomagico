import { z } from 'zod'

export const createDocumentSchema = z.object({
  childId: z.string(),
  name: z.string().trim().min(1).max(255),
  docType: z.string().trim().min(1).max(100),
  url: z.string().trim().url(),
})

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>
