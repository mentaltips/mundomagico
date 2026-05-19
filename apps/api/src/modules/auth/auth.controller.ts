import type { NextFunction, Request, Response } from 'express'
import { AppError } from '../../shared/errors/AppError'
import { ERROR_CODES } from '../../shared/errors/error-codes'
import { changePasswordSchema, loginSchema, refreshTokenSchema } from './auth.schema'
import * as authService from './auth.service'

function getAuthenticatedUser(req: Request) {
  const userId = req.user?.sub
  const schoolId = req.user?.schoolId

  if (!userId) {
    throw new AppError('Usuario autenticado nao identificado', 401, ERROR_CODES.UNAUTHORIZED)
  }

  if (!schoolId) {
    throw new AppError('Tenant da escola nao identificado', 401, ERROR_CODES.TENANT_REQUIRED)
  }

  return { userId, schoolId }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const input = loginSchema.parse(req.body)
    res.json(await authService.login(input))
  } catch (error) {
    next(error)
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const input = refreshTokenSchema.parse(req.body)
    res.json(await authService.refresh(input))
  } catch (error) {
    next(error)
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, schoolId } = getAuthenticatedUser(req)
    res.json(await authService.getMe(userId, schoolId))
  } catch (error) {
    next(error)
  }
}

export async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, schoolId } = getAuthenticatedUser(req)
    const input = changePasswordSchema.parse(req.body)
    res.json(await authService.changePassword(userId, schoolId, input))
  } catch (error) {
    next(error)
  }
}
