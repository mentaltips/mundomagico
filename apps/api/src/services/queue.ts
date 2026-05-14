import { Queue, Worker, QueueEvents } from 'bullmq'
import Redis from 'ioredis'

declare global {
  var lastRedisErrorLog: number | undefined;
}

const DISABLE_REDIS = process.env.DISABLE_REDIS === 'true'
const IS_PROD = process.env.NODE_ENV === 'production'

// ─── Controle de estado do Redis ──────────────────────────────────────────────
let redisHealthy = false
let lastRedisAlertTime = 0
const ALERT_INTERVAL_MS = 5 * 60 * 1000 // alerta a cada 5 minutos em produção

function alertRedisDown(reason: string) {
  const now = Date.now()
  if (now - lastRedisAlertTime < ALERT_INTERVAL_MS) return
  lastRedisAlertTime = now

  if (IS_PROD) {
    // Em produção: log de erro visível — monitore com PM2 / Datadog / etc.
    console.error(
      `[Redis] ⚠️  ALERTA DE PRODUÇÃO: Redis indisponível (${reason}). ` +
      `Notificações WhatsApp estão PAUSADAS. Verifique o container redis na VPS.`
    )
  } else {
    console.warn(`[Redis] Conexão falhando localmente (${reason}). Notificações pausadas.`)
  }
}

// ─── Conexão Redis ─────────────────────────────────────────────────────────────
export const connection = DISABLE_REDIS
  ? (null as any)
  : new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
      showFriendlyErrorStack: false,
      lazyConnect: true,
      enableOfflineQueue: false,
      reconnectOnError: () => false,
    })

if (connection) {
  connection.on('ready', () => {
    redisHealthy = true
    console.log('[Redis] ✅ Conectado com sucesso.')
  })

  connection.on('error', (err: any) => {
    redisHealthy = false
    const reason = err?.code || err?.message || 'erro desconhecido'
    alertRedisDown(reason)
  })

  connection.on('close', () => {
    if (redisHealthy) {
      redisHealthy = false
      alertRedisDown('conexão fechada')
    }
  })
}

// ─── Retorna status atual do Redis (usado em /health) ─────────────────────────
export function isRedisHealthy() {
  return redisHealthy
}

// ─── Nomes das filas ───────────────────────────────────────────────────────────
export const QUEUE_NAMES = {
  WHATSAPP_NOTIFICATIONS: 'whatsapp-notifications',
}

// ─── Fila de notificações WhatsApp ────────────────────────────────────────────
export const whatsappQueue = connection
  ? new Queue(QUEUE_NAMES.WHATSAPP_NOTIFICATIONS, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    })
  : {
      // Mock: Redis desabilitado via DISABLE_REDIS=true
      add: async (name: string, data: any) => {
        if (IS_PROD) {
          console.error(`[Queue] ⚠️  Redis desabilitado. Job "${name}" descartado. Notificação NÃO enviada.`)
        } else {
          console.warn(`[Queue Mock] Job "${name}" ignorado (Redis desabilitado).`)
        }
        return { id: 'mock-job-id' }
      },
      on: () => {},
    } as any

// ─── Eventos da fila ──────────────────────────────────────────────────────────
export const whatsappQueueEvents = connection
  ? new QueueEvents(QUEUE_NAMES.WHATSAPP_NOTIFICATIONS, { connection })
  : { on: () => {} } as any

let lastQueueErrorTime = 0
const QUEUE_ERROR_LOG_INTERVAL = 60_000

if (connection) {
  whatsappQueue.on('error', (err: any) => {
    const now = Date.now()
    const isConnRefused = err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED')
    if (isConnRefused) {
      if (now - lastQueueErrorTime > QUEUE_ERROR_LOG_INTERVAL) {
        alertRedisDown('ECONNREFUSED na fila')
        lastQueueErrorTime = now
      }
    } else {
      console.error('[Queue Error]', err)
    }
  })

  whatsappQueueEvents.on('completed', ({ jobId }: { jobId: string }) => {
    console.log(`[Queue] ✅ Job ${jobId} concluído.`)
  })

  whatsappQueueEvents.on('failed', ({ jobId, failedReason }: { jobId: string; failedReason: string }) => {
    console.error(`[Queue] ❌ Job ${jobId} falhou após todas as tentativas: ${failedReason}`)
  })
}
