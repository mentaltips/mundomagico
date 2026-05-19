import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(1).max(255),
})

export const refreshTokenSchema = z.object({
  refreshToken: z.string().trim().min(1),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(255),
  newPassword: z.string().min(6).max(255),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
