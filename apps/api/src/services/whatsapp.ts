// ─────────────────────────────────────────
// Serviço de envio via WhatsApp (Baileys) - Multi-Sessão
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

export interface WhatsAppSession {
  sock: WASocket | null
  qrBase64: string | null
  connectionStatus: 'connecting' | 'connected' | 'disconnected'
  reconnectAttempts: number
  reconnectTimeout: NodeJS.Timeout | null
  authFolder: string
}

export class WhatsAppService {
  private sessions = new Map<string, WhatsAppSession>()
  private readonly MAX_RECONNECT_DELAY = 30_000 // 30s

  constructor() {
    // Sockets are dynamically/lazily initialized per school on demand
  }

  private getOrCreateSession(schoolId: string): WhatsAppSession {
    let session = this.sessions.get(schoolId)
    if (!session) {
      const authFolder = path.join(process.cwd(), 'whatsapp-auth', schoolId)
      session = {
        sock: null,
        qrBase64: null,
        connectionStatus: 'disconnected',
        reconnectAttempts: 0,
        reconnectTimeout: null,
        authFolder,
      }
      this.sessions.set(schoolId, session)
      this.initSession(schoolId, session)
    }
    return session
  }

  private scheduleReconnect(schoolId: string, session: WhatsAppSession) {
    if (session.reconnectTimeout) clearTimeout(session.reconnectTimeout)
    
    // Exponential backoff: 2s, 4s, 8s, ..., max 30s
    const delay = Math.min(2000 * Math.pow(2, session.reconnectAttempts), this.MAX_RECONNECT_DELAY)
    session.reconnectAttempts++
    console.log(`[WhatsApp - School: ${schoolId}] Reconectando em ${delay / 1000}s (tentativa ${session.reconnectAttempts})...`)
    session.reconnectTimeout = setTimeout(() => this.initSession(schoolId, session), delay)
  }

  private async initSession(schoolId: string, session: WhatsAppSession) {
    try {
      // Garante que a pasta de auth existe
      if (!fs.existsSync(session.authFolder)) {
        fs.mkdirSync(session.authFolder, { recursive: true })
      }

      const { state, saveCreds } = await useMultiFileAuthState(session.authFolder)
      const { version } = await fetchLatestBaileysVersion()

      session.sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false, // Do not flood stdout/terminal in multi-tenant mode
        logger: pino({ level: 'silent' }) as any,
        browser: [`Mundo Mágico (${schoolId})`, 'Chrome', '114.0.0'],
        connectTimeoutMs: 60_000,
        keepAliveIntervalMs: 30_000,
      })

      session.sock.ev.on('creds.update', saveCreds)

      session.sock.ev.on('connection.update', async (update: Partial<ConnectionState>) => {
        const { connection, lastDisconnect, qr } = update

        if (qr) {
          console.log(`[WhatsApp - School: ${schoolId}] QR Code gerado — acesse o painel admin para escanear.`)
          session.qrBase64 = await QRCode.toDataURL(qr)
          session.connectionStatus = 'disconnected'
        }

        if (connection === 'close') {
          const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode
          const loggedOut = statusCode === DisconnectReason.loggedOut
          session.connectionStatus = 'disconnected'

          if (loggedOut) {
            console.log(`[WhatsApp - School: ${schoolId}] Sessão encerrada (Logout). Limpando credenciais...`)
            try {
              fs.rmSync(session.authFolder, { recursive: true, force: true })
            } catch (_) {}
            session.reconnectAttempts = 0
            session.qrBase64 = null
            this.initSession(schoolId, session)
          } else {
            session.qrBase64 = null
            this.scheduleReconnect(schoolId, session)
          }
        } else if (connection === 'open') {
          console.log(`[WhatsApp - School: ${schoolId}] ✅ Conectado com sucesso!`)
          session.connectionStatus = 'connected'
          session.qrBase64 = null
          session.reconnectAttempts = 0
          if (session.reconnectTimeout) {
            clearTimeout(session.reconnectTimeout)
            session.reconnectTimeout = null
          }
        } else if (connection === 'connecting') {
          console.log(`[WhatsApp - School: ${schoolId}] Conectando ao servidor...`)
          session.connectionStatus = 'connecting'
        }
      })
    } catch (err) {
      console.error(`[WhatsApp - School: ${schoolId}] Erro ao inicializar sessão:`, err)
      session.connectionStatus = 'disconnected'
      this.scheduleReconnect(schoolId, session)
    }
  }

  public getStatus(schoolId: string) {
    const session = this.getOrCreateSession(schoolId)
    return {
      status: session.connectionStatus,
      qr: session.qrBase64
    }
  }

  public async logout(schoolId: string) {
    const session = this.sessions.get(schoolId)
    if (!session) return

    if (session.reconnectTimeout) {
      clearTimeout(session.reconnectTimeout)
      session.reconnectTimeout = null
    }
    if (session.sock) {
      try {
        await session.sock.logout()
      } catch (_) {
        // ignora erros ao fazer logout
      }
    }
    try {
      fs.rmSync(session.authFolder, { recursive: true, force: true })
    } catch (_) {}
    session.reconnectAttempts = 0
    session.qrBase64 = null
    session.connectionStatus = 'disconnected'
    this.initSession(schoolId, session)
  }

  private formatPhone(phone: string): string {
    let clean = phone.replace(/\D/g, '')
    if (clean.length === 10 || clean.length === 11) {
      clean = '55' + clean
    }
    return clean + '@s.whatsapp.net'
  }

  async sendTextMessage(schoolId: string, to: string, text: string): Promise<boolean> {
    const session = this.getOrCreateSession(schoolId)
    if (session.connectionStatus !== 'connected' || !session.sock) {
      console.warn(`[WhatsApp - School: ${schoolId}] Mensagem não enviada: WhatsApp não está conectado.`)
      return false
    }

    try {
      await session.sock.sendMessage(this.formatPhone(to), { text })
      return true
    } catch (err) {
      console.error(`[WhatsApp - School: ${schoolId}] Erro ao enviar mensagem:`, err)
      return false
    }
  }

  async sendDailyReport(
    schoolId: string,
    guardianPhone: string,
    data: DailyReportWhatsAppData
  ): Promise<boolean> {
    const message = buildWhatsAppMessage(data)
    return this.sendTextMessage(schoolId, guardianPhone, message)
  }

  async sendItemReplenishmentRequest(
    schoolId: string,
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
    return this.sendTextMessage(schoolId, guardianPhone, message)
  }

  async sendCheckInNotification(
    schoolId: string,
    guardianPhone: string,
    childName: string,
    time: string
  ): Promise<boolean> {
    const message = [
      `✅ *${childName}* chegou à escola!`,
      `Horário: ${time}`,
    ].join('\n')
    return this.sendTextMessage(schoolId, guardianPhone, message)
  }

  async sendCheckOutNotification(
    schoolId: string,
    guardianPhone: string,
    childName: string,
    time: string
  ): Promise<boolean> {
    const message = [
      `🏠 *${childName}* saiu da escola!`,
      `Horário: ${time}`,
    ].join('\n')
    return this.sendTextMessage(schoolId, guardianPhone, message)
  }
}

export const whatsappService = new WhatsAppService()

export function createWhatsAppService(config?: { token?: string | null; phoneNumberId?: string | null }) {
  return whatsappService
}
