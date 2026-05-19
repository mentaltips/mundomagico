import { Worker, Job } from 'bullmq'
import { prisma } from '@mundo-magico/database'
import { connection, QUEUE_NAMES } from '../services/queue'
import { createWhatsAppService } from '../services/whatsapp'

export interface WhatsAppNotificationPayload {
  messageId?: string
  to: string
  templateName: string
  languageCode: string
  components: any[]
  textMessage?: string
}

export const whatsappWorker = connection ? new Worker<WhatsAppNotificationPayload>(
  QUEUE_NAMES.WHATSAPP_NOTIFICATIONS,
  async (job: Job<WhatsAppNotificationPayload>) => {
    const { messageId, to, templateName, textMessage } = job.data

    console.log(`[Worker] Processando mensagem WhatsApp para: ${to} (Template: ${templateName})`)

    let trackedMessage: Awaited<ReturnType<typeof prisma.whatsAppMessage.findUnique>> = null

    if (messageId) {
      trackedMessage = await prisma.whatsAppMessage.findUnique({
        where: { id: messageId },
      })

      if (!trackedMessage) {
        throw new Error(`WhatsAppMessage ${messageId} nao encontrada`)
      }

      if (trackedMessage.status === 'CANCELLED') {
        return { success: false, cancelled: true }
      }

      await prisma.whatsAppMessage.update({
        where: { id: messageId },
        data: {
          status: 'PROCESSING',
          attempts: { increment: 1 },
          error: null,
        },
      })
    }

    try {
      const whatsapp = createWhatsAppService()
      if (!whatsapp) {
        throw new Error('WhatsApp service desabilitado')
      }

      if (!textMessage) {
        throw new Error(`Template "${templateName}" sem textMessage definido`)
      }

      const activeSchoolId = trackedMessage?.schoolId || (job.data as any).schoolId
      if (!activeSchoolId) {
        throw new Error('Mensagem sem schoolId/escola definidos')
      }

      const sent = await whatsapp.sendTextMessage(activeSchoolId, to, textMessage)
      if (!sent) {
        throw new Error('WhatsApp nao conectado ou envio recusado pelo servico')
      }

      if (messageId) {
        await prisma.whatsAppMessage.update({
          where: { id: messageId },
          data: {
            status: 'SENT',
            sentAt: new Date(),
            error: null,
          },
        })
      }

      return { success: true }
    } catch (error: any) {
      if (messageId) {
        await prisma.whatsAppMessage.update({
          where: { id: messageId },
          data: {
            status: 'FAILED',
            error: error?.message || 'Falha ao enviar WhatsApp',
          },
        })
      }

      throw error
    }
  },
  {
    connection,
    concurrency: 5,
  }
) : null

let lastErrorTime = 0
const ERROR_LOG_INTERVAL = 60000

if (whatsappWorker) {
  whatsappWorker.on('error', (err: any) => {
    const now = Date.now()
    if (err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED')) {
      if (now - lastErrorTime > ERROR_LOG_INTERVAL) {
        console.warn('[Worker] Redis connection refused. Notifications will be queued but not sent until Redis is running.')
        lastErrorTime = now
      }
    } else {
      console.error('[Worker Error]', err)
    }
  })
}
