import { Queue, Worker, QueueEvents } from 'bullmq'
import Redis from 'ioredis'
import { prisma } from '@mundo-magico/database'

declare global {
  var lastRedisErrorLog: number | undefined;
}

const DISABLE_REDIS = process.env.DISABLE_REDIS === 'true';

// Configuração do Redis
export const connection = DISABLE_REDIS ? (null as any) : new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  showFriendlyErrorStack: false,
  lazyConnect: true,
  enableOfflineQueue: false, // Don't queue commands if redis is down
  reconnectOnError: (err) => {
    return false; // Don't reconnect on specific errors
  }
})

// Prevent unhandled promise rejections and clean up terminal
if (connection) {
  connection.on('error', (err: any) => {
    // Silent error during development
    if (process.env.NODE_ENV !== 'production') {
      // Just a tiny log every minute to avoid flood
      const now = Date.now();
      if (!global.lastRedisErrorLog || now - global.lastRedisErrorLog > 60000) {
        console.warn('[Redis] Connection failing (Redis not running locally). Background tasks paused.');
        global.lastRedisErrorLog = now;
      }
    }
  })
}

export const QUEUE_NAMES = {
  WHATSAPP_NOTIFICATIONS: 'whatsapp-notifications',
}

// Criação da Fila
export const whatsappQueue = connection ? new Queue(QUEUE_NAMES.WHATSAPP_NOTIFICATIONS, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
}) : {
  add: async (name: string, data: any) => {
    console.log(`[Queue Mock] Job ${name} added with data:`, data);
    return { id: 'mock-job-id' };
  },
  on: () => {},
} as any;

// Eventos da Fila (Opcional, para monitoramento local)
export const whatsappQueueEvents = connection ? new QueueEvents(QUEUE_NAMES.WHATSAPP_NOTIFICATIONS, {
  connection,
}) : { on: () => {} } as any;

let lastQueueErrorTime = 0
const QUEUE_ERROR_LOG_INTERVAL = 60000

if (connection) {
  whatsappQueue.on('error', (err: any) => {
    const now = Date.now()
    if (err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED')) {
      if (now - lastQueueErrorTime > QUEUE_ERROR_LOG_INTERVAL) {
        console.warn('[Queue] Redis connection refused. System will continue mas background tasks are paused.')
        lastQueueErrorTime = now
      }
    } else {
      console.error('[Queue Error]', err)
    }
  })

  whatsappQueueEvents.on('completed', ({ jobId }: { jobId: string }) => {
    console.log(`[Queue] Job ${jobId} completed.`)
  })

  whatsappQueueEvents.on('failed', ({ jobId, failedReason }: { jobId: string, failedReason: string }) => {
    console.error(`[Queue] Job ${jobId} failed: ${failedReason}`)
  })
}
