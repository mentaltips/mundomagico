import type { NextFunction, Request, Response } from 'express'
import { AppError } from '../shared/errors/AppError'
import { ERROR_CODES } from '../shared/errors/error-codes'

const WINDOW_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 5

type LoginAttempt = {
  count: number
  resetAt: number
}

const attempts = new Map<string, LoginAttempt>()

function normalizeEmail(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : 'unknown'
}

function getClientKey(req: Request) {
  const forwardedFor = req.headers['x-forwarded-for']
  const ip = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : forwardedFor?.split(',')[0]?.trim() || req.ip || req.socket.remoteAddress || 'unknown'

  return `${ip}:${normalizeEmail(req.body?.email)}`
}

export function loginRateLimit(req: Request, _res: Response, next: NextFunction) {
  const now = Date.now()
  const key = getClientKey(req)
  const current = attempts.get(key)

  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return next()
  }

  if (current.count >= MAX_ATTEMPTS) {
    return next(new AppError('Muitas tentativas de login. Tente novamente em alguns minutos.', 429, ERROR_CODES.RATE_LIMITED))
  }

  current.count += 1
  return next()
}
