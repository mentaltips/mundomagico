// ─────────────────────────────────────────
// Serviço de envio via WhatsApp
// Compatível com API do WhatsApp Business (Meta)
// ─────────────────────────────────────────

import type { DailyReportWhatsAppData } from '@mundo-magico/types'
import { buildWhatsAppMessage } from '@mundo-magico/types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface WhatsAppConfig {
  token: string
  phoneNumberId: string
}

export class WhatsAppService {
  constructor(private config: WhatsAppConfig) {}

  async sendTextMessage(to: string, text: string): Promise<boolean> {
    try {
      const res = await fetch(
        `https://graph.facebook.com/v19.0/${this.config.phoneNumberId}/messages`,
        {
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
        }
      )
      return res.ok
    } catch (err) {
      console.error('[WhatsApp] Erro ao enviar mensagem:', err)
      return false
    }
  }

  async sendDailyReport(
    guardianPhone: string,
    data: DailyReportWhatsAppData
  ): Promise<boolean> {
    const message = buildWhatsAppMessage(data)
    return this.sendTextMessage(guardianPhone, message)
  }

  async sendItemReplenishmentRequest(
    guardianPhone: string,
    childName: string,
    schoolName: string,
    items: string[]
  ): Promise<boolean> {
    const message = [
      `Olá! 👋`,
      ``,
      `O item *${items.join(', ')}* de *${childName}* está acabando.`,
      `Por favor, envie reposição na próxima ida à *${schoolName}*.`,
      ``,
      `Obrigado! 🙏`,
    ].join('\n')
    return this.sendTextMessage(guardianPhone, message)
  }

  async sendCheckInNotification(
    guardianPhone: string,
    childName: string,
    schoolName: string,
    time: string,
    broughtBy: string
  ): Promise<boolean> {
    const message = `✅ *${childName}* chegou à *${schoolName}* às *${time}* com ${broughtBy}. Bom dia!`
    return this.sendTextMessage(guardianPhone, message)
  }

  async sendCheckOutNotification(
    guardianPhone: string,
    childName: string,
    schoolName: string,
    time: string,
    pickedUpBy: string
  ): Promise<boolean> {
    const message = `👋 *${childName}* saiu da *${schoolName}* às *${time}* com ${pickedUpBy}. Até amanhã!`
    return this.sendTextMessage(guardianPhone, message)
  }
}

export function createWhatsAppService(config?: { token?: string | null; phoneNumberId?: string | null }): WhatsAppService | null {
  const token = config?.token ?? process.env.WHATSAPP_API_TOKEN
  const phoneNumberId = config?.phoneNumberId ?? process.env.WHATSAPP_PHONE_NUMBER_ID

  if (!token || !phoneNumberId) {
    console.warn('[WhatsApp] Serviço não configurado. Configure WHATSAPP_API_TOKEN e WHATSAPP_PHONE_NUMBER_ID.')
    return null
  }

  return new WhatsAppService({ token, phoneNumberId })
}
