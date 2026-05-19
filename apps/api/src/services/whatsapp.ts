// ─────────────────────────────────────────
// Serviço de envio via WhatsApp (Baileys)
// ─────────────────────────────────────────

import type { DailyReportWhatsAppData } from '@mundo-magico/types'
import { buildWhatsAppMessage } from '@mundo-magico/types'
import makeWASocket, { useMultiFileAuthState, DisconnectReason, ConnectionState, WASocket } from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import pino from 'pino'
import QRCode from 'qrcode'
import fs from 'fs'
import path from 'path'

export class WhatsAppService {
  private sock: WASocket | null = null
  private qrBase64: string | null = null
  private connectionStatus: 'connecting' | 'connected' | 'disconnected' = 'connecting'
  private authFolder = path.join(process.cwd(), 'whatsapp-auth')

  constructor() {
    this.init()
  }

  private async init() {
    const { state, saveCreds } = await useMultiFileAuthState(this.authFolder)

    this.sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      logger: pino({ level: 'silent' }) as any,
      browser: ['Mundo Magico API', 'Chrome', '1.0.0']
    })

    this.sock.ev.on('creds.update', saveCreds)

    this.sock.ev.on('connection.update', async (update: Partial<ConnectionState>) => {
      const { connection, lastDisconnect, qr } = update

      if (qr) {
        this.qrBase64 = await QRCode.toDataURL(qr)
        this.connectionStatus = 'disconnected'
      }

      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut
        this.connectionStatus = 'disconnected'
        this.qrBase64 = null
        if (shouldReconnect) {
          console.log('[WhatsApp] Reconectando...')
          this.init()
        } else {
          console.log('[WhatsApp] Desconectado permanentemente (Logged Out). Limpando sessão.')
          fs.rmSync(this.authFolder, { recursive: true, force: true })
          this.init()
        }
      } else if (connection === 'open') {
        console.log('[WhatsApp] Conectado com sucesso!')
        this.connectionStatus = 'connected'
        this.qrBase64 = null
      }
    })
  }

  public getStatus() {
    return {
      status: this.connectionStatus,
      qr: this.qrBase64
    }
  }

  public async logout() {
    if (this.sock) {
      await this.sock.logout()
    }
    fs.rmSync(this.authFolder, { recursive: true, force: true })
    this.init()
  }

  private formatPhone(phone: string): string {
    let clean = phone.replace(/\D/g, '')
    // Se tiver 10 ou 11 digitos, assume que é BR
    if (clean.length === 10 || clean.length === 11) {
      clean = '55' + clean
    }
    return clean + '@s.whatsapp.net'
  }

  async sendTextMessage(to: string, text: string): Promise<boolean> {
    if (this.connectionStatus !== 'connected' || !this.sock) {
      console.warn('[WhatsApp] Mensagem não enviada: WhatsApp não está conectado.')
      return false
    }

    try {
      await this.sock.sendMessage(this.formatPhone(to), { text })
      return true
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

  async sendInvoiceNotification(
    guardianPhone: string,
    guardianName: string,
    amount: string,
    dueDate: string,
    description: string,
    paymentLink: string
  ): Promise<boolean> {
    const message = [
      `Olá, *${guardianName}*! 👋`,
      ``,
      `A fatura de *${description}* já está disponível.`,
      ``,
      `💰 *Valor:* R$ ${amount}`,
      `📅 *Vencimento:* ${dueDate}`,
      ``,
      `Você pode realizar o pagamento através do link abaixo:`,
      `🔗 ${paymentLink}`,
      ``,
      `Obrigado! 🙏`
    ].join('\n')
    return this.sendTextMessage(guardianPhone, message)
  }
}

// Singleton global
export const whatsappService = new WhatsAppService()

// Factory para manter compatibilidade com o código anterior
export function createWhatsAppService(): WhatsAppService {
  return whatsappService
}
