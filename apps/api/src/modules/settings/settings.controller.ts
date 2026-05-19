import type { NextFunction, Request, Response } from 'express'
import { AppError } from '../../shared/errors/AppError'
import { ERROR_CODES } from '../../shared/errors/error-codes'
import { updateInstitutionTypeSchema, updateSettingsSchema } from './settings.schema'
import * as settingsService from './settings.service'

function getSchoolId(req: Request) {
  const schoolId = req.user?.schoolId
  if (!schoolId) {
    throw new AppError('Tenant da escola nao identificado', 401, ERROR_CODES.TENANT_REQUIRED)
  }
  return schoolId
}

export async function getSettings(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await settingsService.getSettings(getSchoolId(req)))
  } catch (error) {
    next(error)
  }
}

export async function updateSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const input = updateSettingsSchema.parse(req.body)
    res.json(await settingsService.updateSettings(getSchoolId(req), input))
  } catch (error) {
    next(error)
  }
}

export async function getInstitutionType(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await settingsService.getInstitutionType(getSchoolId(req)))
  } catch (error) {
    next(error)
  }
}

export async function updateInstitutionType(req: Request, res: Response, next: NextFunction) {
  try {
    const input = updateInstitutionTypeSchema.parse(req.body)
    res.json(await settingsService.updateInstitutionType(getSchoolId(req), input))
  } catch (error) {
    next(error)
  }
}
