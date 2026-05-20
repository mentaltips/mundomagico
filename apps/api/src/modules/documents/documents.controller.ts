import { Request, Response, NextFunction } from 'express'
import { createDocumentSchema } from './documents.schema'
import * as documentsService from './documents.service'
import { AppError } from '../../shared/errors/AppError'
import { ERROR_CODES } from '../../shared/errors/error-codes'

export async function getDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = req.user?.schoolId
    if (!schoolId) {
      throw new AppError('Tenant ID is required', 400, ERROR_CODES.VALIDATION_ERROR)
    }

    const { id } = req.params
    const document = await documentsService.getDocumentById(id, schoolId)
    return res.json(document)
  } catch (error) {
    next(error)
  }
}

export async function createDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = req.user?.schoolId
    if (!schoolId) {
      throw new AppError('Tenant ID is required', 400, ERROR_CODES.VALIDATION_ERROR)
    }

    const parsed = createDocumentSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.format() })
    }

    const document = await documentsService.createDocument(schoolId, parsed.data)
    return res.status(201).json(document)
  } catch (error) {
    next(error)
  }
}

export async function deleteDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = req.user?.schoolId
    if (!schoolId) {
      throw new AppError('Tenant ID is required', 400, ERROR_CODES.VALIDATION_ERROR)
    }

    const { id } = req.params
    const result = await documentsService.deleteDocument(id, schoolId)
    return res.json(result)
  } catch (error) {
    next(error)
  }
}
