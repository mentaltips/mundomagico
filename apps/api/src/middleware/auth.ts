import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { AppError } from '../shared/errors/AppError'
import { ERROR_CODES } from '../shared/errors/error-codes'

interface JwtPayload {
  sub: string
  name?: string
  email?: string
  role?: string
  schoolId?: string
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

export function requireApiAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return next(new AppError('Token de autenticacao nao fornecido', 401, ERROR_CODES.UNAUTHORIZED))
  }

  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) {
    console.error('[Auth] NEXTAUTH_SECRET nao configurado')
    return next(new AppError('Erro de configuracao do servidor', 500, ERROR_CODES.INTERNAL_SERVER_ERROR))
  }

  try {
    const payload = jwt.verify(token, secret) as JwtPayload
    req.user = payload
    return next()
  } catch (err: any) {
    console.error('[Auth] Erro na verificacao do token:', err.message)
    return next(new AppError('Token invalido ou expirado', 401, ERROR_CODES.UNAUTHORIZED))
  }
}
