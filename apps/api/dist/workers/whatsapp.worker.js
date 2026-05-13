"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.whatsappWorker = void 0;
const bullmq_1 = require("bullmq");
const queue_1 = require("../services/queue");
const whatsapp_1 = require("../services/whatsapp");
exports.whatsappWorker = new bullmq_1.Worker(queue_1.QUEUE_NAMES.WHATSAPP_NOTIFICATIONS, async (job) => {
    const { to, templateName, languageCode, components } = job.data;
    console.log(`[Worker] Processando mensagem WhatsApp para: ${to} (Template: ${templateName})`);
    const whatsapp = (0, whatsapp_1.createWhatsAppService)();
    if (whatsapp) {
        // Simplification: treating templateName as text for now
        await whatsapp.sendTextMessage(to, templateName);
    }
    else {
        console.warn(`[Worker] WhatsApp service is disabled. Fake sending to ${to}`);
    }
    return { success: true };
}, {
    connection: queue_1.connection,
    concurrency: 5,
});
exports.whatsappWorker.on('error', (err) => {
    console.error('[Worker Error]', err);
});
