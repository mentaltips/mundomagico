import { z } from 'zod'

export const userIdParamsSchema = z.object({
  id: z.string().trim().min(1).max(128),
})

export const userRoleSchema = z.enum([
  'ADMIN',
  'ADMIN_ESCOLA',
  'SCHOOL_ADMIN',
  'DIRETOR',
  'DIRECTOR',
  'COORDENADOR',
  'COORDINATOR',
  'PROFESSOR',
  'TEACHER',
  'MONITOR',
  'CUIDADOR',
  'CAREGIVER',
  'RESPONSAVEL',
  'GUARDIAN',
  'FINANCEIRO',
  'FINANCE',
  'FUNCIONARIO',
  'STAFF',
])

export const createUserSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(255),
  role: userRoleSchema.default('FUNCIONARIO'),
  phone: z.string().trim().max(32).optional().nullable(),
  avatarUrl: z.string().trim().url().max(2048).optional().nullable(),
  active: z.boolean().optional(),
})

export const updateUserSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  email: z.string().trim().email().max(255).optional(),
  password: z.string().min(6).max(255).optional(),
  role: userRoleSchema.optional(),
  phone: z.string().trim().max(32).optional().nullable(),
  avatarUrl: z.string().trim().url().max(2048).optional().nullable(),
  active: z.boolean().optional(),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
