import { Request, Response, NextFunction } from 'express'
import { createPhotoSchema, listPhotosQuerySchema } from './photos.schema'
import * as photosService from './photos.service'
import { AppError } from '../../shared/errors/AppError'
import { ERROR_CODES } from '../../shared/errors/error-codes'

export async function listPhotos(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = req.user?.schoolId
    if (!schoolId) {
      throw new AppError('Tenant ID is required', 400, ERROR_CODES.VALIDATION_ERROR)
    }

    const queryParsed = listPhotosQuerySchema.safeParse(req.query)
    if (!queryParsed.success) {
      return res.status(400).json({ error: queryParsed.error.format() })
    }

    const photos = await photosService.listPhotos(schoolId, queryParsed.data)
    return res.json(photos)
  } catch (error) {
    next(error)
  }
}

export async function createPhoto(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = req.user?.schoolId
    if (!schoolId) {
      throw new AppError('Tenant ID is required', 400, ERROR_CODES.VALIDATION_ERROR)
    }

    const bodyParsed = createPhotoSchema.safeParse(req.body)
    if (!bodyParsed.success) {
      return res.status(400).json({ error: bodyParsed.error.format() })
    }

    const photo = await photosService.createPhoto(schoolId, bodyParsed.data)
    return res.status(201).json(photo)
  } catch (error) {
    next(error)
  }
}

export async function deletePhoto(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = req.user?.schoolId
    if (!schoolId) {
      throw new AppError('Tenant ID is required', 400, ERROR_CODES.VALIDATION_ERROR)
    }

    const { id } = req.params
    const result = await photosService.deletePhoto(id, schoolId)
    return res.json(result)
  } catch (error) {
    next(error)
  }
}
