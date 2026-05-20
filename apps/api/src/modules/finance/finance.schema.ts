import { z } from 'zod'
import { invoiceWriteSchema, manualPaymentSchema, moneySchema } from '../../shared/security/finance-policies'

export const invoiceIdParamsSchema = z.object({
  id: z.string().trim().min(1).max(128),
})

const flexibleDate = z.string().transform((val) => {
  const d = new Date(val)
  if (isNaN(d.getTime())) throw new Error('Data invalida')
  return d.toISOString()
})

export const listInvoicesQuerySchema = z.object({
  status: z.string().trim().max(32).optional(),
  childId: z.string().trim().max(128).optional(),
  studentId: z.string().trim().max(128).optional(),
  referenceMonth: z.string().trim().max(16).optional(),
})

export const invoiceDateFieldsSchema = z.object({
  dueDate: flexibleDate.optional(),
  boletoExpiry: flexibleDate.optional(),
  pixExpiry: flexibleDate.optional(),
  paidAt: flexibleDate.optional(),
  childId: z.string().trim().min(1).max(128).optional().nullable(),
  studentId: z.string().trim().min(1).max(128).optional().nullable(),
})

export const createInvoiceSchema = invoiceDateFieldsSchema.extend({
  dueDate: flexibleDate,
}).and(invoiceWriteSchema.extend({
  description: z.string().trim().min(1).max(255),
  amount: moneySchema,
}))

export const updateInvoiceSchema = invoiceDateFieldsSchema.and(invoiceWriteSchema)

export { invoiceWriteSchema, manualPaymentSchema }

export type ListInvoicesQuery = z.infer<typeof listInvoicesQuerySchema>
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>
export type ManualPaymentInput = z.infer<typeof manualPaymentSchema>
