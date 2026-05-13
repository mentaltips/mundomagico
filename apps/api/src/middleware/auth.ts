import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

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

export function requireApiAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido' })
  }

  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) {
    console.error('[Auth] NEXTAUTH_SECRET não configurado')
    return res.status(500).json({ error: 'Erro de configuração do servidor' })
  }

  try {
    const payload = jwt.verify(token, secret) as JwtPayload
    req.user = payload
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado' })
  }
}
