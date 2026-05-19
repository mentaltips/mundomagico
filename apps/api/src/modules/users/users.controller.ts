import type { NextFunction, Request, Response } from 'express'
import { AppError } from '../../shared/errors/AppError'
import { ERROR_CODES } from '../../shared/errors/error-codes'
import { createUserSchema, updateUserSchema, userIdParamsSchema } from './users.schema'
import * as usersService from './users.service'

function getSchoolId(req: Request) {
  const schoolId = req.user?.schoolId
  if (!schoolId) {
    throw new AppError('Tenant da escola nao identificado', 401, ERROR_CODES.TENANT_REQUIRED)
  }
  return schoolId
}

export async function listUsers(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await usersService.listUsers(getSchoolId(req)))
  } catch (error) {
    next(error)
  }
}

export async function createUser(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createUserSchema.parse(req.body)
    res.status(201).json(await usersService.createUser(getSchoolId(req), input))
  } catch (error) {
    next(error)
  }
}

export async function getUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = userIdParamsSchema.parse(req.params)
    res.json(await usersService.getUser(getSchoolId(req), id))
  } catch (error) {
    next(error)
  }
}

export async function updateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = userIdParamsSchema.parse(req.params)
    const input = updateUserSchema.parse(req.body)
    res.json(await usersService.updateUser(getSchoolId(req), id, input))
  } catch (error) {
    next(error)
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = userIdParamsSchema.parse(req.params)
    res.json(await usersService.resetPassword(getSchoolId(req), id))
  } catch (error) {
    next(error)
  }
}

export async function deactivateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = userIdParamsSchema.parse(req.params)
    res.json(await usersService.deactivateUser(getSchoolId(req), id))
  } catch (error) {
    next(error)
  }
}
