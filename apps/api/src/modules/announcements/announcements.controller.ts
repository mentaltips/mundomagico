import { Request, Response, NextFunction } from 'express'
import { createAnnouncementSchema, updateAnnouncementSchema } from './announcements.schema'
import * as announcementsService from './announcements.service'
import { AppError } from '../../shared/errors/AppError'
import { ERROR_CODES } from '../../shared/errors/error-codes'
import { hasPermission } from '../../shared/middlewares/permissions.middleware'

export async function listAnnouncements(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = req.user?.schoolId
    if (!schoolId) {
      throw new AppError('Tenant ID is required', 400, ERROR_CODES.VALIDATION_ERROR)
    }

    const announcements = await announcementsService.listAnnouncements(schoolId)
    return res.json(announcements)
  } catch (error) {
    next(error)
  }
}

export async function createAnnouncement(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = req.user?.schoolId
    if (!schoolId) {
      throw new AppError('Tenant ID is required', 400, ERROR_CODES.VALIDATION_ERROR)
    }

    const bodyParsed = createAnnouncementSchema.safeParse(req.body)
    if (!bodyParsed.success) {
      return res.status(400).json({ error: bodyParsed.error.format() })
    }

    const canSendWhatsapp = hasPermission(req.user?.role, 'canSendWhatsapp')
    const result = await announcementsService.createAnnouncement(
      schoolId,
      bodyParsed.data,
      canSendWhatsapp
    )
    return res.status(201).json(result)
  } catch (error) {
    next(error)
  }
}

export async function updateAnnouncement(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = req.user?.schoolId
    if (!schoolId) {
      throw new AppError('Tenant ID is required', 400, ERROR_CODES.VALIDATION_ERROR)
    }

    const bodyParsed = updateAnnouncementSchema.safeParse(req.body)
    if (!bodyParsed.success) {
      return res.status(400).json({ error: bodyParsed.error.format() })
    }

    const { id } = req.params
    const announcement = await announcementsService.updateAnnouncement(id, schoolId, bodyParsed.data)
    return res.json(announcement)
  } catch (error) {
    next(error)
  }
}

export async function deleteAnnouncement(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = req.user?.schoolId
    if (!schoolId) {
      throw new AppError('Tenant ID is required', 400, ERROR_CODES.VALIDATION_ERROR)
    }

    const { id } = req.params
    const result = await announcementsService.archiveAnnouncement(id, schoolId)
    return res.json(result)
  } catch (error) {
    next(error)
  }
}
