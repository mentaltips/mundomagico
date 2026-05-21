import { z } from 'zod'

export const getFeedSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
})

export const parentCalendarQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
})

export const payInvoiceSchema = z.object({
  method: z.enum(['BOLETO', 'PIX', 'CARTAO']),
  payerCpf: z.string().trim().optional(),
})

export type GetFeedQuery = z.infer<typeof getFeedSchema>
export type ParentCalendarQuery = z.infer<typeof parentCalendarQuerySchema>
export type PayInvoiceInput = z.infer<typeof payInvoiceSchema>
