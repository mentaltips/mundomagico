// ─────────────────────────────────────────
// Serviço de envio via WhatsApp (Baileys)
// ─────────────────────────────────────────

import type { DailyReportWhatsAppData } from '@mundo-magico/types'
import { buildWhatsAppMessage } from '@mundo-magico/types'
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  ConnectionState,
  WASocket,
  fetchLatestBaileysVersion
} from '@whiskeysockets/baileys'
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
  private reconnectAttempts = 0
  private readonly MAX_RECONNECT_DELAY = 30_000 // 30s
  private reconnectTimeout: NodeJS.Timeout | null = null

  constructor() {
    this.init()
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout)
    // Exponential backoff: 2s, 4s, 8s, ..., max 30s
    const delay = Math.min(2000 * Math.pow(2, this.reconnectAttempts), this.MAX_RECONNECT_DELAY)
    this.reconnectAttempts++
    console.log(`[WhatsApp] Reconectando em ${delay / 1000}s (tentativa ${this.reconnectAttempts})...`)
    this.reconnectTimeout = setTimeout(() => this.init(), delay)
  }

  private async init() {
    // Garante que a pasta de auth existe
    if (!fs.existsSync(this.authFolder)) {
      fs.mkdirSync(this.authFolder, { recursive: true })
    }

    const { state, saveCreds } = await useMultiFileAuthState(this.authFolder)
    const { version } = await fetchLatestBaileysVersion()

    this.sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: true,
      logger: pino({ level: 'silent' }) as any,
      browser: ['Mundo Magico', 'Chrome', '114.0.0'],
      connectTimeoutMs: 60_000,
      keepAliveIntervalMs: 30_000,
    })

    this.sock.ev.on('creds.update', saveCreds)

    this.sock.ev.on('connection.update', async (update: Partial<ConnectionState>) => {
      const { connection, lastDisconnect, qr } = update

      if (qr) {
        console.log('[WhatsApp] QR Code gerado — acesse o painel admin para escanear.')
        this.qrBase64 = await QRCode.toDataURL(qr)
        this.connectionStatus = 'disconnected'
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode
        const loggedOut = statusCode === DisconnectReason.loggedOut
        this.connectionStatus = 'disconnected'

        if (loggedOut) {
          console.log('[WhatsApp] Sessão encerrada (Logout). Limpando credenciais...')
          fs.rmSync(this.authFolder, { recursive: true, force: true })
          this.reconnectAttempts = 0
          this.qrBase64 = null
          this.init()
        } else {
          this.qrBase64 = null
          this.scheduleReconnect()
        }
      } else if (connection === 'open') {
        console.log('[WhatsApp] ✅ Conectado com sucesso!')
        this.connectionStatus = 'connected'
        this.qrBase64 = null
        this.reconnectAttempts = 0
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout)
          this.reconnectTimeout = null
        }
      } else if (connection === 'connecting') {
        console.log('[WhatsApp] Conectando ao servidor...')
        this.connectionStatus = 'connecting'
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
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
    if (this.sock) {
      try {
        await this.sock.logout()
      } catch (_) {
        // ignora erros ao fazer logout
      }
    }
    fs.rmSync(this.authFolder, { recursive: true, force: true })
    this.reconnectAttempts = 0
    this.qrBase64 = null
    this.connectionStatus = 'disconnected'
    this.init()
  }

  private formatPhone(phone: string): string {
    let clean = phone.replace(/\D/g, '')
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
    time: string
  ): Promise<boolean> {
    const message = [
      `✅ *${childName}* chegou à escola!`,
      `Horário: ${time}`,
    ].join('\n')
    return this.sendTextMessage(guardianPhone, message)
  }

  async sendCheckOutNotification(
    guardianPhone: string,
    childName: string,
    time: string
  ): Promise<boolean> {
    const message = [
      `🏠 *${childName}* saiu da escola!`,
      `Horário: ${time}`,
    ].join('\n')
    return this.sendTextMessage(guardianPhone, message)
  }
}

export const whatsappService = new WhatsAppService()

export function createWhatsAppService(config?: { token?: string | null; phoneNumberId?: string | null }) {
  return whatsappService
}
