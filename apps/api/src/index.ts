import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import pino from 'pino-http'
import path from 'path'

import './workers/whatsapp.worker'
import { whatsappQueue, isRedisHealthy } from './services/queue'
import { requireApiAuth } from './middleware/auth'
import { requireRole } from './middleware/requireRole'
import { analyticsMiddleware } from './middlewares/analytics'

// Existing routes
import studentRoutes from './routes/students'
import groupRoutes from './routes/groups'
import statsRoutes from './routes/stats'
import authRoutes from './routes/auth'
import webhooksRoutes from './routes/webhooks'

// New routes
import childrenRoutes from './routes/children'
import announcementsRoutes from './routes/announcements'
import calendarRoutes from './routes/calendar'
import checkInOutRoutes from './routes/check-in-out'
import childItemsRoutes from './routes/child-items'
import dailyRoutineRoutes from './routes/daily-routine'
import developmentReportsRoutes from './routes/development-reports'
import financeRoutes from './routes/finance'
import guardiansRoutes from './routes/guardians'
import healthRoutes from './routes/health'
import photosRoutes from './routes/photos'
import settingsRoutes from './routes/settings'
import usersRoutes from './routes/users'
import notificationsRoutes from './routes/notifications'
import parentRoutes from './routes/parent'
import teacherRoutes from './routes/teacher'
import dailyReportsRoutes from './routes/daily-reports'
import documentsRoutes from './routes/documents'
import billingRoutes from './routes/billing'
import reportsRoutes from './routes/reports'
import uploadRoutes from './routes/upload'
import analyticsRoutes from './routes/analytics'
import staffRoutes from './routes/staff'
import whatsappConfigRoutes from './routes/whatsapp-config'

const app = express()

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}))

// CORS - aceita requisições do admin Vercel e de localhost em dev
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'https://mundomagicocajamar.com.br',
  'https://www.mundomagicocajamar.com.br',
  'https://admin.mundomagicocajamar.com.br',
  'https://api.mundomagicocajamar.com.br',
  ...(process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : []),
]
app.use(cors({
  origin: (origin, callback) => {
    // Permite requisições sem origin (ex: curl, Postman, server-to-server)
    if (!origin) return callback(null, true)
    if (allowedOrigins.some((o) => origin.startsWith(o))) return callback(null, true)
    callback(new Error(`CORS: origin ${origin} not allowed`))
  },
  credentials: true,
}))

app.use(express.json())
app.use(pino())

// Middleware para capturar requisições que chegam via ?path= (comum em proxies mal configurados)
app.use((req, res, next) => {
  if (req.query.path && typeof req.query.path === 'string') {
    const newPath = req.query.path.startsWith('/') ? req.query.path : `/${req.query.path}`
    req.url = newPath
    // Remove o query parameter para evitar loops ou confusão
    delete req.query.path
  }

  // VACINA: Se a requisição não começar com /api, /uploads ou /health, injetamos o /api automaticamente
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

app.use(analyticsMiddleware)

// Static files
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')
app.use('/uploads', express.static(UPLOAD_DIR))

app.get('/health', (req, res) => {
  const redis = isRedisHealthy()
  res.status(redis ? 200 : 207).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      api: 'ok',
      redis: redis ? 'ok' : 'unavailable — notificações WhatsApp pausadas',
    },
  })
})

// Webhooks públicos (sem auth — verificação própria por assinatura)
app.use('/api/webhooks', webhooksRoutes)

// Existing routes
app.use('/api/students', requireApiAuth, studentRoutes)
app.use('/api/groups', requireApiAuth, groupRoutes)
app.use('/api/stats', requireApiAuth, statsRoutes)
app.use('/api/auth', authRoutes)

// New routes
app.use('/api/children', requireApiAuth, childrenRoutes)
app.use('/api/announcements', requireApiAuth, announcementsRoutes)
app.use('/api/calendar', requireApiAuth, calendarRoutes)
app.use('/api/check-in-out', requireApiAuth, checkInOutRoutes)
app.use('/api/child-items', requireApiAuth, childItemsRoutes)
app.use('/api/daily-routine', requireApiAuth, dailyRoutineRoutes)
app.use('/api/development-reports', requireApiAuth, developmentReportsRoutes)
app.use('/api/finance', requireApiAuth, financeRoutes)
app.use('/api/guardians', requireApiAuth, guardiansRoutes)
app.use('/api/health', requireApiAuth, healthRoutes)
app.use('/api/upload', requireApiAuth, uploadRoutes)
app.use('/api/photos', requireApiAuth, photosRoutes)
app.use('/api/settings', requireApiAuth, settingsRoutes)
app.use('/api/users', requireApiAuth, usersRoutes)
app.use('/api/notifications', requireApiAuth, notificationsRoutes)
app.use('/api/parent', requireApiAuth, parentRoutes)
app.use('/api/teacher', requireApiAuth, requireRole('ADMIN', 'DIRECTOR', 'TEACHER', 'COORDINATOR', 'MONITOR', 'CAREGIVER'), teacherRoutes)
app.use('/api/daily-reports', requireApiAuth, dailyReportsRoutes)
app.use('/api/documents', requireApiAuth, documentsRoutes)
app.use('/api/billing', requireApiAuth, billingRoutes)
app.use('/api/reports', requireApiAuth, reportsRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/staff', requireApiAuth, requireRole('ADMIN', 'DIRECTOR'), staffRoutes)
app.use('/api/whatsapp', requireApiAuth, whatsappConfigRoutes)

const PORT = process.env.PORT || 3333
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`)
})

export default app
