import { Request, Response, NextFunction } from 'express'
import { getFeedSchema, parentCalendarQuerySchema, payInvoiceSchema } from './parent.schema'
import * as parentService from './parent.service'
import { AppError } from '../../shared/errors/AppError'
import { ERROR_CODES } from '../../shared/errors/error-codes'

export async function getDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = req.user?.schoolId
    const userId = req.user?.sub

    if (!schoolId || !userId) {
      throw new AppError('Missing user or school context', 400, ERROR_CODES.VALIDATION_ERROR)
    }

    const data = await parentService.getParentDashboard(schoolId, userId)
    return res.json(data)
  } catch (error) {
    next(error)
  }
}

export async function getFeed(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = req.user?.schoolId
    const userId = req.user?.sub

    if (!schoolId || !userId) {
      throw new AppError('Missing user or school context', 400, ERROR_CODES.VALIDATION_ERROR)
    }

    const queryParsed = getFeedSchema.safeParse(req.query)
    if (!queryParsed.success) {
      return res.status(400).json({ error: queryParsed.error.format() })
    }

    const page = queryParsed.data.page ? parseInt(queryParsed.data.page) : 1
    const limit = queryParsed.data.limit ? parseInt(queryParsed.data.limit) : 20

    const data = await parentService.getParentFeed(schoolId, userId, page, limit)
    return res.json(data)
  } catch (error) {
    next(error)
  }
}

export async function listMyInvoices(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = req.user?.schoolId
    const userId = req.user?.sub

    if (!schoolId || !userId) {
      throw new AppError('Missing user or school context', 400, ERROR_CODES.VALIDATION_ERROR)
    }

    const data = await parentService.getParentInvoices(schoolId, userId)
    return res.json(data)
  } catch (error) {
    next(error)
  }
}

export async function listMyCalendar(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = req.user?.schoolId
    const userId = req.user?.sub

    if (!schoolId || !userId) {
      throw new AppError('Missing user or school context', 400, ERROR_CODES.VALIDATION_ERROR)
    }

    const query = parentCalendarQuerySchema.parse(req.query)
    const data = await parentService.getParentCalendar(schoolId, userId, query)
    return res.json(data)
  } catch (error) {
    next(error)
  }
}

export async function listMyPhotos(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = req.user?.schoolId
    const userId = req.user?.sub

    if (!schoolId || !userId) {
      throw new AppError('Missing user or school context', 400, ERROR_CODES.VALIDATION_ERROR)
    }

    const data = await parentService.getParentPhotos(schoolId, userId)
    return res.json(data)
  } catch (error) {
    next(error)
  }
}

export async function payMyInvoice(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = req.user?.schoolId
    const userId = req.user?.sub
    const invoiceId = req.params.id
    const { method, payerCpf } = payInvoiceSchema.parse(req.body)

    if (!schoolId || !userId) {
      throw new AppError('Missing user or school context', 400, ERROR_CODES.VALIDATION_ERROR)
    }

    const data = await parentService.payParentInvoice(schoolId, userId, invoiceId, method, payerCpf)
    return res.json(data)
  } catch (error) {
    next(error)
  }
}
