import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import pino from 'pino-http'

import './workers/whatsapp.worker'
import { whatsappQueue, isRedisHealthy } from './services/queue'
import { requireApiAuth } from './middleware/auth'

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

const app = express()

app.use(helmet())

// CORS - aceita requisições do admin Vercel e de localhost em dev
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
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
app.use('/api/photos', requireApiAuth, photosRoutes)
app.use('/api/settings', requireApiAuth, settingsRoutes)
app.use('/api/users', requireApiAuth, usersRoutes)
app.use('/api/notifications', requireApiAuth, notificationsRoutes)
app.use('/api/parent', requireApiAuth, parentRoutes)
app.use('/api/teacher', requireApiAuth, teacherRoutes)
app.use('/api/daily-reports', requireApiAuth, dailyReportsRoutes)
app.use('/api/documents', requireApiAuth, documentsRoutes)

app.post('/api/whatsapp/send', requireApiAuth, async (req, res) => {
  const { to, templateName, languageCode, components } = req.body

  if (!to || !templateName) {
    return res.status(400).json({ error: 'Missing required fields: to, templateName' })
  }

  try {
    const job = await whatsappQueue.add('send-notification', {
      to,
      templateName,
      languageCode: languageCode || 'pt_BR',
      components: components || []
    })

    res.status(202).json({ success: true, jobId: job.id })
  } catch (error) {
    req.log.error(error, 'Error enqueueing whatsapp message')
    res.status(500).json({ error: 'Failed to enqueue message' })
  }
})

const PORT = process.env.API_PORT || 3002

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 API Server running on port ${PORT}`)
})
