import type { NextFunction, Request, Response } from 'express'
import { AppError } from '../../shared/errors/AppError'
import { ERROR_CODES } from '../../shared/errors/error-codes'
import { generateMonthlySchema, previewMonthlyQuerySchema } from './billing.schema'
import * as billingService from './billing.service'

function getSchoolId(req: Request) {
  const schoolId = req.user?.schoolId
  if (!schoolId) {
    throw new AppError('Tenant da escola nao identificado', 401, ERROR_CODES.TENANT_REQUIRED)
  }
  return schoolId
}

export async function generateMonthly(req: Request, res: Response, next: NextFunction) {
  try {
    const input = generateMonthlySchema.parse(req.body)
    res.status(201).json(await billingService.generateMonthly(getSchoolId(req), input))
  } catch (error) {
    next(error)
  }
}

export async function previewMonthly(req: Request, res: Response, next: NextFunction) {
  try {
    const query = previewMonthlyQuerySchema.parse(req.query)
    res.json(await billingService.previewMonthly(getSchoolId(req), query))
  } catch (error) {
    next(error)
  }
}

export async function generatePaymentLink(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    res.json(await billingService.generatePaymentLink(getSchoolId(req), id))
  } catch (error) {
    next(error)
  }
}
