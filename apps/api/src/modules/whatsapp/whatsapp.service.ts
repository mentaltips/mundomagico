import { AppError } from '../../shared/errors/AppError'
import { ERROR_CODES } from '../../shared/errors/error-codes'
import { whatsappService } from '../../services/whatsapp'
import { queueWhatsAppMessage, requeueWhatsAppMessage } from '../../services/whatsapp-messages'
import type { BroadcastInput, ListMessagesQuery } from './whatsapp.schema'
import * as whatsappRepository from './whatsapp.repository'

export function getConnectionStatus(schoolId: string) {
  return whatsappService.getStatus(schoolId)
}

export async function logout(schoolId: string) {
  await whatsappService.logout(schoolId)
}

export function listMessages(schoolId: string, query: ListMessagesQuery) {
  return whatsappRepository.listMessages(schoolId, query)
}

export async function getMessage(schoolId: string, id: string) {
  const message = await whatsappRepository.findMessageById(schoolId, id)
  if (!message) {
    throw new AppError('Mensagem WhatsApp nao encontrada', 404, ERROR_CODES.NOT_FOUND)
  }
  return message
}

export async function retryMessage(schoolId: string, id: string) {
  const message = await requeueWhatsAppMessage(id, schoolId)
  if (!message) {
    throw new AppError('Mensagem WhatsApp nao encontrada', 404, ERROR_CODES.NOT_FOUND)
  }
  return message
}

export async function cancelMessage(schoolId: string, id: string) {
  const message = await getMessage(schoolId, id)

  if (!['PENDING', 'FAILED'].includes(message.status)) {
    throw new AppError('Apenas mensagens PENDING ou FAILED podem ser canceladas', 400, ERROR_CODES.VALIDATION_ERROR)
  }

  return whatsappRepository.cancelMessage(message.id)
}

export async function broadcast(schoolId: string, input: BroadcastInput) {
  const children = await whatsappRepository.findActiveChildrenWithGuardians(schoolId, input.targetStatus)

  let queuedCount = 0
  let skippedCount = 0

  for (const child of children) {
    const guardian = child.guardians?.[0]?.guardian
    if (!guardian?.phone) {
      skippedCount++
      continue
    }

    const guardianName = guardian.fullName.split(' ')[0] || 'Responsavel'
    const studentName = child.fullName
    const studentStatus = child.status === 'PENDENTE_PAGAMENTO' ? 'Pendente de Pagamento' :
                          child.status === 'AGUARDANDO_VAGA' ? 'Aguardando Vaga' :
                          child.status === 'ATIVO' ? 'Ativo' :
                          child.status === 'ADAPTACAO' ? 'Em Adaptacao' : 'Inativo'

    const formattedText = input.message
      .replace(/{{nome_responsavel}}/g, guardianName)
      .replace(/{{nome_aluno}}/g, studentName)
      .replace(/{{status_aluno}}/g, studentStatus)
      .replace(/{{escola}}/g, 'Escola Mundo Magico')

    await queueWhatsAppMessage({
      schoolId,
      to: guardian.phone,
      recipientName: guardian.fullName,
      type: 'MANUAL',
      content: formattedText,
    })
    queuedCount++
  }

  return {
    message: 'Broadcast enfileirado.',
    total: children.length,
    queued: queuedCount,
    skipped: skippedCount,
  }
}

