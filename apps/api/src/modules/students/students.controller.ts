import type { NextFunction, Request, Response } from 'express'
import { AppError } from '../../shared/errors/AppError'
import { ERROR_CODES } from '../../shared/errors/error-codes'
import { createStudentSchema, studentIdParamsSchema } from './students.schema'
import * as studentsService from './students.service'

function getSchoolId(req: Request) {
  const schoolId = req.user?.schoolId
  if (!schoolId) {
    throw new AppError('Tenant da escola nao identificado', 401, ERROR_CODES.TENANT_REQUIRED)
  }
  return schoolId
}

export async function listStudents(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await studentsService.listStudents(getSchoolId(req)))
  } catch (error) {
    next(error)
  }
}

export async function getStudent(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = studentIdParamsSchema.parse(req.params)
    res.json(await studentsService.getStudent(getSchoolId(req), id))
  } catch (error) {
    next(error)
  }
}

export async function createStudent(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createStudentSchema.parse(req.body)
    res.status(201).json(await studentsService.createStudent(getSchoolId(req), input))
  } catch (error) {
    next(error)
  }
}
