import type { NextFunction, Request, Response } from 'express'
import { AppError } from '../../shared/errors/AppError'
import { ERROR_CODES } from '../../shared/errors/error-codes'
import {
  authorizedPickupParamsSchema,
  childIdParamsSchema,
  createAuthorizedPickupSchema,
  createChildSchema,
  updateChildSchema,
} from './children.schema'
import * as childrenService from './children.service'

function getSchoolId(req: Request) {
  const schoolId = req.user?.schoolId
  if (!schoolId) {
    throw new AppError('Tenant da escola nao identificado', 401, ERROR_CODES.TENANT_REQUIRED)
  }
  return schoolId
}

export async function listChildren(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await childrenService.listChildren(getSchoolId(req)))
  } catch (error) {
    next(error)
  }
}

export async function createChild(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createChildSchema.parse(req.body)
    res.status(201).json(await childrenService.createChild(getSchoolId(req), input))
  } catch (error) {
    next(error)
  }
}

export async function getChild(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = childIdParamsSchema.parse(req.params)
    res.json(await childrenService.getChild(getSchoolId(req), id))
  } catch (error) {
    next(error)
  }
}

export async function updateChild(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = childIdParamsSchema.parse(req.params)
    const input = updateChildSchema.parse(req.body)
    res.json(await childrenService.updateChild(getSchoolId(req), id, input))
  } catch (error) {
    next(error)
  }
}

export async function deleteChild(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = childIdParamsSchema.parse(req.params)
    res.json(await childrenService.deleteChild(getSchoolId(req), id))
  } catch (error) {
    next(error)
  }
}

export async function listGuardians(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = childIdParamsSchema.parse(req.params)
    res.json(await childrenService.listGuardians(getSchoolId(req), id))
  } catch (error) {
    next(error)
  }
}

export async function listAuthorizedPickups(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = childIdParamsSchema.parse(req.params)
    res.json(await childrenService.listAuthorizedPickups(getSchoolId(req), id))
  } catch (error) {
    next(error)
  }
}

export async function createAuthorizedPickup(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = childIdParamsSchema.parse(req.params)
    const input = createAuthorizedPickupSchema.parse(req.body)
    res.status(201).json(await childrenService.createAuthorizedPickup(getSchoolId(req), id, input))
  } catch (error) {
    next(error)
  }
}

export async function deleteAuthorizedPickup(req: Request, res: Response, next: NextFunction) {
  try {
    const { id, personId } = authorizedPickupParamsSchema.parse(req.params)
    res.json(await childrenService.deleteAuthorizedPickup(getSchoolId(req), id, personId))
  } catch (error) {
    next(error)
  }
}

export async function listDocuments(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = childIdParamsSchema.parse(req.params)
    res.json(await childrenService.listDocuments(getSchoolId(req), id))
  } catch (error) {
    next(error)
  }
}
