import { Request, Response, NextFunction } from 'express'
import { AppError } from '../shared/errors/AppError'
import { ERROR_CODES } from '../shared/errors/error-codes'

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const userRole = req.user?.role

    if (!userRole || !roles.includes(userRole)) {
      return next(new AppError(`Apenas ${roles.join(' ou ')} podem executar esta acao.`, 403, ERROR_CODES.FORBIDDEN))
    }

    return next()
  }
}
