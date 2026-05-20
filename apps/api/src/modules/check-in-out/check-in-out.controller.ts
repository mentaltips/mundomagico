import { Request, Response, NextFunction } from 'express'
import {
  checkInOutSchema,
  queryCheckInOutSchema,
  listChildrenCheckInOutSchema,
  monthlyReportQuerySchema,
} from './check-in-out.schema'
import * as checkInOutService from './check-in-out.service'
import { AppError } from '../../shared/errors/AppError'
import { ERROR_CODES } from '../../shared/errors/error-codes'

export async function listRecords(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = req.user?.schoolId
    if (!schoolId) {
      throw new AppError('Tenant ID is required', 400, ERROR_CODES.VALIDATION_ERROR)
    }

    const parsed = queryCheckInOutSchema.safeParse(req.query)
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.format() })
    }

    const records = await checkInOutService.listRecords(schoolId, parsed.data)
    return res.json(records)
  } catch (error) {
    next(error)
  }
}

export async function registerCheckInOut(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = req.user?.schoolId
    if (!schoolId) {
      throw new AppError('Tenant ID is required', 400, ERROR_CODES.VALIDATION_ERROR)
    }

    const checkedById = req.user?.sub

    const parsed = checkInOutSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.format() })
    }

    const record = await checkInOutService.registerCheckInOut(schoolId, checkedById, parsed.data)
    return res.status(201).json(record)
  } catch (error) {
    next(error)
  }
}

export async function listChildrenStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = req.user?.schoolId
    if (!schoolId) {
      throw new AppError('Tenant ID is required', 400, ERROR_CODES.VALIDATION_ERROR)
    }

    const parsed = listChildrenCheckInOutSchema.safeParse(req.query)
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.format() })
    }

    const children = await checkInOutService.listChildrenStatus(schoolId, parsed.data)
    return res.json(children)
  } catch (error) {
    next(error)
  }
}

export async function getMonthlyReport(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = req.user?.schoolId
    if (!schoolId) {
      throw new AppError('Tenant ID is required', 400, ERROR_CODES.VALIDATION_ERROR)
    }

    const parsed = monthlyReportQuerySchema.safeParse(req.query)
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.format() })
    }

    const report = await checkInOutService.getMonthlyReport(schoolId, parsed.data)
    return res.json(report)
  } catch (error) {
    next(error)
  }
}
