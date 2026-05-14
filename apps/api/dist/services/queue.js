"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.whatsappQueueEvents = exports.whatsappQueue = exports.QUEUE_NAMES = exports.connection = void 0;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const DISABLE_REDIS = process.env.DISABLE_REDIS === 'true';
// Configuração do Redis
exports.connection = DISABLE_REDIS ? null : new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
    showFriendlyErrorStack: false,
    lazyConnect: true,
    enableOfflineQueue: false, // Don't queue commands if redis is down
    reconnectOnError: (err) => {
        return false; // Don't reconnect on specific errors
    }
});
// Prevent unhandled promise rejections and clean up terminal
if (exports.connection) {
    exports.connection.on('error', (err) => {
        // Silent error during development
        if (process.env.NODE_ENV !== 'production') {
            // Just a tiny log every minute to avoid flood
            const now = Date.now();
            if (!global.lastRedisErrorLog || now - global.lastRedisErrorLog > 60000) {
                console.warn('[Redis] Connection failing (Redis not running locally). Background tasks paused.');
                global.lastRedisErrorLog = now;
            }
        }
    });
}
exports.QUEUE_NAMES = {
    WHATSAPP_NOTIFICATIONS: 'whatsapp-notifications',
};
// Criação da Fila
exports.whatsappQueue = exports.connection ? new bullmq_1.Queue(exports.QUEUE_NAMES.WHATSAPP_NOTIFICATIONS, {
    connection: exports.connection,
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
    add: async (name, data) => {
        console.log(`[Queue Mock] Job ${name} added with data:`, data);
        return { id: 'mock-job-id' };
    },
    on: () => { },
};
// Eventos da Fila (Opcional, para monitoramento local)
exports.whatsappQueueEvents = exports.connection ? new bullmq_1.QueueEvents(exports.QUEUE_NAMES.WHATSAPP_NOTIFICATIONS, {
    connection: exports.connection,
}) : { on: () => { } };
let lastQueueErrorTime = 0;
const QUEUE_ERROR_LOG_INTERVAL = 60000;
if (exports.connection) {
    exports.whatsappQueue.on('error', (err) => {
        const now = Date.now();
        if (err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED')) {
            if (now - lastQueueErrorTime > QUEUE_ERROR_LOG_INTERVAL) {
                console.warn('[Queue] Redis connection refused. System will continue mas background tasks are paused.');
                lastQueueErrorTime = now;
            }
        }
        else {
            console.error('[Queue Error]', err);
        }
    });
    exports.whatsappQueueEvents.on('completed', ({ jobId }) => {
        console.log(`[Queue] Job ${jobId} completed.`);
    });
    exports.whatsappQueueEvents.on('failed', ({ jobId, failedReason }) => {
        console.error(`[Queue] Job ${jobId} failed: ${failedReason}`);
    });
}
