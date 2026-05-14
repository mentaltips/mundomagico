"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.whatsappWorker = void 0;
const bullmq_1 = require("bullmq");
const queue_1 = require("../services/queue");
const whatsapp_1 = require("../services/whatsapp");
exports.whatsappWorker = queue_1.connection ? new bullmq_1.Worker(queue_1.QUEUE_NAMES.WHATSAPP_NOTIFICATIONS, async (job) => {
    const { to, templateName, languageCode, components, textMessage } = job.data;
    console.log(`[Worker] Processando mensagem WhatsApp para: ${to} (Template: ${templateName})`);
    const whatsapp = (0, whatsapp_1.createWhatsAppService)();
    if (whatsapp) {
        if (textMessage) {
            // Mensagem de texto direta (ex: check-in, check-out, reposição de itens)
            await whatsapp.sendTextMessage(to, textMessage);
        }
        else {
            // Quando não há textMessage, loga aviso — integração de templates
            // requer configuração do template na conta Meta Business
            console.warn(`[Worker] Template "${templateName}" sem textMessage definido. Verifique o payload do job.`);
        }
    }
    else {
        console.warn(`[Worker] WhatsApp service desabilitado. Configure WHATSAPP_API_TOKEN e WHATSAPP_PHONE_NUMBER_ID.`);
    }
    return { success: true };
}, {
    connection: queue_1.connection,
    concurrency: 5,
}) : null;
let lastErrorTime = 0;
const ERROR_LOG_INTERVAL = 60000; // Log only once per minute
if (exports.whatsappWorker) {
    exports.whatsappWorker.on('error', (err) => {
        const now = Date.now();
        if (err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED')) {
            if (now - lastErrorTime > ERROR_LOG_INTERVAL) {
                console.warn('[Worker] Redis connection refused. Notifications will be queued but not sent until Redis is running.');
                lastErrorTime = now;
            }
        }
        else {
            console.error('[Worker Error]', err);
        }
    });
}
