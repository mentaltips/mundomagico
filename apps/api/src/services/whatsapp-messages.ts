import { prisma } from '@mundo-magico/database'
import { connection, whatsappQueue } from './queue'

export type WhatsAppMessageType =
  | 'CHECKIN'
  | 'CHECKOUT'
  | 'INVOICE'
  | 'ANNOUNCEMENT'
  | 'DAILY_REPORT'
  | 'MANUAL'

export interface QueueWhatsAppMessageInput {
  schoolId: string
  to: string
  content: string
  type: WhatsAppMessageType
  recipientName?: string | null
}

export async function queueWhatsAppMessage(input: QueueWhatsAppMessageInput) {
  const message = await prisma.whatsAppMessage.create({
    data: {
      schoolId: input.schoolId,
      to: input.to,
      recipientName: input.recipientName,
      type: input.type,
      content: input.content,
      status: 'PENDING',
    },
  })

  try {
    if (!connection) {
      throw new Error('Fila WhatsApp indisponivel')
    }

    await whatsappQueue.add(
      'send-whatsapp-message',
      {
        messageId: message.id,
        to: input.to,
        textMessage: input.content,
        templateName: input.type,
        languageCode: 'pt_BR',
        components: [],
      },
      { jobId: message.id },
    )
  } catch (error: any) {
    await prisma.whatsAppMessage.update({
      where: { id: message.id },
      data: {
        status: 'FAILED',
        error: error?.message || 'Falha ao enfileirar mensagem WhatsApp',
      },
    })
    throw error
  }

  return message
}

export async function requeueWhatsAppMessage(messageId: string, schoolId: string) {
  const message = await prisma.whatsAppMessage.findFirst({
    where: {
      id: messageId,
      schoolId,
    },
  })

  if (!message) return null

  if (!['FAILED', 'CANCELLED'].includes(message.status)) {
    throw new Error('Apenas mensagens FAILED ou CANCELLED podem ser reenfileiradas')
  }

  if (!connection) {
    await prisma.whatsAppMessage.update({
      where: { id: message.id },
      data: {
        status: 'FAILED',
        error: 'Fila WhatsApp indisponivel',
      },
    })
    throw new Error('Fila WhatsApp indisponivel')
  }

  const updated = await prisma.whatsAppMessage.update({
    where: { id: message.id },
    data: {
      status: 'PENDING',
      error: null,
      sentAt: null,
    },
  })

  await whatsappQueue.add(
    'send-whatsapp-message',
    {
      messageId: updated.id,
      to: updated.to,
      textMessage: updated.content,
      templateName: updated.type,
      languageCode: 'pt_BR',
      components: [],
    },
    { jobId: `${updated.id}-${Date.now()}` },
  )

  return updated
}
