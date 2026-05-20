import { Request, Response, NextFunction } from 'express'
import {
  createChildItemSchema,
  updateChildItemSchema,
  registerUsageSchema,
  replenishSchema,
} from './child-items.schema'
import * as childItemsService from './child-items.service'
import { AppError } from '../../shared/errors/AppError'
import { ERROR_CODES } from '../../shared/errors/error-codes'

export async function listItems(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = req.user?.schoolId
    if (!schoolId) {
      throw new AppError('Tenant ID is required', 400, ERROR_CODES.VALIDATION_ERROR)
    }

    const { childId } = req.query
    const items = await childItemsService.listItems(schoolId, childId ? String(childId) : undefined)
    return res.json(items)
  } catch (error) {
    next(error)
  }
}

export async function createItem(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = req.user?.schoolId
    if (!schoolId) {
      throw new AppError('Tenant ID is required', 400, ERROR_CODES.VALIDATION_ERROR)
    }

    const bodyParsed = createChildItemSchema.safeParse(req.body)
    if (!bodyParsed.success) {
      return res.status(400).json({ error: bodyParsed.error.format() })
    }

    const item = await childItemsService.createItem(schoolId, bodyParsed.data)
    return res.status(201).json(item)
  } catch (error) {
    next(error)
  }
}

export async function updateItem(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = req.user?.schoolId
    if (!schoolId) {
      throw new AppError('Tenant ID is required', 400, ERROR_CODES.VALIDATION_ERROR)
    }

    const bodyParsed = updateChildItemSchema.safeParse(req.body)
    if (!bodyParsed.success) {
      return res.status(400).json({ error: bodyParsed.error.format() })
    }

    const { id } = req.params
    const item = await childItemsService.updateItem(id, schoolId, bodyParsed.data)
    return res.json(item)
  } catch (error) {
    next(error)
  }
}

export async function deleteItem(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = req.user?.schoolId
    if (!schoolId) {
      throw new AppError('Tenant ID is required', 400, ERROR_CODES.VALIDATION_ERROR)
    }

    const { id } = req.params
    const result = await childItemsService.deleteItem(id, schoolId)
    return res.json(result)
  } catch (error) {
    next(error)
  }
}

export async function registerUsage(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = req.user?.schoolId
    if (!schoolId) {
      throw new AppError('Tenant ID is required', 400, ERROR_CODES.VALIDATION_ERROR)
    }

    const bodyParsed = registerUsageSchema.safeParse(req.body)
    if (!bodyParsed.success) {
      return res.status(400).json({ error: bodyParsed.error.format() })
    }

    const { id } = req.params
    const usage = await childItemsService.registerUsage(id, schoolId, bodyParsed.data)
    return res.status(201).json(usage)
  } catch (error) {
    next(error)
  }
}

export async function replenishStock(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = req.user?.schoolId
    if (!schoolId) {
      throw new AppError('Tenant ID is required', 400, ERROR_CODES.VALIDATION_ERROR)
    }

    const bodyParsed = replenishSchema.safeParse(req.body)
    if (!bodyParsed.success) {
      return res.status(400).json({ error: bodyParsed.error.format() })
    }

    const { id } = req.params
    const item = await childItemsService.replenishStock(id, schoolId, bodyParsed.data)
    return res.json(item)
  } catch (error) {
    next(error)
  }
}
