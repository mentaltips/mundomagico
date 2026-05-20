import { Request, Response, NextFunction } from 'express'
import { getAttendanceSchema, registerAttendanceSchema } from './teacher.schema'
import * as teacherService from './teacher.service'
import { AppError } from '../../shared/errors/AppError'
import { ERROR_CODES } from '../../shared/errors/error-codes'

export async function getDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = req.user?.schoolId
    const userId = req.user?.sub
    const role = req.user?.role

    if (!schoolId || !userId) {
      throw new AppError('Missing user or school context', 400, ERROR_CODES.VALIDATION_ERROR)
    }

    const data = await teacherService.getDashboardData(schoolId, userId, role)
    return res.json(data)
  } catch (error) {
    next(error)
  }
}

export async function getClasses(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = req.user?.schoolId
    const userId = req.user?.sub
    const role = req.user?.role

    if (!schoolId || !userId) {
      throw new AppError('Missing user or school context', 400, ERROR_CODES.VALIDATION_ERROR)
    }

    const classes = await teacherService.getClasses(schoolId, userId, role)
    return res.json(classes)
  } catch (error) {
    next(error)
  }
}

export async function getClassDetails(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = req.user?.schoolId
    const userId = req.user?.sub
    const role = req.user?.role
    const groupId = req.params.id

    if (!schoolId || !userId) {
      throw new AppError('Missing user or school context', 400, ERROR_CODES.VALIDATION_ERROR)
    }

    const group = await teacherService.getClassDetails(groupId, schoolId, userId, role)
    return res.json(group)
  } catch (error) {
    next(error)
  }
}

export async function getAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = req.user?.schoolId
    const userId = req.user?.sub
    const role = req.user?.role

    if (!schoolId || !userId) {
      throw new AppError('Missing user or school context', 400, ERROR_CODES.VALIDATION_ERROR)
    }

    const queryParsed = getAttendanceSchema.safeParse(req.query)
    if (!queryParsed.success) {
      return res.status(400).json({ error: queryParsed.error.format() })
    }

    const { date, groupId } = queryParsed.data
    const data = await teacherService.getAttendance(schoolId, userId, role, date, groupId)
    return res.json(data)
  } catch (error) {
    next(error)
  }
}

export async function registerAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = req.user?.schoolId
    const userId = req.user?.sub
    const role = req.user?.role
    const checkedById = req.user?.sub

    if (!schoolId || !userId || !checkedById) {
      throw new AppError('Missing user or school context', 400, ERROR_CODES.VALIDATION_ERROR)
    }

    const bodyParsed = registerAttendanceSchema.safeParse(req.body)
    if (!bodyParsed.success) {
      return res.status(400).json({ error: bodyParsed.error.format() })
    }

    const results = await teacherService.registerAttendance(schoolId, userId, role, checkedById, bodyParsed.data)
    return res.status(201).json(results)
  } catch (error) {
    next(error)
  }
}
