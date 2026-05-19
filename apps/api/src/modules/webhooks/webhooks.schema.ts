import { z } from 'zod'

export const mercadoPagoWebhookSchema = z.object({
  type: z.string().optional(),
  data: z.object({
    id: z.union([z.string(), z.number()]).optional(),
  }).optional(),
}).passthrough()

export type MercadoPagoWebhookPayload = z.infer<typeof mercadoPagoWebhookSchema>

