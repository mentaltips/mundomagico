import { Request, Response, NextFunction } from 'express'
import { createReportSchema, updateReportSchema } from './development-reports.schema'
import * as reportsService from './development-reports.service'
import { AppError } from '../../shared/errors/AppError'
import { ERROR_CODES } from '../../shared/errors/error-codes'

export async function listReports(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = req.user?.schoolId
    if (!schoolId) {
      throw new AppError('Tenant ID is required', 400, ERROR_CODES.VALIDATION_ERROR)
    }

    const { childId, isDraft } = req.query
    const reports = await reportsService.listReports(schoolId, {
      childId: childId ? String(childId) : undefined,
      isDraft: isDraft ? String(isDraft) : undefined,
    })
    return res.json(reports)
  } catch (error) {
    next(error)
  }
}

export async function getReport(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = req.user?.schoolId
    if (!schoolId) {
      throw new AppError('Tenant ID is required', 400, ERROR_CODES.VALIDATION_ERROR)
    }

    const { id } = req.params
    const report = await reportsService.getReportById(id, schoolId)
    return res.json(report)
  } catch (error) {
    next(error)
  }
}

export async function createReport(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = req.user?.schoolId
    const createdBy = req.user?.sub as string
    if (!schoolId) {
      throw new AppError('Tenant ID is required', 400, ERROR_CODES.VALIDATION_ERROR)
    }

    const bodyParsed = createReportSchema.safeParse(req.body)
    if (!bodyParsed.success) {
      return res.status(400).json({ error: bodyParsed.error.format() })
    }

    const report = await reportsService.createReport(schoolId, createdBy, bodyParsed.data)
    return res.status(201).json(report)
  } catch (error) {
    next(error)
  }
}

export async function updateReport(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = req.user?.schoolId
    if (!schoolId) {
      throw new AppError('Tenant ID is required', 400, ERROR_CODES.VALIDATION_ERROR)
    }

    const bodyParsed = updateReportSchema.safeParse(req.body)
    if (!bodyParsed.success) {
      return res.status(400).json({ error: bodyParsed.error.format() })
    }

    const { id } = req.params
    const report = await reportsService.updateReport(id, schoolId, bodyParsed.data)
    return res.json(report)
  } catch (error) {
    next(error)
  }
}

export async function deleteReport(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = req.user?.schoolId
    if (!schoolId) {
      throw new AppError('Tenant ID is required', 400, ERROR_CODES.VALIDATION_ERROR)
    }

    const { id } = req.params
    const result = await reportsService.deleteReport(id, schoolId)
    return res.json(result)
  } catch (error) {
    next(error)
  }
}

export async function publishReport(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = req.user?.schoolId
    if (!schoolId) {
      throw new AppError('Tenant ID is required', 400, ERROR_CODES.VALIDATION_ERROR)
    }

    const { id } = req.params
    const report = await reportsService.publishReport(id, schoolId)
    return res.json(report)
  } catch (error) {
    next(error)
  }
}
