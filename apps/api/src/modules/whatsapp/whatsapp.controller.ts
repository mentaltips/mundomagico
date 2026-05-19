import type { Request, Response, NextFunction } from 'express'
import { AppError } from '../../shared/errors/AppError'
import { ERROR_CODES } from '../../shared/errors/error-codes'
import { broadcastSchema, listMessagesQuerySchema, messageIdParamsSchema } from './whatsapp.schema'
import * as whatsappService from './whatsapp.service'

function getSchoolId(req: Request) {
  const schoolId = req.user?.schoolId
  if (!schoolId) {
    throw new AppError('Tenant ID is required', 400, ERROR_CODES.TENANT_REQUIRED)
  }
  return schoolId
}

export function getStatus(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(whatsappService.getConnectionStatus(getSchoolId(req)))
  } catch (error) {
    next(error)
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    await whatsappService.logout(getSchoolId(req))
    res.json({ message: 'WhatsApp desconectado com sucesso.' })
  } catch (error) {
    next(error)
  }
}

export async function listMessages(req: Request, res: Response, next: NextFunction) {
  try {
    const query = listMessagesQuerySchema.parse(req.query)
    res.json(await whatsappService.listMessages(getSchoolId(req), query))
  } catch (error) {
    next(error)
  }
}

export async function getMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = messageIdParamsSchema.parse(req.params)
    res.json(await whatsappService.getMessage(getSchoolId(req), id))
  } catch (error) {
    next(error)
  }
}

export async function retryMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = messageIdParamsSchema.parse(req.params)
    res.json(await whatsappService.retryMessage(getSchoolId(req), id))
  } catch (error) {
    next(error)
  }
}

export async function cancelMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = messageIdParamsSchema.parse(req.params)
    res.json(await whatsappService.cancelMessage(getSchoolId(req), id))
  } catch (error) {
    next(error)
  }
}

export async function broadcast(req: Request, res: Response, next: NextFunction) {
  try {
    const input = broadcastSchema.parse(req.body)
    res.json(await whatsappService.broadcast(getSchoolId(req), input))
  } catch (error) {
    next(error)
  }
}

