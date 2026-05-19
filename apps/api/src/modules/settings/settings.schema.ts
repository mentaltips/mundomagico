import { z } from 'zod'
import { SECRET_MASK } from '../../shared/security/school-secrets'

const optionalString = z.string().trim().optional().nullable()
const secretField = z.string().optional().nullable()

export const updateSettingsSchema = z.object({
  name: z.string().trim().min(1).max(180).optional(),
  cnpj: optionalString,
  phone: optionalString,
  email: z.string().trim().email().max(255).optional().nullable(),
  address: optionalString,
  city: optionalString,
  state: optionalString,
  zipCode: optionalString,
  logoUrl: optionalString,
  whatsappToken: secretField,
  whatsappPhone: optionalString,
  smtpHost: optionalString,
  smtpPort: z.coerce.number().int().min(1).max(65535).optional().nullable(),
  smtpUser: optionalString,
  smtpPass: secretField,
  smtpFrom: optionalString,
  mpAccessToken: secretField,
  mpPublicKey: secretField,
  autoGenerateInvoices: z.boolean().optional(),
  billingGenerationDay: z.coerce.number().int().min(1).max(28).optional().nullable(),
  invoiceDescription: z.string().trim().min(1).max(255).optional(),
})

export const updateInstitutionTypeSchema = z.object({
  institutionType: z.string().trim().min(1).max(64).optional(),
  activeModules: z.union([z.array(z.string().trim().min(1)), z.string()]).optional().nullable(),
  terminology: z.union([z.record(z.unknown()), z.string()]).optional().nullable(),
})

export function isSecretMask(value: unknown) {
  return value === SECRET_MASK
}

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>
export type UpdateInstitutionTypeInput = z.infer<typeof updateInstitutionTypeSchema>
