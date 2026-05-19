import type { Request, Response, NextFunction } from 'express'
import { AppError } from '../errors/AppError'
import { ERROR_CODES } from '../errors/error-codes'

export function requireTenant(req: Request, _res: Response, next: NextFunction) {
  if (!req.user?.schoolId) {
    return next(new AppError('Tenant da escola nao identificado', 401, ERROR_CODES.TENANT_REQUIRED))
  }

  return next()
}
