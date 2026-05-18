import { Request, Response, NextFunction } from 'express'
import { prisma } from '@mundo-magico/database'
import jwt from 'jsonwebtoken'

export const analyticsMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const ignoredPaths = ['/favicon.ico', '/static', '/_next', '/api/stats', '/api/notifications']
  const isIgnored = ignoredPaths.some(path => req.path.startsWith(path))

  if (!isIgnored && req.method === 'GET') {
    try {
      let schoolId = (req as any).user?.schoolId

      // Se o user não estiver populado, tenta pegar do token manualmente
      if (!schoolId) {
        const authHeader = req.headers.authorization
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.split(' ')[1]
          try {
            const decoded = jwt.decode(token) as any
            schoolId = decoded?.schoolId
          } catch {
            // Ignore malformed analytics tokens; auth middleware handles protected routes.
          }
        }
      }

      // @ts-ignore - Prisma client may take a moment to refresh types in some IDEs
      prisma.pageVisit.create({
        data: {
          path: req.path,
          ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress,
          userAgent: req.headers['user-agent'],
          schoolId: schoolId || null
        }
      }).catch((err: Error) => console.error('Error tracking visit:', err))
    } catch (error) {
      console.error('Error scheduling analytics tracking:', error)
    }
  }
  
  next()
}
