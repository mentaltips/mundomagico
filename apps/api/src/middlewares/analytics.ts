import { Request, Response, NextFunction } from 'express'
import { prisma } from '@mundo-magico/database'

export const analyticsMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const ignoredPaths = ['/favicon.ico', '/static', '/_next', '/api/stats', '/api/notifications']
  const isIgnored = ignoredPaths.some(path => req.path.startsWith(path))

  if (!isIgnored && req.method === 'GET') {
    try {
      const schoolId = (req as any).user?.schoolId

      // Se o user não estiver populado, tenta pegar do token manualmente
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
