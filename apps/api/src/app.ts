import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import pino from 'pino-http'
import rateLimit from 'express-rate-limit'
import path from 'path'

import { isRedisHealthy } from './services/queue'
import { requireApiAuth } from './middleware/auth'
import { requireRole } from './middleware/requireRole'
import { errorMiddleware } from './shared/middlewares/error.middleware'
import { requireTenant } from './shared/middlewares/tenant.middleware'

import studentRoutes from './modules/students/students.routes'
import groupRoutes from './modules/groups/groups.routes'
import statsRoutes from './modules/stats/stats.routes'
import authRoutes from './modules/auth/auth.routes'
import webhooksRoutes from './modules/webhooks/webhooks.routes'
import childrenRoutes from './modules/children/children.routes'
import announcementsRoutes from './modules/announcements/announcements.routes'
import calendarRoutes from './modules/calendar/calendar.routes'
import checkInOutRoutes from './modules/check-in-out/check-in-out.routes'
import childItemsRoutes from './modules/child-items/child-items.routes'
import dailyRoutineRoutes from './modules/development-reports/daily-routine/daily-routine.routes'
import developmentReportsRoutes from './modules/development-reports/development-reports.routes'
import financeRoutes from './modules/finance/finance.routes'
import guardiansRoutes from './modules/guardians/guardians.routes'
import healthRoutes from './modules/health/health.routes'
import photosRoutes from './modules/photos/photos.routes'
import settingsRoutes from './modules/settings/settings.routes'
import usersRoutes from './modules/users/users.routes'
import notificationsRoutes from './modules/notifications/notifications.routes'
import parentRoutes from './modules/parent/parent.routes'
import teacherRoutes from './modules/teacher/teacher.routes'
import dailyReportsRoutes from './modules/daily-reports/daily-reports.routes'
import documentsRoutes from './modules/documents/documents.routes'
import billingRoutes from './modules/billing/billing.routes'
import reportsRoutes from './modules/reports/reports.routes'
import uploadRoutes from './modules/upload/upload.routes'
import analyticsRoutes from './modules/analytics/analytics.routes'
import staffRoutes from './modules/staff/staff.routes'
import whatsappRoutes from './modules/whatsapp/whatsapp.routes'

// Rate limit para endpoints sensíveis de autenticação.
// Brute-force em /api/auth/login: 10 tentativas / 15 min / IP.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Muitas tentativas de login. Tente novamente em alguns minutos.' } },
})

export const app = express()

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}))

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'https://mundomagicocajamar.com.br',
  'https://www.mundomagicocajamar.com.br',
  'https://admin.mundomagicocajamar.com.br',
  'https://api.mundomagicocajamar.com.br',
  ...(process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
    : []),
]

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    }
    callback(new Error(`CORS: origin ${origin} not allowed`))
  },
  credentials: true,
}))

app.use(express.json({ limit: '1mb' }))
app.use(pino({
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'],
    remove: true,
  },
}))

app.use((req, _res, next) => {
  if (
    !req.url.startsWith('/api') &&
    !req.url.startsWith('/uploads') &&
    !req.url.startsWith('/health') &&
    req.url !== '/'
  ) {
    req.url = `/api${req.url}`
  }

  next()
})

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')
const uploadsArePublic = process.env.PUBLIC_UPLOADS_ENABLED === 'true'
const uploadStaticMiddleware = express.static(UPLOAD_DIR, {
  dotfiles: 'deny',
  fallthrough: false,
  index: false,
  maxAge: uploadsArePublic ? '30d' : 0,
  setHeaders: (res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Cache-Control', uploadsArePublic ? 'public, max-age=2592000' : 'private, no-store')
  },
})

app.use('/uploads', uploadsArePublic ? uploadStaticMiddleware : [requireApiAuth, requireTenant, uploadStaticMiddleware])

app.get('/health', (_req, res) => {
  const redis = isRedisHealthy()
  res.status(redis ? 200 : 207).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      api: 'ok',
      redis: redis ? 'ok' : 'unavailable - notificacoes WhatsApp pausadas',
    },
  })
})

app.use('/api/webhooks', webhooksRoutes)

app.use('/api/students', requireApiAuth, requireTenant, studentRoutes)
app.use('/api/groups', requireApiAuth, requireTenant, groupRoutes)
app.use('/api/stats', requireApiAuth, requireTenant, statsRoutes)
app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/children', requireApiAuth, requireTenant, childrenRoutes)
app.use('/api/announcements', requireApiAuth, requireTenant, announcementsRoutes)
app.use('/api/calendar', requireApiAuth, requireTenant, calendarRoutes)
app.use('/api/check-in-out', requireApiAuth, requireTenant, checkInOutRoutes)
app.use('/api/child-items', requireApiAuth, requireTenant, childItemsRoutes)
app.use('/api/daily-routine', requireApiAuth, requireTenant, dailyRoutineRoutes)
app.use('/api/development-reports', requireApiAuth, requireTenant, developmentReportsRoutes)
app.use('/api/finance', requireApiAuth, requireTenant, financeRoutes)
app.use('/api/guardians', requireApiAuth, requireTenant, guardiansRoutes)
app.use('/api/health', requireApiAuth, requireTenant, healthRoutes)
app.use('/api/upload', requireApiAuth, requireTenant, uploadRoutes)
app.use('/api/photos', requireApiAuth, requireTenant, photosRoutes)
app.use('/api/settings', requireApiAuth, requireTenant, settingsRoutes)
app.use('/api/users', requireApiAuth, requireTenant, usersRoutes)
app.use('/api/notifications', requireApiAuth, requireTenant, notificationsRoutes)
app.use('/api/parent', requireApiAuth, requireTenant, parentRoutes)
app.use('/api/responsavel', requireApiAuth, requireTenant, parentRoutes)
app.use('/api/teacher', requireApiAuth, requireTenant, requireRole('ADMIN', 'ADMIN_ESCOLA', 'SCHOOL_ADMIN', 'DIRETOR', 'DIRECTOR', 'PROFESSOR', 'TEACHER', 'COORDENADOR', 'COORDINATOR', 'MONITOR', 'CUIDADOR', 'CAREGIVER'), teacherRoutes)
app.use('/api/professor', requireApiAuth, requireTenant, requireRole('ADMIN', 'ADMIN_ESCOLA', 'SCHOOL_ADMIN', 'DIRETOR', 'DIRECTOR', 'PROFESSOR', 'TEACHER', 'COORDENADOR', 'COORDINATOR', 'MONITOR', 'CUIDADOR', 'CAREGIVER'), teacherRoutes)
app.use('/api/daily-reports', requireApiAuth, requireTenant, dailyReportsRoutes)
app.use('/api/documents', requireApiAuth, requireTenant, documentsRoutes)
app.use('/api/billing', requireApiAuth, requireTenant, billingRoutes)
app.use('/api/reports', requireApiAuth, requireTenant, reportsRoutes)
app.use('/api/analytics', requireApiAuth, requireTenant, analyticsRoutes)
app.use('/api/staff', requireApiAuth, requireTenant, requireRole('ADMIN', 'ADMIN_ESCOLA', 'SCHOOL_ADMIN', 'DIRETOR', 'DIRECTOR'), staffRoutes)
app.use('/api/whatsapp', requireApiAuth, requireTenant, whatsappRoutes)

app.use(errorMiddleware)

export default app
