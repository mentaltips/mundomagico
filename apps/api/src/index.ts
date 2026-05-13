import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import pino from 'pino-http'

import './workers/whatsapp.worker'
import { whatsappQueue } from './services/queue'
import { requireApiAuth } from './middleware/auth'
import studentRoutes from './routes/students'
import groupRoutes from './routes/groups'
import statsRoutes from './routes/stats'
import authRoutes from './routes/auth'

const app = express()

app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(pino())

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/students', requireApiAuth, studentRoutes)
app.use('/api/groups', requireApiAuth, groupRoutes)
app.use('/api/stats', requireApiAuth, statsRoutes)
app.use('/api/auth', authRoutes)

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
