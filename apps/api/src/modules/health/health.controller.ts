import { Request, Response, NextFunction } from 'express'
import {
  listMedicationsSchema,
  createMedicationSchema,
  updateMedicationSchema,
  administerMedicationSchema,
} from './health.schema'
import * as healthService from './health.service'
import { AppError } from '../../shared/errors/AppError'
import { ERROR_CODES } from '../../shared/errors/error-codes'

export async function getActiveMedications(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = req.user?.schoolId
    if (!schoolId) {
      throw new AppError('School context missing', 400, ERROR_CODES.VALIDATION_ERROR)
    }

    const children = await healthService.getActiveMedicationChildren(schoolId)
    return res.json(children)
  } catch (error) {
    next(error)
  }
}

export async function getMedications(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = req.user?.schoolId
    if (!schoolId) {
      throw new AppError('School context missing', 400, ERROR_CODES.VALIDATION_ERROR)
    }

    const queryParsed = listMedicationsSchema.safeParse(req.query)
    if (!queryParsed.success) {
      return res.status(400).json({ error: queryParsed.error.format() })
    }

    const { childId, active } = queryParsed.data
    const isActive = active !== undefined ? active === 'true' : undefined

    const medications = await healthService.listMedications(schoolId, childId, isActive)
    return res.json(medications)
  } catch (error) {
    next(error)
  }
}

export async function createMedication(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = req.user?.schoolId
    if (!schoolId) {
      throw new AppError('School context missing', 400, ERROR_CODES.VALIDATION_ERROR)
    }

    const bodyParsed = createMedicationSchema.safeParse(req.body)
    if (!bodyParsed.success) {
      return res.status(400).json({ error: bodyParsed.error.format() })
    }

    const medication = await healthService.createMedication(schoolId, bodyParsed.data)
    return res.status(201).json(medication)
  } catch (error) {
    next(error)
  }
}

export async function updateMedication(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = req.user?.schoolId
    if (!schoolId) {
      throw new AppError('School context missing', 400, ERROR_CODES.VALIDATION_ERROR)
    }

    const bodyParsed = updateMedicationSchema.safeParse(req.body)
    if (!bodyParsed.success) {
      return res.status(400).json({ error: bodyParsed.error.format() })
    }

    const updated = await healthService.updateMedication(req.params.id, schoolId, bodyParsed.data)
    return res.json(updated)
  } catch (error) {
    next(error)
  }
}

export async function administerMedication(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = req.user?.schoolId
    const administeredBy = req.user?.sub

    if (!schoolId || !administeredBy) {
      throw new AppError('Missing user or school context', 400, ERROR_CODES.VALIDATION_ERROR)
    }

    const bodyParsed = administerMedicationSchema.safeParse(req.body)
    if (!bodyParsed.success) {
      return res.status(400).json({ error: bodyParsed.error.format() })
    }

    const admin = await healthService.administerMedication(
      req.params.id,
      schoolId,
      administeredBy,
      bodyParsed.data
    )
    return res.status(201).json(admin)
  } catch (error) {
    next(error)
  }
}
