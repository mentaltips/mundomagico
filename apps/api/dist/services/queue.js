"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connection = exports.whatsappQueueEvents = exports.whatsappQueue = exports.QUEUE_NAMES = void 0;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
// Configuração do Redis
const connection = new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
});
exports.connection = connection;
exports.QUEUE_NAMES = {
    WHATSAPP_NOTIFICATIONS: 'whatsapp-notifications',
};
// Criação da Fila
exports.whatsappQueue = new bullmq_1.Queue(exports.QUEUE_NAMES.WHATSAPP_NOTIFICATIONS, {
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
});
// Eventos da Fila (Opcional, para monitoramento local)
exports.whatsappQueueEvents = new bullmq_1.QueueEvents(exports.QUEUE_NAMES.WHATSAPP_NOTIFICATIONS, {
    connection,
});
exports.whatsappQueueEvents.on('completed', ({ jobId }) => {
    console.log(`[Queue] Job ${jobId} completed.`);
});
exports.whatsappQueueEvents.on('failed', ({ jobId, failedReason }) => {
    console.error(`[Queue] Job ${jobId} failed: ${failedReason}`);
});
