import { Request, Response, NextFunction } from 'express'

/**
 * Middleware que restringe acesso a roles específicas.
 * Deve ser usado após requireApiAuth.
 *
 * Exemplo: requireRole('ADMIN', 'DIRECTOR')
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role

    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({
        error: 'Acesso negado',
        detail: `Apenas ${roles.join(' ou ')} podem executar esta ação.`,
      })
    }

    next()
  }
}
