"use strict";
// ─────────────────────────────────────────
// Serviço de envio via WhatsApp
// Compatível com API do WhatsApp Business (Meta)
// ─────────────────────────────────────────
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppService = void 0;
exports.createWhatsAppService = createWhatsAppService;
const types_1 = require("@mundo-magico/types");
class WhatsAppService {
    config;
    constructor(config) {
        this.config = config;
    }
    async sendTextMessage(to, text) {
        try {
            const res = await fetch(`https://graph.facebook.com/v19.0/${this.config.phoneNumberId}/messages`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.config.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    to: to.replace(/\D/g, ''),
                    type: 'text',
                    text: { body: text },
                }),
            });
            return res.ok;
        }
        catch (err) {
            console.error('[WhatsApp] Erro ao enviar mensagem:', err);
            return false;
        }
    }
    async sendDailyReport(guardianPhone, data) {
        const message = (0, types_1.buildWhatsAppMessage)(data);
        return this.sendTextMessage(guardianPhone, message);
    }
    async sendItemReplenishmentRequest(guardianPhone, childName, schoolName, items) {
        const message = [
            `Olá! 👋`,
            ``,
            `O item *${items.join(', ')}* de *${childName}* está acabando.`,
            `Por favor, envie reposição na próxima ida à *${schoolName}*.`,
            ``,
            `Obrigado! 🙏`,
        ].join('\n');
        return this.sendTextMessage(guardianPhone, message);
    }
    async sendCheckInNotification(guardianPhone, childName, schoolName, time, broughtBy) {
        const message = `✅ *${childName}* chegou à *${schoolName}* às *${time}* com ${broughtBy}. Bom dia!`;
        return this.sendTextMessage(guardianPhone, message);
    }
    async sendCheckOutNotification(guardianPhone, childName, schoolName, time, pickedUpBy) {
        const message = `👋 *${childName}* saiu da *${schoolName}* às *${time}* com ${pickedUpBy}. Até amanhã!`;
        return this.sendTextMessage(guardianPhone, message);
    }
}
exports.WhatsAppService = WhatsAppService;
function createWhatsAppService(config) {
    const token = config?.token ?? process.env.WHATSAPP_API_TOKEN;
    const phoneNumberId = config?.phoneNumberId ?? process.env.WHATSAPP_PHONE_NUMBER_ID;
    if (!token || !phoneNumberId) {
        console.warn('[WhatsApp] Serviço não configurado. Configure WHATSAPP_API_TOKEN e WHATSAPP_PHONE_NUMBER_ID.');
        return null;
    }
    return new WhatsAppService({ token, phoneNumberId });
}
