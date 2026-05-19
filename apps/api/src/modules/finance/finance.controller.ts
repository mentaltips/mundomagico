import type { NextFunction, Request, Response } from 'express'
import { AppError } from '../../shared/errors/AppError'
import { ERROR_CODES } from '../../shared/errors/error-codes'
import {
  createInvoiceSchema,
  invoiceIdParamsSchema,
  listInvoicesQuerySchema,
  manualPaymentSchema,
  updateInvoiceSchema,
} from './finance.schema'
import * as financeService from './finance.service'

function getSchoolId(req: Request) {
  const schoolId = req.user?.schoolId
  if (!schoolId) {
    throw new AppError('Tenant ID is required', 400, ERROR_CODES.TENANT_REQUIRED)
  }
  return schoolId
}

export async function listInvoices(req: Request, res: Response, next: NextFunction) {
  try {
    const query = listInvoicesQuerySchema.parse(req.query)
    res.json(await financeService.listInvoices(getSchoolId(req), query))
  } catch (error) {
    next(error)
  }
}

export async function createInvoices(req: Request, res: Response, next: NextFunction) {
  try {
    const body = Array.isArray(req.body)
      ? req.body.map((item) => createInvoiceSchema.parse(item))
      : createInvoiceSchema.parse(req.body)

    res.status(201).json(await financeService.createInvoices(getSchoolId(req), body))
  } catch (error) {
    next(error)
  }
}

export async function deleteInvoice(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = invoiceIdParamsSchema.parse(req.params)
    await financeService.deleteInvoice(getSchoolId(req), id)
    res.status(204).send()
  } catch (error) {
    next(error)
  }
}

export async function getInvoiceDetails(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = invoiceIdParamsSchema.parse(req.params)
    res.json(await financeService.getInvoiceDetails(getSchoolId(req), id))
  } catch (error) {
    next(error)
  }
}

export async function updateInvoice(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = invoiceIdParamsSchema.parse(req.params)
    const input = updateInvoiceSchema.parse(req.body)
    res.json(await financeService.updateInvoice(getSchoolId(req), id, input))
  } catch (error) {
    next(error)
  }
}

export async function payInvoiceManually(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = invoiceIdParamsSchema.parse(req.params)
    const input = manualPaymentSchema.parse(req.body)
    res.json(await financeService.payInvoiceManually(getSchoolId(req), id, input))
  } catch (error) {
    next(error)
  }
}

