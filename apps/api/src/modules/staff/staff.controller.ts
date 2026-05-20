import { Request, Response, NextFunction } from 'express'
import {
  createStaffSchema,
  updateStaffSchema,
  generatePaymentsSchema,
  updatePaymentSchema,
  addBonusSchema,
  addDeductionSchema,
  assignGroupSchema,
} from './staff.schema'
import * as staffService from './staff.service'
import { AppError } from '../../shared/errors/AppError'
import { ERROR_CODES } from '../../shared/errors/error-codes'

// --- Staff CRUD ---
export async function listStaff(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = req.user?.schoolId
    if (!schoolId) {
      throw new AppError('Tenant ID is required', 400, ERROR_CODES.VALIDATION_ERROR)
    }

    const staff = await staffService.listStaff(schoolId)
    return res.json(staff)
  } catch (error) {
    next(error)
  }
}

export async function createStaff(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = req.user?.schoolId
    if (!schoolId) {
      throw new AppError('Tenant ID is required', 400, ERROR_CODES.VALIDATION_ERROR)
    }

    const bodyParsed = createStaffSchema.safeParse(req.body)
    if (!bodyParsed.success) {
      return res.status(400).json({ error: bodyParsed.error.format() })
    }

    const staff = await staffService.createStaffMember(schoolId, bodyParsed.data)
    return res.status(201).json(staff)
  } catch (error) {
    next(error)
  }
}

export async function updateStaff(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = req.user?.schoolId
    if (!schoolId) {
      throw new AppError('Tenant ID is required', 400, ERROR_CODES.VALIDATION_ERROR)
    }

    const bodyParsed = updateStaffSchema.safeParse(req.body)
    if (!bodyParsed.success) {
      return res.status(400).json({ error: bodyParsed.error.format() })
    }

    const { id } = req.params
    const staff = await staffService.updateStaffMember(id, schoolId, bodyParsed.data)
    return res.json(staff)
  } catch (error) {
    next(error)
  }
}

export async function deleteStaff(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = req.user?.schoolId
    if (!schoolId) {
      throw new AppError('Tenant ID is required', 400, ERROR_CODES.VALIDATION_ERROR)
    }

    const { id } = req.params
    const result = await staffService.deleteStaffMember(id, schoolId)
    return res.status(204).json(result)
  } catch (error) {
    next(error)
  }
}

// --- Group Assignments ---
export async function assignGroup(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = req.user?.schoolId
    if (!schoolId) {
      throw new AppError('Tenant ID is required', 400, ERROR_CODES.VALIDATION_ERROR)
    }

    const bodyParsed = assignGroupSchema.safeParse(req.body)
    if (!bodyParsed.success) {
      return res.status(400).json({ error: bodyParsed.error.format() })
    }

    const { id } = req.params
    const assignment = await staffService.assignToGroup(id, schoolId, bodyParsed.data)
    return res.status(201).json(assignment)
  } catch (error) {
    next(error)
  }
}

export async function removeGroupAssignment(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = req.user?.schoolId
    if (!schoolId) {
      throw new AppError('Tenant ID is required', 400, ERROR_CODES.VALIDATION_ERROR)
    }

    const { id, assignmentId } = req.params
    const result = await staffService.removeAssignment(id, assignmentId, schoolId)
    return res.status(204).json(result)
  } catch (error) {
    next(error)
  }
}

// --- Payments ---
export async function getPayments(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = req.user?.schoolId
    if (!schoolId) {
      throw new AppError('Tenant ID is required', 400, ERROR_CODES.VALIDATION_ERROR)
    }

    const { month, year, staffId, status } = req.query
    const payments = await staffService.listPayments(schoolId, {
      month: month ? String(month) : undefined,
      year: year ? String(year) : undefined,
      staffId: staffId ? String(staffId) : undefined,
      status: status ? String(status) : undefined,
    })
    return res.json(payments)
  } catch (error) {
    next(error)
  }
}

export async function generatePayments(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = req.user?.schoolId
    const createdBy = req.user?.sub || 'SYSTEM'
    if (!schoolId) {
      throw new AppError('Tenant ID is required', 400, ERROR_CODES.VALIDATION_ERROR)
    }

    const bodyParsed = generatePaymentsSchema.safeParse(req.body)
    if (!bodyParsed.success) {
      return res.status(400).json({ error: bodyParsed.error.format() })
    }

    const result = await staffService.generatePayments(schoolId, createdBy, bodyParsed.data)
    return res.status(201).json(result)
  } catch (error) {
    next(error)
  }
}

export async function updatePayment(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = req.user?.schoolId
    if (!schoolId) {
      throw new AppError('Tenant ID is required', 400, ERROR_CODES.VALIDATION_ERROR)
    }

    const bodyParsed = updatePaymentSchema.safeParse(req.body)
    if (!bodyParsed.success) {
      return res.status(400).json({ error: bodyParsed.error.format() })
    }

    const { paymentId } = req.params
    const updated = await staffService.updatePaymentSheet(paymentId, schoolId, bodyParsed.data)
    return res.json(updated)
  } catch (error) {
    next(error)
  }
}

export async function addBonus(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = req.user?.schoolId
    const createdBy = req.user?.sub || 'SYSTEM'
    if (!schoolId) {
      throw new AppError('Tenant ID is required', 400, ERROR_CODES.VALIDATION_ERROR)
    }

    const bodyParsed = addBonusSchema.safeParse(req.body)
    if (!bodyParsed.success) {
      return res.status(400).json({ error: bodyParsed.error.format() })
    }

    const { paymentId } = req.params
    const bonus = await staffService.addPaymentBonus(paymentId, schoolId, createdBy, bodyParsed.data)
    return res.status(201).json(bonus)
  } catch (error) {
    next(error)
  }
}

export async function addDeduction(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = req.user?.schoolId
    const createdBy = req.user?.sub || 'SYSTEM'
    if (!schoolId) {
      throw new AppError('Tenant ID is required', 400, ERROR_CODES.VALIDATION_ERROR)
    }

    const bodyParsed = addDeductionSchema.safeParse(req.body)
    if (!bodyParsed.success) {
      return res.status(400).json({ error: bodyParsed.error.format() })
    }

    const { paymentId } = req.params
    const deduction = await staffService.addPaymentDeduction(paymentId, schoolId, createdBy, bodyParsed.data)
    return res.status(201).json(deduction)
  } catch (error) {
    next(error)
  }
}
