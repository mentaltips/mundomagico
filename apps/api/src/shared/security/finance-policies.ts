import { z } from 'zod'

export const moneySchema = z.union([z.string(), z.number()]).transform((value) => String(value)).refine(
  (value) => /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(value) && Number(value) > 0,
  'Valor monetario invalido',
)

export const manualPaymentSchema = z.object({
  paymentMethod: z.string().trim().min(1).max(32).optional(),
  amount: moneySchema.optional(),
  notes: z.string().trim().max(500).optional(),
})

export const invoiceWriteSchema = z.object({
  description: z.string().trim().min(1).max(255).optional(),
  amount: moneySchema.optional(),
  referenceMonth: z.string().trim().max(16).optional().nullable(),
  status: z.enum(['PENDENTE', 'VENCIDO', 'CANCELADO']).optional(),
  guardianId: z.string().trim().min(1).max(128).optional().nullable(),
})

