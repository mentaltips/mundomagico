import { Prisma, prisma } from '@mundo-magico/database'

export const settingsSelect = {
  id: true,
  name: true,
  cnpj: true,
  phone: true,
  email: true,
  address: true,
  city: true,
  state: true,
  zipCode: true,
  logoUrl: true,
  institutionType: true,
  activeModules: true,
  terminology: true,
  whatsappPhone: true,
  smtpHost: true,
  smtpPort: true,
  smtpUser: true,
  smtpFrom: true,
  autoGenerateInvoices: true,
  billingGenerationDay: true,
  invoiceDescription: true,
  createdAt: true,
  updatedAt: true,
  integrationSecret: {
    select: {
      whatsappToken: true,
      smtpPass: true,
      mpAccessToken: true,
      mpPublicKey: true,
    }
  }
} as any

export const institutionTypeSelect = {
  institutionType: true,
  activeModules: true,
  terminology: true,
} as any

export function findSettings(schoolId: string) {
  return prisma.school.findUnique({
    where: { id: schoolId },
    select: settingsSelect,
  })
}

export function updateSettings(schoolId: string, data: Prisma.SchoolUpdateInput) {
  return prisma.school.update({
    where: { id: schoolId },
    data,
    select: settingsSelect,
  })
}

export function findInstitutionType(schoolId: string) {
  return prisma.school.findUnique({
    where: { id: schoolId },
    select: institutionTypeSelect,
  })
}

export function updateInstitutionType(schoolId: string, data: Prisma.SchoolUpdateInput) {
  return prisma.school.update({
    where: { id: schoolId },
    data,
    select: institutionTypeSelect,
  })
}
