import { z } from 'zod'

export const getAttendanceSchema = z.object({
  date: z.string().optional(),
  groupId: z.string().optional(),
})

export const attendanceRecordSchema = z.object({
  childId: z.string(),
  status: z.string().trim().optional(),
  checkInTime: z.string().datetime().optional().nullable(),
  checkOutTime: z.string().datetime().optional().nullable(),
})

export const registerAttendanceSchema = z.object({
  date: z.string().optional(),
  records: z.array(attendanceRecordSchema),
})

export type GetAttendanceQuery = z.infer<typeof getAttendanceSchema>
export type RegisterAttendanceInput = z.infer<typeof registerAttendanceSchema>
