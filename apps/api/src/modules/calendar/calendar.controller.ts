import { Request, Response, NextFunction } from 'express'
import { createEventSchema, updateEventSchema, listEventsQuerySchema } from './calendar.schema'
import * as calendarService from './calendar.service'
import { AppError } from '../../shared/errors/AppError'
import { ERROR_CODES } from '../../shared/errors/error-codes'

export async function listEvents(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = req.user?.schoolId
    if (!schoolId) {
      throw new AppError('Tenant ID is required', 400, ERROR_CODES.VALIDATION_ERROR)
    }

    const queryParsed = listEventsQuerySchema.safeParse(req.query)
    if (!queryParsed.success) {
      return res.status(400).json({ error: queryParsed.error.format() })
    }

    const events = await calendarService.listEvents(schoolId, queryParsed.data)
    return res.json(events)
  } catch (error) {
    next(error)
  }
}

export async function createEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = req.user?.schoolId
    if (!schoolId) {
      throw new AppError('Tenant ID is required', 400, ERROR_CODES.VALIDATION_ERROR)
    }

    const bodyParsed = createEventSchema.safeParse(req.body)
    if (!bodyParsed.success) {
      return res.status(400).json({ error: bodyParsed.error.format() })
    }

    const event = await calendarService.createEvent(schoolId, bodyParsed.data)
    return res.status(201).json(event)
  } catch (error) {
    next(error)
  }
}

export async function updateEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = req.user?.schoolId
    if (!schoolId) {
      throw new AppError('Tenant ID is required', 400, ERROR_CODES.VALIDATION_ERROR)
    }

    const bodyParsed = updateEventSchema.safeParse(req.body)
    if (!bodyParsed.success) {
      return res.status(400).json({ error: bodyParsed.error.format() })
    }

    const { id } = req.params
    const event = await calendarService.updateEvent(id, schoolId, bodyParsed.data)
    return res.json(event)
  } catch (error) {
    next(error)
  }
}

export async function deleteEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = req.user?.schoolId
    if (!schoolId) {
      throw new AppError('Tenant ID is required', 400, ERROR_CODES.VALIDATION_ERROR)
    }

    const { id } = req.params
    const result = await calendarService.deleteEvent(id, schoolId)
    return res.json(result)
  } catch (error) {
    next(error)
  }
}
