import { AppError } from '../../shared/errors/AppError'
import { ERROR_CODES } from '../../shared/errors/error-codes'
import * as announcementsRepository from './announcements.repository'
import { queueWhatsAppMessage } from '../../services/whatsapp-messages'
import type { CreateAnnouncementInput, UpdateAnnouncementInput } from './announcements.schema'

export async function listAnnouncements(schoolId: string) {
  return announcementsRepository.findMany(schoolId)
}

export async function createAnnouncement(
  schoolId: string,
  input: CreateAnnouncementInput,
  canSendWhatsapp: boolean
) {
  if (input.sendWhatsApp && !canSendWhatsapp) {
    throw new AppError('Acesso negado para envio de WhatsApp', 403, ERROR_CODES.FORBIDDEN)
  }

  if (input.groupId) {
    const groupIsValid = await announcementsRepository.verifyGroup(input.groupId, schoolId)
    if (!groupIsValid) {
      throw new AppError('Turma nao encontrada', 404, ERROR_CODES.NOT_FOUND)
    }
  }

  const { sendWhatsApp, sentAt, ...rest } = input
  const announcement = await announcementsRepository.create({
    ...rest,
    schoolId,
    ...(sentAt && { sentAt: new Date(sentAt) }),
  })

  let queuedWhatsAppMessages = 0

  if (sendWhatsApp) {
    const [children, students] = await announcementsRepository.findRecipients(
      schoolId,
      input.groupId || undefined
    )

    const recipients = new Map<string, string | null>()
    const allGuardians = [
      ...children.flatMap((child) => child.guardians.map((g) => g.guardian)),
      ...students.flatMap((student) => student.guardians.map((g) => g.guardian)),
    ]

    allGuardians.forEach((guardian) => {
      if (guardian?.phone && !recipients.has(guardian.phone)) {
        recipients.set(guardian.phone, guardian.fullName)
      }
    })

    const message = `COMUNICADO: ${announcement.title}\n\n${announcement.content}\n\n_Enviado por Mundo Magico_`

    for (const [phone, recipientName] of recipients) {
      await queueWhatsAppMessage({
        schoolId,
        to: phone,
        recipientName,
        type: 'ANNOUNCEMENT',
        content: message,
      })
      queuedWhatsAppMessages++
    }
  }

  return { ...announcement, queuedWhatsAppMessages }
}

export async function updateAnnouncement(
  id: string,
  schoolId: string,
  input: UpdateAnnouncementInput
) {
  if (input.groupId) {
    const groupIsValid = await announcementsRepository.verifyGroup(input.groupId, schoolId)
    if (!groupIsValid) {
      throw new AppError('Turma nao encontrada', 404, ERROR_CODES.NOT_FOUND)
    }
  }

  const { sentAt, ...rest } = input
  const result = await announcementsRepository.update(id, schoolId, {
    ...rest,
    ...(sentAt && { sentAt: new Date(sentAt) }),
  })

  if (result.count === 0) {
    throw new AppError('Comunicado nao encontrado', 404, ERROR_CODES.NOT_FOUND)
  }

  return announcementsRepository.findFirst(id, schoolId)
}

export async function archiveAnnouncement(id: string, schoolId: string) {
  const result = await announcementsRepository.softDelete(id, schoolId)
  if (result.count === 0) {
    throw new AppError('Comunicado nao encontrado', 404, ERROR_CODES.NOT_FOUND)
  }
  return { success: true }
}
