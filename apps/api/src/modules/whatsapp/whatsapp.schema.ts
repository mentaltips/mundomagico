import { z } from 'zod'

const optionalQueryString = z.preprocess((value) => {
  if (Array.isArray(value)) return value[0]
  return value
}, z.string().trim().optional())

export const listMessagesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['PENDING', 'PROCESSING', 'SENT', 'FAILED', 'CANCELLED']).optional(),
  type: z.enum(['CHECKIN', 'CHECKOUT', 'INVOICE', 'ANNOUNCEMENT', 'DAILY_REPORT', 'MANUAL']).optional(),
  to: optionalQueryString.refine((value) => !value || value.length <= 32, {
    message: 'Telefone deve ter no maximo 32 caracteres',
  }),
})

export const messageIdParamsSchema = z.object({
  id: z.string().trim().min(1).max(128),
})

export const broadcastSchema = z.object({
  targetStatus: z.string().trim().max(64).optional(),
  message: z.string().trim().min(1, 'Mensagem e obrigatoria').max(4000),
})

export type ListMessagesQuery = z.infer<typeof listMessagesQuerySchema>
export type BroadcastInput = z.infer<typeof broadcastSchema>

