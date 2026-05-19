import type { NextFunction, Request, Response } from 'express'
import { AppError } from '../../shared/errors/AppError'
import { ERROR_CODES } from '../../shared/errors/error-codes'
import { createGroupSchema, groupIdParamsSchema, listGroupsQuerySchema, updateGroupSchema } from './groups.schema'
import * as groupsService from './groups.service'

function getSchoolId(req: Request) {
  const schoolId = req.user?.schoolId
  if (!schoolId) {
    throw new AppError('Tenant da escola nao identificado', 401, ERROR_CODES.TENANT_REQUIRED)
  }
  return schoolId
}

export async function listGroups(req: Request, res: Response, next: NextFunction) {
  try {
    const query = listGroupsQuerySchema.parse(req.query)
    res.json(await groupsService.listGroups(getSchoolId(req), query))
  } catch (error) {
    next(error)
  }
}

export async function createGroup(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createGroupSchema.parse(req.body)
    res.status(201).json(await groupsService.createGroup(getSchoolId(req), input))
  } catch (error) {
    next(error)
  }
}

export async function updateGroup(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = groupIdParamsSchema.parse(req.params)
    const input = updateGroupSchema.parse(req.body)
    res.json(await groupsService.updateGroup(getSchoolId(req), id, input))
  } catch (error) {
    next(error)
  }
}

export async function deleteGroup(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = groupIdParamsSchema.parse(req.params)
    await groupsService.deleteGroup(getSchoolId(req), id)
    res.status(204).end()
  } catch (error) {
    next(error)
  }
}
