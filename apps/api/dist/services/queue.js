"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.whatsappQueueEvents = exports.whatsappQueue = exports.QUEUE_NAMES = exports.connection = void 0;
exports.isRedisHealthy = isRedisHealthy;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const DISABLE_REDIS = process.env.DISABLE_REDIS === 'true';
const IS_PROD = process.env.NODE_ENV === 'production';
// ─── Controle de estado do Redis ──────────────────────────────────────────────
let redisHealthy = false;
let lastRedisAlertTime = 0;
const ALERT_INTERVAL_MS = 5 * 60 * 1000; // alerta a cada 5 minutos em produção
function alertRedisDown(reason) {
    const now = Date.now();
    if (now - lastRedisAlertTime < ALERT_INTERVAL_MS)
        return;
    lastRedisAlertTime = now;
    if (IS_PROD) {
        // Em produção: log de erro visível — monitore com PM2 / Datadog / etc.
        console.error(`[Redis] ⚠️  ALERTA DE PRODUÇÃO: Redis indisponível (${reason}). ` +
            `Notificações WhatsApp estão PAUSADAS. Verifique o container redis na VPS.`);
    }
    else {
        console.warn(`[Redis] Conexão falhando localmente (${reason}). Notificações pausadas.`);
    }
}
// ─── Conexão Redis ─────────────────────────────────────────────────────────────
exports.connection = DISABLE_REDIS
    ? null
    : new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379', {
        maxRetriesPerRequest: null,
        showFriendlyErrorStack: false,
        lazyConnect: true,
        enableOfflineQueue: false,
        reconnectOnError: () => false,
    });
if (exports.connection) {
    exports.connection.on('ready', () => {
        redisHealthy = true;
        console.log('[Redis] ✅ Conectado com sucesso.');
    });
    exports.connection.on('error', (err) => {
        redisHealthy = false;
        const reason = err?.code || err?.message || 'erro desconhecido';
        alertRedisDown(reason);
    });
    exports.connection.on('close', () => {
        if (redisHealthy) {
            redisHealthy = false;
            alertRedisDown('conexão fechada');
        }
    });
}
// ─── Retorna status atual do Redis (usado em /health) ─────────────────────────
function isRedisHealthy() {
    return redisHealthy;
}
// ─── Nomes das filas ───────────────────────────────────────────────────────────
exports.QUEUE_NAMES = {
    WHATSAPP_NOTIFICATIONS: 'whatsapp-notifications',
};
// ─── Fila de notificações WhatsApp ────────────────────────────────────────────
exports.whatsappQueue = exports.connection
    ? new bullmq_1.Queue(exports.QUEUE_NAMES.WHATSAPP_NOTIFICATIONS, {
        connection: exports.connection,
        defaultJobOptions: {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
            removeOnComplete: true,
            removeOnFail: false,
        },
    })
    : {
        // Mock: Redis desabilitado via DISABLE_REDIS=true
        add: async (name, data) => {
            if (IS_PROD) {
                console.error(`[Queue] ⚠️  Redis desabilitado. Job "${name}" descartado. Notificação NÃO enviada.`);
            }
            else {
                console.warn(`[Queue Mock] Job "${name}" ignorado (Redis desabilitado).`);
            }
            return { id: 'mock-job-id' };
        },
        on: () => { },
    };
// ─── Eventos da fila ──────────────────────────────────────────────────────────
exports.whatsappQueueEvents = exports.connection
    ? new bullmq_1.QueueEvents(exports.QUEUE_NAMES.WHATSAPP_NOTIFICATIONS, { connection: exports.connection })
    : { on: () => { } };
let lastQueueErrorTime = 0;
const QUEUE_ERROR_LOG_INTERVAL = 60_000;
if (exports.connection) {
    exports.whatsappQueue.on('error', (err) => {
        const now = Date.now();
        const isConnRefused = err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED');
        if (isConnRefused) {
            if (now - lastQueueErrorTime > QUEUE_ERROR_LOG_INTERVAL) {
                alertRedisDown('ECONNREFUSED na fila');
                lastQueueErrorTime = now;
            }
        }
        else {
            console.error('[Queue Error]', err);
        }
    });
    exports.whatsappQueueEvents.on('completed', ({ jobId }) => {
        console.log(`[Queue] ✅ Job ${jobId} concluído.`);
    });
    exports.whatsappQueueEvents.on('failed', ({ jobId, failedReason }) => {
        console.error(`[Queue] ❌ Job ${jobId} falhou após todas as tentativas: ${failedReason}`);
    });
}
