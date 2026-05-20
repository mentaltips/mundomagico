import { z } from 'zod'

const isoDate = z.string().datetime({ offset: true }).or(z.string().date())
const optionalDate = isoDate.optional().nullable()
const optionalString = z.string().optional().nullable()

export const checkInOutSchema = z.object({
  childId: z.string().min(1, 'childId é obrigatório'),
  date: optionalDate,
  status: z.enum(['PRESENTE', 'AUSENTE', 'SAIU_MAIS_CEDO', 'AGUARDANDO_RETIRADA']).optional(),
  checkInTime: optionalDate,
  broughtBy: optionalString,
  broughtByDoc: optionalString,
  broughtByPhoto: optionalString,
  checkInSignature: optionalString,
  checkInNote: optionalString,
  checkOutTime: optionalDate,
  pickedUpBy: optionalString,
  pickedUpByDoc: optionalString,
  pickedUpByPhoto: optionalString,
  checkOutSignature: optionalString,
  checkOutNote: optionalString,
})

export const queryCheckInOutSchema = z.object({
  date: z.string().optional(),
  childId: z.string().optional(),
})

export const listChildrenCheckInOutSchema = z.object({
  date: z.string().optional(),
  groupId: z.string().optional(),
  status: z.string().optional(),
})

export const monthlyReportQuerySchema = z.object({
  year: z.string().optional(),
  month: z.string().optional(),
  groupId: z.string().optional(),
})

export type CheckInOutInput = z.infer<typeof checkInOutSchema>
