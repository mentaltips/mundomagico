import type { NextFunction, Request, Response } from 'express'
import { AppError } from '../../shared/errors/AppError'
import { ERROR_CODES } from '../../shared/errors/error-codes'
import {
  createGuardianSchema,
  guardianIdParamsSchema,
  linkGuardianSchema,
  unlinkGuardianSchema,
  updateGuardianSchema,
} from './guardians.schema'
import * as guardiansService from './guardians.service'

function getSchoolId(req: Request) {
  const schoolId = req.user?.schoolId
  if (!schoolId) {
    throw new AppError('Tenant da escola nao identificado', 401, ERROR_CODES.TENANT_REQUIRED)
  }
  return schoolId
}

export async function listGuardians(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await guardiansService.listGuardians(getSchoolId(req)))
  } catch (error) {
    next(error)
  }
}

export async function createGuardian(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createGuardianSchema.parse(req.body)
    res.status(201).json(await guardiansService.createGuardian(getSchoolId(req), input))
  } catch (error) {
    next(error)
  }
}

export async function linkGuardian(req: Request, res: Response, next: NextFunction) {
  try {
    const input = linkGuardianSchema.parse(req.body)
    res.status(201).json(await guardiansService.linkGuardian(getSchoolId(req), input))
  } catch (error) {
    next(error)
  }
}

export async function getGuardian(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = guardianIdParamsSchema.parse(req.params)
    res.json(await guardiansService.getGuardian(getSchoolId(req), id))
  } catch (error) {
    next(error)
  }
}

export async function updateGuardian(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = guardianIdParamsSchema.parse(req.params)
    const input = updateGuardianSchema.parse(req.body)
    res.json(await guardiansService.updateGuardian(getSchoolId(req), id, input))
  } catch (error) {
    next(error)
  }
}

export async function unlinkGuardian(req: Request, res: Response, next: NextFunction) {
  try {
    const input = unlinkGuardianSchema.parse({ ...req.query, ...req.body })
    res.json(await guardiansService.unlinkGuardian(getSchoolId(req), input))
  } catch (error) {
    next(error)
  }
}

export async function createGuardianUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = guardianIdParamsSchema.parse(req.params)
    res.json(await guardiansService.createGuardianUser(getSchoolId(req), id))
  } catch (error) {
    next(error)
  }
}

export async function deleteGuardian(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = guardianIdParamsSchema.parse(req.params)
    res.json(await guardiansService.deleteGuardian(getSchoolId(req), id))
  } catch (error) {
    next(error)
  }
}
